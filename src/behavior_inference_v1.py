import os
import json
import numpy as np
import pandas as pd


# ============================================================
# GoRakshak - Behavioral Inference Layer V1
# ============================================================

ROOT = r"D:\GoRakshak"

SOURCE = os.path.join(
    ROOT,
    "ai-ml",
    "data",
    "processed",
    "behavior_model_v2",
    "cow_day_behavior_v2.csv"
)

OUT_DIR = os.path.join(
    ROOT,
    "ai-ml",
    "data",
    "processed",
    "behavior_model_v2"
)

OUTPUT = os.path.join(
    OUT_DIR,
    "behavior_latest_signals_v1.csv"
)

REPORT = os.path.join(
    OUT_DIR,
    "behavior_inference_report_v1.json"
)


# ============================================================
# LOAD
# ============================================================

print("=== GoRakshak Behavioral Inference Layer V1 ===")

df = pd.read_csv(SOURCE)

df["date"] = pd.to_datetime(
    df["date"],
    errors="coerce"
)

df = df.sort_values(
    ["animal_id", "date"]
).reset_index(drop=True)

print("Input shape:", df.shape)
print("Cows:", df["animal_id"].nunique())


# ============================================================
# SELECT LATEST OBSERVATION FOR EACH COW
# ============================================================

latest = (
    df.sort_values(["animal_id", "date"])
      .groupby("animal_id", as_index=False)
      .tail(1)
      .copy()
)

latest = latest.reset_index(drop=True)


# ============================================================
# SELECT DEPLOYMENT FEATURES
# ============================================================

columns = [
    "animal_id",
    "date",
    "observation_count",

    "rumination_mean",
    "activity_mean",

    "rumination_baseline_3d",
    "rumination_baseline_7d",

    "activity_baseline_3d",
    "activity_baseline_7d",

    "rumination_z_3d",
    "rumination_z_7d",

    "activity_z_3d",
    "activity_z_7d",

    "rumination_delta_1d",
    "rumination_delta_3d",
    "rumination_delta_7d",

    "activity_delta_1d",
    "activity_delta_3d",
    "activity_delta_7d",

    "rumination_decline_signal",
    "activity_decline_signal",

    "behavior_anomaly_score",
    "behavior_status"
]

latest = latest[
    [c for c in columns if c in latest.columns]
].copy()


# ============================================================
# DEPLOYMENT READINESS
# ============================================================

latest["behavior_signal_available"] = (
    latest["rumination_z_7d"].notna()
    &
    latest["activity_z_7d"].notna()
)


# ============================================================
# BEHAVIOR SIGNAL CONFIDENCE
#
# This is NOT mastitis confidence.
# It indicates how much historical behavioral information
# is available for calculating the deviation.
# ============================================================

history_days = (
    df.groupby("animal_id")
      .size()
      .rename("history_observations")
)

latest = latest.merge(
    history_days,
    on="animal_id",
    how="left"
)


def history_confidence(n):
    if n >= 14:
        return "HIGH"
    elif n >= 7:
        return "MEDIUM"
    elif n >= 3:
        return "LOW"
    return "INSUFFICIENT"


latest["behavior_history_confidence"] = (
    latest["history_observations"]
    .apply(history_confidence)
)


# ============================================================
# SAFETY CHECK
# ============================================================

latest["behavior_status"] = (
    latest["behavior_status"]
    .fillna("INSUFFICIENT_HISTORY")
)


# ============================================================
# SAVE
# ============================================================

latest.to_csv(
    OUTPUT,
    index=False
)


# ============================================================
# REPORT
# ============================================================

report = {
    "project": "GoRakshak",

    "module": (
        "Behavioral Inference Layer V1"
    ),

    "source": (
        "cow_day_behavior_v2.csv"
    ),

    "input_cow_days": int(len(df)),

    "input_cows": int(
        df["animal_id"].nunique()
    ),

    "latest_cow_records": int(
        len(latest)
    ),

    "behavior_signal_available": int(
        latest["behavior_signal_available"].sum()
    ),

    "behavior_signal_unavailable": int(
        (~latest["behavior_signal_available"]).sum()
    ),

    "status_distribution": {
        str(k): int(v)
        for k, v in
        latest["behavior_status"]
        .value_counts(dropna=False)
        .items()
    },

    "history_confidence_distribution": {
        str(k): int(v)
        for k, v in
        latest["behavior_history_confidence"]
        .value_counts(dropna=False)
        .items()
    },

    "mastitis_probability_generated": False,

    "mastitis_label_used": False,

    "interpretation": (
        "The behavioral signal represents deviation "
        "from an individual cow's historical rumination "
        "and activity pattern. It is not a mastitis "
        "diagnosis or mastitis probability."
    )
}

with open(
    REPORT,
    "w",
    encoding="utf-8"
) as f:
    json.dump(
        report,
        f,
        indent=2
    )


# ============================================================
# DISPLAY
# ============================================================

print("\n=== INFERENCE BUILD COMPLETE ===")

print(
    "Latest cow records:",
    len(latest)
)

print(
    "Behavior signal available:",
    latest["behavior_signal_available"].sum()
)

print(
    "Behavior signal unavailable:",
    (~latest["behavior_signal_available"]).sum()
)

print("\nBehavior status:")

print(
    latest[
        "behavior_status"
    ]
    .value_counts(
        dropna=False
    )
    .to_string()
)

print("\nHistory confidence:")

print(
    latest[
        "behavior_history_confidence"
    ]
    .value_counts(
        dropna=False
    )
    .to_string()
)

print(
    "\nOutput:",
    OUTPUT
)

print(
    "Report:",
    REPORT
)

print(
    "\nSTATUS: BEHAVIOR INFERENCE LAYER READY."
)

print(
    "IMPORTANT: Behavior status is NOT mastitis diagnosis."
)