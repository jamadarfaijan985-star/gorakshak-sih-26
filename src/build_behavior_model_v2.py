import os
import json
import numpy as np
import pandas as pd

# ============================================================
# GoRakshak - Behavioral Deviation Model V2
# ============================================================
#
# Purpose:
#   Convert raw milking-robot observations into cow-day
#   behavioral features and calculate robust individual
#   behavioral deviation.
#
# IMPORTANT:
#   - NO mastitis labels are created.
#   - NO mastitis classifier is trained.
#   - Rumination/activity units are NOT assumed or changed.
#   - Historical baseline excludes the current day.
#   - Small standard deviations are protected with floors.
#   - Z-scores are clipped to prevent extreme explosions.
# ============================================================


ROOT = r"D:\GoRakshak"

SOURCE = os.path.join(
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
    "behavior_model_v2"
)

os.makedirs(OUT_DIR, exist_ok=True)

OUT_DATA = os.path.join(
    OUT_DIR,
    "cow_day_behavior_v2.csv"
)

OUT_REPORT = os.path.join(
    OUT_DIR,
    "behavior_model_report_v2.json"
)


# ============================================================
# CONFIGURATION
# ============================================================

RUMINATION_STD_FLOOR = 10.0
ACTIVITY_STD_FLOOR = 5.0

Z_MIN = -5.0
Z_MAX = 5.0


# ============================================================
# 1. LOAD DATA
# ============================================================

print("=== GoRakshak Behavioral Deviation Model V2 ===")
print("\nLoading source dataset...")

df = pd.read_csv(SOURCE)

print("Raw shape:", df.shape)


required_columns = [
    "animal_id",
    "date",
    "time",
    "rumination",
    "activity"
]

missing = [
    c for c in required_columns
    if c not in df.columns
]

if missing:
    raise ValueError(
        f"Missing required columns: {missing}"
    )


# ============================================================
# 2. CLEAN
# ============================================================

df["date"] = pd.to_datetime(
    df["date"],
    errors="coerce"
)

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
# 3. RAW OBSERVATIONS -> COW-DAY
# ============================================================

print("\nAggregating observations to cow-day level...")

daily = (
    df.groupby(
        ["animal_id", "date"],
        sort=False
    )
    .agg(
        observation_count=(
            "rumination",
            "size"
        ),

        rumination_mean=(
            "rumination",
            "mean"
        ),

        rumination_median=(
            "rumination",
            "median"
        ),

        rumination_min=(
            "rumination",
            "min"
        ),

        rumination_max=(
            "rumination",
            "max"
        ),

        rumination_std=(
            "rumination",
            "std"
        ),

        activity_mean=(
            "activity",
            "mean"
        ),

        activity_median=(
            "activity",
            "median"
        ),

        activity_min=(
            "activity",
            "min"
        ),

        activity_max=(
            "activity",
            "max"
        ),

        activity_std=(
            "activity",
            "std"
        )
    )
    .reset_index()
)


daily["rumination_std"] = (
    daily["rumination_std"]
    .fillna(0)
)

daily["activity_std"] = (
    daily["activity_std"]
    .fillna(0)
)

daily["rumination_range"] = (
    daily["rumination_max"]
    - daily["rumination_min"]
)

daily["activity_range"] = (
    daily["activity_max"]
    - daily["activity_min"]
)


# ============================================================
# 4. TEMPORAL ORDER
# ============================================================

daily = daily.sort_values(
    ["animal_id", "date"]
).reset_index(drop=True)

g = daily.groupby(
    "animal_id",
    group_keys=False
)


# ============================================================
# 5. PREVIOUS OBSERVATION / CHANGE
# ============================================================

print("Creating temporal features...")

daily["rumination_prev"] = (
    g["rumination_mean"].shift(1)
)

daily["activity_prev"] = (
    g["activity_mean"].shift(1)
)

