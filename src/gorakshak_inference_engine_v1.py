import os
import json
import joblib
import numpy as np
import pandas as pd


# ============================================================
# GoRakshak Unified Inference Engine V1
# ============================================================

ROOT = r"D:\GoRakshak"

MODEL_7D_PATH = os.path.join(
    ROOT,
    "ai-ml",
    "models",
    "gorakshak_forecast_7d_xgb_v2.joblib"
)

MODEL_14D_PATH = os.path.join(
    ROOT,
    "ai-ml",
    "models",
    "gorakshak_forecast_14d_xgb_v2.joblib"
)

BEHAVIOR_PATH = os.path.join(
    ROOT,
    "ai-ml",
    "data",
    "processed",
    "behavior_model_v2",
    "behavior_latest_signals_v1.csv"
)

OUT_DIR = os.path.join(
    ROOT,
    "ai-ml",
    "data",
    "processed",
    "unified_inference_v1"
)

os.makedirs(OUT_DIR, exist_ok=True)

OUTPUT_PATH = os.path.join(
    OUT_DIR,
    "latest_unified_risk_v1.csv"
)

REPORT_PATH = os.path.join(
    OUT_DIR,
    "unified_inference_report_v1.json"
)


# ============================================================
# LOAD MODELS
# ============================================================

print("=== GoRakshak Unified Inference Engine V1 ===")

print("\nLoading 7-day model...")
package_7d = joblib.load(MODEL_7D_PATH)

print("Loading 14-day model...")
package_14d = joblib.load(MODEL_14D_PATH)

model_7d = package_7d["model"]
model_14d = package_14d["model"]

features_7d = package_7d["feature_columns"]
features_14d = package_14d["feature_columns"]

threshold_7d = float(
    package_7d["threshold"]
)

threshold_14d = float(
    package_14d["threshold"]
)


# ============================================================
# MODEL COMPATIBILITY CHECK
# ============================================================

print("\nModel metadata:")

print("7-day feature count:", len(features_7d))
print("14-day feature count:", len(features_14d))

print("7-day threshold:", threshold_7d)
print("14-day threshold:", threshold_14d)

if features_7d != features_14d:
    raise ValueError(
        "7-day and 14-day feature schemas do not match."
    )

FEATURES = features_7d


# ============================================================
# LOAD BEHAVIOR SIGNALS
# ============================================================

print("\nLoading behavioral signals...")

behavior = pd.read_csv(
    BEHAVIOR_PATH
)

behavior["date"] = pd.to_datetime(
    behavior["date"],
    errors="coerce"
)

print(
    "Behavior records:",
    len(behavior)
)

print(
    "Behavior cows:",
    behavior["animal_id"].nunique()
)


# ============================================================
# RISK LEVEL
# ============================================================

def risk_level(probability):

    if probability < 0.20:
        return "LOW"

    elif probability < 0.50:
        return "MODERATE"

    elif probability < 0.75:
        return "HIGH"

    else:
        return "VERY_HIGH"


# ============================================================
# MODEL PREDICTION
# ============================================================

X = behavior.copy()


# ============================================================
# IMPORTANT:
# The existing forecasting models were trained using the
# 72-feature forecasting dataset.
#
# We therefore do NOT inject behavioral columns directly
# into those models.
#
# This engine currently:
#   1. Reads the behavioral signal.
#   2. Verifies model schema.
#   3. Provides the behavioral signal separately.
#
# A future retrained multimodal model can explicitly include
# these behavior features.
# ============================================================


# ============================================================
# CHECK WHETHER BEHAVIOR DATA ALREADY CONTAINS ALL FEATURES
# ============================================================

missing_features = [
    c for c in FEATURES
    if c not in X.columns
]

print(
    "\nForecasting features missing from behavioral dataset:",
    len(missing_features)
)

if len(missing_features) > 0:

    print(
        "\nThis is expected."
    )

    print(
        "The behavioral dataset is NOT the forecasting dataset."
    )

    print(
        "Therefore no mastitis probability will be generated "
        "from this dataset alone."
    )

