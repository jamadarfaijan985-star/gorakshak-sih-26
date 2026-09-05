"""
GoRakshak — Forecasting Dataset Builder V1
===========================================

Purpose
-------
Convert the frozen V2.4 synthetic longitudinal data into a leakage-aware
forecasting dataset for:
    1) mastitis within next 7 days
    2) mastitis within next 14 days

Important
---------
- Uses ONLY observations available on or before the prediction date.
- Does NOT use mastitis target columns as input features.
- Rolling features are backward-looking only.
- Splits chronologically within each animal.
- Synthetic data remains explicitly marked as development data.
- This script constructs datasets; it does not train a model.
"""

from pathlib import Path
import json
import numpy as np
import pandas as pd

ROOT = Path(r"D:\GoRakshak")
INPUT = ROOT / "ai-ml" / "data" / "synthetic" / "gorakshak_synthetic_longitudinal_v4_1.csv"
OUT_DIR = ROOT / "ai-ml" / "data" / "processed" / "forecasting_v2"
OUT_DIR.mkdir(parents=True, exist_ok=True)

ID_COLS = ["animal_id", "farm_id", "species", "date", "day_index"]

BASE_FEATURES = [
    "age_years",
    "parity",
    "days_in_milk",
    "milk_yield_kg",
    "milk_temperature",
    "milk_pH",
    "milk_conductivity",
    "scc",
    "body_temperature",
    "rumination_min",
    "activity_index",
    "feed_intake",
    "ambient_temperature",
    "humidity",
    "thi",
]

TARGETS = ["mastitis_within_7d", "mastitis_within_14d"]

ROLLING_FEATURES = [
    "milk_yield_kg",
    "milk_temperature",
    "milk_pH",
    "milk_conductivity",
    "scc",
    "body_temperature",
    "rumination_min",
    "activity_index",
    "feed_intake",
    "ambient_temperature",
    "humidity",
    "thi",
]

ROLLING_WINDOWS = [3, 7]

TRAIN_END = 63
VAL_END = 76
# Test = days 77-90