daily["rumination_delta_1d"] = (
    daily["rumination_mean"]
    - daily["rumination_prev"]
)

daily["activity_delta_1d"] = (
    daily["activity_mean"]
    - daily["activity_prev"]
)


# ============================================================
# 6. HISTORICAL BASELINES
#
# IMPORTANT:
# shift(1) excludes today's value.
# ============================================================

for window in [3, 7]:

    daily[
        f"rumination_baseline_{window}d"
    ] = (
        g["rumination_mean"]
        .transform(
            lambda s:
            s.shift(1)
            .rolling(
                window,
                min_periods=2
            )
            .mean()
        )
    )

    daily[
        f"rumination_std_{window}d"
    ] = (
        g["rumination_mean"]
        .transform(
            lambda s:
            s.shift(1)
            .rolling(
                window,
                min_periods=2
            )
            .std()
        )
    )

    daily[
        f"activity_baseline_{window}d"
    ] = (
        g["activity_mean"]
        .transform(
            lambda s:
            s.shift(1)
            .rolling(
                window,
                min_periods=2
            )
            .mean()
        )
    )

    daily[
        f"activity_std_{window}d"
    ] = (
        g["activity_mean"]
        .transform(
            lambda s:
            s.shift(1)
            .rolling(
                window,
                min_periods=2
            )
            .std()
        )
    )


# ============================================================
# 7. ROBUST Z-SCORES
# ============================================================

print("Calculating robust behavioral deviations...")


def calculate_zscore(
    value,
    baseline,
    std,
    floor
):
    if (
        pd.isna(value)
        or pd.isna(baseline)
        or pd.isna(std)
    ):
        return np.nan

    effective_std = max(
        float(std),
        floor
    )

    z = (
        float(value) - float(baseline)
    ) / effective_std

    return float(
        np.clip(
            z,
            Z_MIN,
            Z_MAX
        )
    )


daily["rumination_z_3d"] = [
    calculate_zscore(
        v,
        b,
        s,
        RUMINATION_STD_FLOOR
    )
    for v, b, s in zip(
        daily["rumination_mean"],
        daily["rumination_baseline_3d"],
        daily["rumination_std_3d"]
    )
]


daily["rumination_z_7d"] = [
    calculate_zscore(
        v,
        b,
        s,
        RUMINATION_STD_FLOOR
    )
    for v, b, s in zip(
        daily["rumination_mean"],
        daily["rumination_baseline_7d"],
        daily["rumination_std_7d"]
    )
]


daily["activity_z_3d"] = [
    calculate_zscore(
        v,
        b,
        s,
        ACTIVITY_STD_FLOOR
    )
    for v, b, s in zip(
        daily["activity_mean"],
        daily["activity_baseline_3d"],
        daily["activity_std_3d"]
    )
]


daily["activity_z_7d"] = [
    calculate_zscore(
        v,
        b,
        s,
        ACTIVITY_STD_FLOOR
    )
    for v, b, s in zip(
        daily["activity_mean"],
        daily["activity_baseline_7d"],
        daily["activity_std_7d"]
    )
]


# ============================================================
# 8. LONGER-TERM CHANGE
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
# 9. DIRECTION-AWARE BEHAVIORAL CONCERN
#
# Lower rumination = concern
# Lower activity = concern
#
# We do NOT treat increases as automatically equivalent
# health concerns.
# ============================================================

rumination_decline = (
    -daily["rumination_z_7d"]
).clip(
    lower=0
)

activity_decline = (
    -daily["activity_z_7d"]
).clip(
    lower=0
)


daily["rumination_decline_signal"] = (
    rumination_decline
)

daily["activity_decline_signal"] = (
    activity_decline
)


# ============================================================
# 10. COMBINED BEHAVIORAL ANOMALY SCORE
# ============================================================

daily["behavior_anomaly_score"] = (
    0.5 * daily["rumination_decline_signal"].fillna(0)
    +
    0.5 * daily["activity_decline_signal"].fillna(0)
)