else:

    # This branch should not normally be reached.
    # It is retained for future multimodal datasets.

    X_model = X[FEATURES].copy()

    probability_7d = (
        model_7d
        .predict_proba(X_model)[:, 1]
    )

    probability_14d = (
        model_14d
        .predict_proba(X_model)[:, 1]
    )

    behavior["mastitis_risk_7d"] = (
        probability_7d
    )

    behavior["mastitis_risk_14d"] = (
        probability_14d
    )

    behavior["risk_level_7d"] = [
        risk_level(x)
        for x in probability_7d
    ]

    behavior["risk_level_14d"] = [
        risk_level(x)
        for x in probability_14d
    ]


# ============================================================
# CREATE UNIFIED SIGNAL VIEW
# ============================================================

output_columns = [
    "animal_id",
    "date",

    "rumination_mean",
    "activity_mean",

    "rumination_baseline_7d",
    "activity_baseline_7d",

    "rumination_z_7d",
    "activity_z_7d",

    "rumination_delta_1d",
    "rumination_delta_3d",
    "rumination_delta_7d",

    "activity_delta_1d",
    "activity_delta_3d",
    "activity_delta_7d",

    "behavior_anomaly_score",
    "behavior_status",

    "behavior_history_confidence"
]

output_columns = [
    c
    for c in output_columns
    if c in behavior.columns
]

result = behavior[
    output_columns
].copy()


# ============================================================
# BEHAVIOR INTERPRETATION
# ============================================================

def recommendation(status):

    if status == "HIGH_DEVIATION":

        return (
            "Significant behavioral deviation detected. "
            "Increase monitoring and check animal health "
            "indicators."
        )

    elif status == "MODERATE_DEVIATION":

        return (
            "Moderate behavioral deviation detected. "
            "Continue close monitoring."
        )

    elif status == "MILD_DEVIATION":

        return (
            "Mild behavioral deviation detected. "
            "Continue routine observation."
        )

    return (
        "No significant behavioral deviation detected."
    )


result["behavior_recommendation"] = (
    result["behavior_status"]
    .apply(recommendation)
)


# ============================================================
# SAVE
# ============================================================

result.to_csv(
    OUTPUT_PATH,
    index=False
)


# ============================================================
# REPORT
# ============================================================

report = {

    "project": "GoRakshak",

    "module": (
        "Unified Inference Engine V1"
    ),

    "forecast_model_7d": (
        os.path.basename(MODEL_7D_PATH)
    ),

    "forecast_model_14d": (
        os.path.basename(MODEL_14D_PATH)
    ),

    "forecast_feature_count": (
        len(FEATURES)
    ),

    "behavior_records": int(
        len(behavior)
    ),

    "behavior_cows": int(
        behavior["animal_id"].nunique()
    ),

    "forecast_model_direct_inference": False,

    "reason": (
        "The existing forecasting models were trained "
        "without behavioral features. The behavioral "
        "engine therefore remains an independent supporting "
        "signal until a multimodal model is explicitly "
        "retrained with behavior features."
    ),

    "mastitis_label_created": False,

    "behavior_status_distribution": {
        str(k): int(v)
        for k, v in
        result[
            "behavior_status"
        ]
        .value_counts(
            dropna=False
        )
        .items()
    },

    "output": OUTPUT_PATH
}


with open(
    REPORT_PATH,
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        report,
        f,
        indent=2
    )


# ============================================================
# FINAL OUTPUT
# ============================================================

print("\n=== UNIFIED SIGNAL BUILD COMPLETE ===")

print(
    "Behavior cows:",
    behavior["animal_id"].nunique()
)

print(
    "Forecasting feature count:",
    len(FEATURES)
)

print(
    "Behavior status:"
)

print(
    result[
        "behavior_status"
    ]
    .value_counts(
        dropna=False
    )
    .to_string()
)

print(
    "\nOutput:",
    OUTPUT_PATH
)

print(
    "Report:",
    REPORT_PATH
)

print(
    "\nSTATUS: GO RAKSHAK UNIFIED SIGNAL LAYER READY."
)

print(
    "IMPORTANT:"
)

print(
    "Existing mastitis models were NOT modified."
)

print(
    "Behavior is NOT being falsely converted into "
    "mastitis probability."
)