def assert_required_columns(df):
    required = ID_COLS + BASE_FEATURES + TARGETS + ["data_origin"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")


def add_backward_features(df):
    """Create only historical/current-day features; never future-looking."""
    df = df.sort_values(["animal_id", "day_index"]).copy()

    g = df.groupby("animal_id", group_keys=False)

    for feature in ROLLING_FEATURES:
        for window in ROLLING_WINDOWS:
            # shift(1) means the rolling statistic uses observations strictly
            # before today. This is maximally conservative for deployment.
            df[f"{feature}_mean_prev{window}d"] = (
                g[feature]
                .apply(lambda s: s.shift(1).rolling(window, min_periods=1).mean())
                .reset_index(level=0, drop=True)
            )

            df[f"{feature}_std_prev{window}d"] = (
                g[feature]
                .apply(lambda s: s.shift(1).rolling(window, min_periods=2).std())
                .reset_index(level=0, drop=True)
            )

    # Current-vs-history change features.
    for feature in [
        "milk_yield_kg",
        "milk_temperature",
        "milk_conductivity",
        "scc",
        "rumination_min",
        "activity_index",
        "body_temperature",
    ]:
        hist = df[f"{feature}_mean_prev7d"]
        df[f"{feature}_delta_vs_prev7d"] = df[feature] - hist

    return df


def add_temporal_features(df):
    df = df.copy()

    # These depend only on calendar position / current observation.
    df["dim_phase"] = pd.cut(
        df["days_in_milk"],
        bins=[0, 60, 120, 180, 240, 300, np.inf],
        labels=False,
        include_lowest=True,
    ).astype(float)

    df["thi_stress_flag"] = (df["thi"] >= 72.0).astype(int)

    return df


def validate_no_target_leakage(df, feature_cols):
    forbidden_tokens = [
        "mastitis",
        "target",
        "label",
        "event",
        "source_label",
        "diagnostic",
        "pain",
        "clotting",
        "milk_visibility",
    ]

    bad = []
    for c in feature_cols:
        lc = c.lower()
        if any(token in lc for token in forbidden_tokens):
            bad.append(c)

    if bad:
        raise AssertionError(f"Potential target leakage in features: {bad}")


def make_split(df):
    train = df[df["day_index"] <= TRAIN_END].copy()
    val = df[(df["day_index"] > TRAIN_END) & (df["day_index"] <= VAL_END)].copy()
    test = df[df["day_index"] > VAL_END].copy()

    return train, val, test


def split_report(train, val, test, feature_cols):
    def stats(x):
        return {
            "rows": int(len(x)),
            "animals": int(x["animal_id"].nunique()),
            "farms": int(x["farm_id"].nunique()),
            "day_min": int(x["day_index"].min()) if len(x) else None,
            "day_max": int(x["day_index"].max()) if len(x) else None,
            "positive_7d": int(x["mastitis_within_7d"].sum()),
            "positive_14d": int(x["mastitis_within_14d"].sum()),
            "positive_rate_7d": float(x["mastitis_within_7d"].mean()),
            "positive_rate_14d": float(x["mastitis_within_14d"].mean()),
        }

    # Temporal forecasting intentionally allows the same animal to appear in
    # train/validation/test because deployment predicts future days for known
    # animals. There must, however, be no date overlap.
    train_dates = set(train["date"])
    val_dates = set(val["date"])
    test_dates = set(test["date"])

    if train_dates & val_dates or train_dates & test_dates or val_dates & test_dates:
        raise AssertionError("Temporal split date overlap detected.")

    validate_no_target_leakage(train, feature_cols)

    return {
        "train": stats(train),
        "validation": stats(val),
        "test": stats(test),
        "animal_overlap_train_val": int(
            len(set(train.animal_id) & set(val.animal_id))
        ),
        "animal_overlap_train_test": int(
            len(set(train.animal_id) & set(test.animal_id))
        ),
        "animal_overlap_val_test": int(
            len(set(val.animal_id) & set(test.animal_id))
        ),
        "temporal_split": {
            "train_days": "1-63",
            "validation_days": "64-76",
            "test_days": "77-90",
        },
        "feature_count": len(feature_cols),
    }


def main():
    print("=== GoRakshak Forecasting Dataset Builder V1 ===")
    print(f"Input: {INPUT}")

    if not INPUT.exists():
        raise FileNotFoundError(f"Frozen V2.4 dataset not found: {INPUT}")

    df = pd.read_csv(INPUT)
    assert_required_columns(df)

    df["date"] = pd.to_datetime(df["date"], errors="raise")
    df = df.sort_values(["animal_id", "day_index"]).reset_index(drop=True)

    # Verify frozen dataset integrity before transformation.
    if df.isna().sum().sum() != 0:
        raise AssertionError("Input contains missing cells.")

    if df.duplicated(["animal_id", "date"]).any():
        raise AssertionError("Input contains animal-date duplicates.")

    # Build forecasting features.
    df = add_backward_features(df)
    df = add_temporal_features(df)

    # The first observation has no historical rolling mean/std for some
    # features. Fill only feature-history gaps using current values or 0 std.
    for feature in ROLLING_FEATURES:
        for window in ROLLING_WINDOWS:
            mean_col = f"{feature}_mean_prev{window}d"
            std_col = f"{feature}_std_prev{window}d"
            df[mean_col] = df[mean_col].fillna(df[feature])
            df[std_col] = df[std_col].fillna(0.0)

    for c in df.columns:
        if c.endswith("_delta_vs_prev7d"):
            df[c] = df[c].fillna(0.0)

    # Keep targets separate from features.
    history_features = [
        c for c in df.columns
        if c not in ID_COLS + TARGETS + ["data_origin"]
    ]

    validate_no_target_leakage(df, history_features)

    train, val, test = make_split(df)

    # Ensure all rows have complete model features.
    for name, part in [("train", train), ("validation", val), ("test", test)]:
        if part[history_features].isna().any().any():
            raise AssertionError(f"Missing model features in {name} split.")

    # Save compact feature matrices plus identifiers and targets.
    keep = ID_COLS + history_features + TARGETS + ["data_origin"]

    train_out = train[keep].copy()
    val_out = val[keep].copy()
    test_out = test[keep].copy()

    train_path = OUT_DIR / "forecast_train_v1.csv"
    val_path = OUT_DIR / "forecast_validation_v1.csv"
    test_path = OUT_DIR / "forecast_test_v1.csv"

    train_out.to_csv(train_path, index=False)
    val_out.to_csv(val_path, index=False)
    test_out.to_csv(test_path, index=False)

    report = split_report(train, val, test, history_features)
    report["input_rows"] = int(len(df))
    report["input_animals"] = int(df["animal_id"].nunique())
    report["input_dates"] = int(df["date"].nunique())
    report["targets"] = TARGETS
    report["base_features"] = BASE_FEATURES
    report["rolling_features"] = ROLLING_FEATURES
    report["rolling_windows"] = ROLLING_WINDOWS
    report["data_origin"] = "SYNTHETIC_DEVELOPMENT"
    report["clinical_validation_status"] = "NOT_CLINICALLY_VALIDATED"

    report_path = OUT_DIR / "forecasting_dataset_report_v1.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    feature_path = OUT_DIR / "forecast_feature_list_v1.json"
    feature_path.write_text(
        json.dumps(
            {
                "features": history_features,
                "targets": TARGETS,
                "excluded_identifiers": ID_COLS,
                "leakage_excluded": [
                    "mastitis target columns",
                    "event metadata",
                    "diagnostic/clinical outcome variables",
                ],
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    # Final evaluation guard: every split used for model evaluation must
    # contain both classes. This prevents accidental reporting of meaningless
    # test metrics when the synthetic event schedule misses the test window.
    for split_name, frame in [
        ("TRAIN", train),
        ("VALIDATION", val),
        ("TEST", test),
    ]:
        for target in ["mastitis_within_7d", "mastitis_within_14d"]:
            classes = frame[target].astype(int).nunique()
            if classes < 2:
                raise ValueError(
                    f"{split_name} {target} has only one class. "
                    "Rebuild the synthetic event schedule before training/evaluation."
                )

    print("\n=== BUILD COMPLETE ===")
    print(f"Total rows:       {len(df):,}")
    print(f"Animals:          {df.animal_id.nunique():,}")
    print(f"Feature columns:  {len(history_features):,}")
    print("\nSPLITS")
    for name, part in [("TRAIN", train), ("VALIDATION", val), ("TEST", test)]:
        print(
            f"  {name:10s}: rows={len(part):6,} | "
            f"animals={part.animal_id.nunique():3,} | "
            f"days={part.day_index.min()}-{part.day_index.max()} | "
            f"7d_pos={int(part.mastitis_within_7d.sum()):4,} | "
            f"14d_pos={int(part.mastitis_within_14d.sum()):4,}"
        )

    print("\nSaved:")
    print(f"  {train_path}")
    print(f"  {val_path}")
    print(f"  {test_path}")
    print(f"  {report_path}")
    print(f"  {feature_path}")

    print("\nSTATUS: FORECASTING DATASET CONSTRUCTED.")
    print("IMPORTANT: Synthetic development data; not clinical validation.")


if __name__ == "__main__":
    main()
