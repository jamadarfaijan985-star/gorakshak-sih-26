import os
import json
import numpy as np
import pandas as pd

# ============================================================
# GoRakshak - Behavioral Deviation Model V1
# Source: Milking Robot Dataset
#
# IMPORTANT:
# - No mastitis labels are created.
# - No source values are renamed into assumed units.
# - Raw robot observations are aggregated to cow-day level.
# - Behavioral baselines are calculated per cow.
# ============================================================

ROOT = r"D:\GoRakshak"
SRC = os.path.join(
    ROOT,
    "ai-ml",
    "data",
    "public",
    "SIH26109_harmonized_public_staging",
    "cow_milking_robot_harmonized.csv"
)

OUT_DIR = os.path.join(
    ROOT,
    "ai-ml",
    "data",
    "processed",
    "behavior_model_v1"
)

os.makedirs(OUT_DIR, exist_ok=True)

OUT_COW_DAY = os.path.join(
    OUT_DIR,
    "cow_day_behavior_v1.csv"
)

OUT_REPORT = os.path.join(
    OUT_DIR,
    "behavior_model_report_v1.json"
)


# ============================================================
# 1. LOAD
# ============================================================

print("=== GoRakshak Behavioral Model V1 ===")
print("\nLoading source dataset...")

df = pd.read_csv(SRC)

print("Raw shape:", df.shape)

required = [
    "animal_id",
    "date",
    "time",
    "rumination",
    "activity"
]

missing = [c for c in required if c not in df.columns]

if missing:
    raise ValueError(f"Missing required columns: {missing}")


# ============================================================
# 2. BASIC CLEANING
# ============================================================

df["date"] = pd.to_datetime(df["date"], errors="coerce")

df["rumination"] = pd.to_numeric(
    df["rumination"],
    errors="coerce"
)

df["activity"] = pd.to_numeric(
    df["activity"],
    errors="coerce"
)

df = df.dropna(
    subset=[
        "animal_id",
        "date",
        "rumination",
        "activity"
    ]
)

df = df.sort_values(
    ["animal_id", "date", "time"]
).reset_index(drop=True)

print("Usable rows:", len(df))
print("Unique cows:", df["animal_id"].nunique())


# ============================================================
# 3. AGGREGATE RAW OBSERVATIONS -> COW-DAY
# ============================================================

print("\nAggregating observations to cow-day level...")

group = df.groupby(
    ["animal_id", "date"],
    sort=False
)

daily = group.agg(
    observation_count=("rumination", "size"),

    rumination_mean=("rumination", "mean"),
    rumination_median=("rumination", "median"),
    rumination_min=("rumination", "min"),
    rumination_max=("rumination", "max"),
    rumination_std=("rumination", "std"),

    activity_mean=("activity", "mean"),
    activity_median=("activity", "median"),
    activity_min=("activity", "min"),
    activity_max=("activity", "max"),
    activity_std=("activity", "std"),
).reset_index()


# A cow-day with only one observation has undefined std.
daily["rumination_std"] = daily["rumination_std"].fillna(0)
daily["activity_std"] = daily["activity_std"].fillna(0)

daily["rumination_range"] = (
    daily["rumination_max"]
    - daily["rumination_min"]
)

daily["activity_range"] = (
    daily["activity_max"]
    - daily["activity_min"]
)


# ============================================================
# 4. SORT TEMPORALLY PER COW
# ============================================================

daily = daily.sort_values(
    ["animal_id", "date"]
).reset_index(drop=True)


# ============================================================
# 5. HISTORICAL FEATURES
#
# IMPORTANT:
# shift(1) means today's value NEVER contributes to
# today's historical baseline.
#
# This prevents future/current information leakage.
# ============================================================

print("Creating leakage-safe historical features...")

g = daily.groupby("animal_id", group_keys=False)


# Previous-day values
daily["rumination_prev"] = g["rumination_mean"].shift(1)
daily["activity_prev"] = g["activity_mean"].shift(1)


# Changes
daily["rumination_delta_1d"] = (
    daily["rumination_mean"]
    - daily["rumination_prev"]
)

daily["activity_delta_1d"] = (
    daily["activity_mean"]
    - daily["activity_prev"]
)


# Rolling historical baselines
for window in [3, 7]:

    daily[f"rumination_baseline_{window}d"] = (
        g["rumination_mean"]
        .transform(
            lambda s:
            s.shift(1)
             .rolling(window, min_periods=2)
             .mean()
        )
    )

    daily[f"rumination_std_{window}d"] = (
        g["rumination_mean"]
        .transform(
            lambda s:
            s.shift(1)
             .rolling(window, min_periods=2)
             .std()
        )
    )

    daily[f"activity_baseline_{window}d"] = (
        g["activity_mean"]
        .transform(
            lambda s:
            s.shift(1)
             .rolling(window, min_periods=2)
             .mean()
        )
    )

    daily[f"activity_std_{window}d"] = (
        g["activity_mean"]
        .transform(
            lambda s:
            s.shift(1)
             .rolling(window, min_periods=2)
             .std()
        )
    )


# ============================================================
# 6. INDIVIDUAL DEVIATION / Z-SCORES
# ============================================================