# ============================================================
# 11. BEHAVIOR STATUS
# ============================================================

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
# 12. DATA QUALITY
# ============================================================

duplicate_cow_days = int(
    daily.duplicated(
        ["animal_id", "date"]
    ).sum()
)

missing_cells = int(
    daily.isna().sum().sum()
)

baseline_ready_rows = int(
    daily[
        daily[
            [
                "rumination_z_7d",
                "activity_z_7d"
            ]
        ]
        .notna()
        .all(axis=1)
    ]
    .shape[0]
)

status_counts = (
    daily["behavior_status"]
    .value_counts(
        dropna=False
    )
    .to_dict()
)


# ============================================================
# 13. SAVE DATASET
# ============================================================

daily.to_csv(
    OUT_DATA,
    index=False
)


# ============================================================
# 14. SAVE REPORT
# ============================================================

report = {

    "project": "GoRakshak",

    "module": (
        "Behavioral Deviation Model V2"
    ),

    "source_dataset": (
        "cow_milking_robot_harmonized.csv"
    ),

    "raw_rows": int(len(df)),

    "raw_unique_cows": int(
        df["animal_id"].nunique()
    ),

    "cow_day_rows": int(
        len(daily)
    ),

    "cow_day_unique_cows": int(
        daily["animal_id"].nunique()
    ),

    "date_min": str(
        daily["date"].min().date()
    ),

    "date_max": str(
        daily["date"].max().date()
    ),

    "duplicate_cow_days": (
        duplicate_cow_days
    ),

    "missing_cells": (
        missing_cells
    ),

    "baseline_ready_rows": (
        baseline_ready_rows
    ),

    "rumination_std_floor": (
        RUMINATION_STD_FLOOR
    ),

    "activity_std_floor": (
        ACTIVITY_STD_FLOOR
    ),

    "z_score_clip": [
        Z_MIN,
        Z_MAX
    ],

    "behavior_status_counts": {
        str(k): int(v)
        for k, v in status_counts.items()
    },

    "mastitis_label_used": False,

    "mastitis_training_performed": False,

    "source_units_assumed": False,

    "leakage_control": (
        "Historical rolling baselines use shift(1), "
        "so current-day observations are excluded "
        "from their own historical baseline."
    ),

    "interpretation": (
        "Behavior anomaly represents deviation from "
        "the individual cow's historical rumination "
        "and activity pattern. It is not a mastitis "
        "probability or diagnosis."
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
# 15. FINAL SUMMARY
# ============================================================

print("\n=== BUILD COMPLETE ===")

print(
    "Cow-day dataset:",
    OUT_DATA
)

print(
    "Report:",
    OUT_REPORT
)

print(
    "\nShape:",
    daily.shape
)

print(
    "Unique cows:",
    daily["animal_id"].nunique()
)

print(
    "Unique cow-days:",
    len(daily)
)

print(
    "\nBaseline-ready rows:",
    baseline_ready_rows
)

print(
    "\nBehavior status:"
)

print(
    daily[
        "behavior_status"
    ]
    .value_counts(
        dropna=False
    )
    .to_string()
)

print(
    "\nAnomaly score:"
)

print(
    daily[
        "behavior_anomaly_score"
    ]
    .describe()
    .to_string()
)

print(
    "\nMaximum absolute rumination z:",
    daily[
        "rumination_z_7d"
    ]
    .abs()
    .max()
)

print(
    "Maximum absolute activity z:",
    daily[
        "activity_z_7d"
    ]
    .abs()
    .max()
)

print(
    "\nMissing cells:",
    missing_cells
)

print(
    "Duplicate cow-days:",
    duplicate_cow_days
)

print(
    "\nSTATUS: ROBUST BEHAVIORAL DATASET READY."
)

print(
    "IMPORTANT: This is NOT a mastitis classifier."
)