def safe_zscore(value, baseline, std):
    if pd.isna(baseline) or pd.isna(std):
        return np.nan

    if std < 1e-6:
        return 0.0

    return (value - baseline) / std


daily["rumination_z_3d"] = [
    safe_zscore(v, b, s)
    for v, b, s in zip(
        daily["rumination_mean"],
        daily["rumination_baseline_3d"],
        daily["rumination_std_3d"]
    )
]

daily["rumination_z_7d"] = [
    safe_zscore(v, b, s)
    for v, b, s in zip(
        daily["rumination_mean"],
        daily["rumination_baseline_7d"],
        daily["rumination_std_7d"]
    )
]

daily["activity_z_3d"] = [
    safe_zscore(v, b, s)
    for v, b, s in zip(
        daily["activity_mean"],
        daily["activity_baseline_3d"],
        daily["activity_std_3d"]
    )
]

daily["activity_z_7d"] = [
    safe_zscore(v, b, s)
    for v, b, s in zip(
        daily["activity_mean"],
        daily["activity_baseline_7d"],
        daily["activity_std_7d"]
    )
]


# ============================================================
# 7. TREND FEATURES
# ============================================================

daily["rumination_delta_3d"] = (
    daily["rumination_mean"]
    - g["rumination_mean"].shift(3)
)

daily["rumination_delta_7d"] = (
    daily["rumination_mean"]
    - g["rumination_mean"].shift(7)
)

daily["activity_delta_3d"] = (
    daily["activity_mean"]
    - g["activity_mean"].shift(3)
)

daily["activity_delta_7d"] = (
    daily["activity_mean"]
    - g["activity_mean"].shift(7)
)


# ============================================================
# 8. BEHAVIORAL ANOMALY SCORE
#
# This is NOT a mastitis probability.
# It represents behavioral deviation only.
# ============================================================

rum_z = daily["rumination_z_7d"].abs()
act_z = daily["activity_z_7d"].abs()

daily["behavior_anomaly_score"] = (
    0.5 * rum_z.fillna(0)
    + 0.5 * act_z.fillna(0)
)

# Conservative categories for dashboard use.
daily["behavior_status"] = pd.cut(
    daily["behavior_anomaly_score"],
    bins=[
        -np.inf,
        1.0,
        2.0,
        3.0,
        np.inf
    ],
    labels=[
        "NORMAL",
        "MILD_DEVIATION",
        "MODERATE_DEVIATION",
        "HIGH_DEVIATION"
    ]
)


# ============================================================
# 9. DATA QUALITY CHECKS
# ============================================================

duplicate_cow_days = daily.duplicated(
    ["animal_id", "date"]
).sum()

missing_cells = int(
    daily.isna().sum().sum()
)

behavior_counts = (
    daily["behavior_status"]
    .value_counts(dropna=False)
    .to_dict()
)


# ============================================================
# 10. SAVE
# ============================================================

daily.to_csv(
    OUT_COW_DAY,
    index=False
)


report = {
    "project": "GoRakshak",
    "module": "Behavioral Deviation Model V1",
    "source_dataset": "cow_milking_robot_harmonized.csv",

    "raw_rows": int(len(df)),
    "raw_unique_cows": int(df["animal_id"].nunique()),

    "cow_day_rows": int(len(daily)),
    "cow_day_unique_cows": int(
        daily["animal_id"].nunique()
    ),

    "date_min": str(
        daily["date"].min().date()
    ),
    "date_max": str(
        daily["date"].max().date()
    ),

    "duplicate_cow_days": int(
        duplicate_cow_days
    ),

    "missing_cells": missing_cells,

    "behavior_status_counts": {
        str(k): int(v)
        for k, v in behavior_counts.items()
    },

    "mastitis_label_used": False,

    "mastitis_training_performed": False,

    "important_note": (
        "This module learns individual behavioral deviation "
        "from rumination and activity. It does not diagnose "
        "or directly predict mastitis because the source "
        "dataset contains no direct mastitis labels."
    ),

    "unit_note": (
        "The original source units/semantic definition of "
        "rumination and activity were not assumed or changed."
    ),

    "leakage_control": (
        "Historical baselines use shift(1), so the current "
        "observation is excluded from its own baseline."
    )
}

with open(
    OUT_REPORT,
    "w",
    encoding="utf-8"
) as f:
    json.dump(
        report,
        f,
        indent=2
    )


# ============================================================
# 11. FINAL OUTPUT
# ============================================================

print("\n=== BUILD COMPLETE ===")
print("Cow-day dataset:", OUT_COW_DAY)
print("Report:", OUT_REPORT)

print("\nShape:", daily.shape)
print("Unique cows:", daily["animal_id"].nunique())
print("Unique cow-days:", len(daily))

print("\nBehavior status:")
print(
    daily["behavior_status"]
    .value_counts(dropna=False)
    .to_string()
)

print("\nMissing cells:", missing_cells)
print("Duplicate cow-days:", duplicate_cow_days)

print("\nSTATUS: BEHAVIORAL BASELINE DATASET READY.")
print("IMPORTANT: This is NOT a mastitis classifier.")