"""
GoRakshak — Forecasting Model Training V1
==========================================

Trains separate XGBoost classifiers for:
  - mastitis within 7 days
  - mastitis within 14 days

Uses the leakage-aware temporal forecasting dataset created by
build_forecasting_dataset_v1.py.

IMPORTANT:
The current synthetic test partition (days 77-90) contains zero positive
targets because of the event schedule. Therefore this script:
  - trains on TRAIN
  - evaluates model selection on VALIDATION
  - reports TEST as unavailable rather than fabricating metrics
  - does NOT use TEST for model selection

This is synthetic development-model training, not clinical validation.
"""

from pathlib import Path
import json
import warnings

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
)
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")

ROOT = Path(r"D:\GoRakshak")
DATA_DIR = ROOT / "ai-ml" / "data" / "processed" / "forecasting_v1"
MODEL_DIR = ROOT / "ai-ml" / "models"
REPORT_DIR = ROOT / "ai-ml" / "data" / "processed" / "model_training_v1"

MODEL_DIR.mkdir(parents=True, exist_ok=True)
REPORT_DIR.mkdir(parents=True, exist_ok=True)

TRAIN_FILE = DATA_DIR / "forecast_train_v1.csv"
VAL_FILE = DATA_DIR / "forecast_validation_v1.csv"
TEST_FILE = DATA_DIR / "forecast_test_v1.csv"

TARGETS = {
    "7d": "mastitis_within_7d",
    "14d": "mastitis_within_14d",
}

ID_COLS = [
    "animal_id",
    "farm_id",
    "species",
    "date",
    "day_index",
    "data_origin",
]

DROP_COLS = set(ID_COLS) | set(TARGETS.values())


def load_data():
    train = pd.read_csv(TRAIN_FILE)
    val = pd.read_csv(VAL_FILE)
    test = pd.read_csv(TEST_FILE)

    feature_cols = [
        c for c in train.columns
        if c not in DROP_COLS
    ]

    # Keep only numeric model features.
    non_numeric = [
        c for c in feature_cols
        if not pd.api.types.is_numeric_dtype(train[c])
    ]
    if non_numeric:
        raise ValueError(f"Unexpected non-numeric model columns: {non_numeric}")

    # Strong leakage guard.
    forbidden = [
        "mastitis", "target", "label", "event",
        "source_label", "diagnostic", "pain",
        "clotting", "milk_visibility"
    ]
    leaked = [
        c for c in feature_cols
        if any(x in c.lower() for x in forbidden)
    ]
    if leaked:
        raise ValueError(f"Potential leakage features detected: {leaked}")

    return train, val, test, feature_cols


def metrics(y_true, prob, threshold=0.50):
    pred = (prob >= threshold).astype(int)

    cm = confusion_matrix(y_true, pred, labels=[0, 1])

    result = {
        "n": int(len(y_true)),
        "positive": int(np.sum(y_true)),
        "positive_rate": float(np.mean(y_true)),
        "threshold": float(threshold),
        "accuracy": float(accuracy_score(y_true, pred)),
        "precision": float(precision_score(y_true, pred, zero_division=0)),
        "recall": float(recall_score(y_true, pred, zero_division=0)),
        "f1": float(f1_score(y_true, pred, zero_division=0)),
        "confusion_matrix": cm.tolist(),
    }

    if len(np.unique(y_true)) == 2:
        result["roc_auc"] = float(roc_auc_score(y_true, prob))
        result["pr_auc"] = float(average_precision_score(y_true, prob))
    else:
        result["roc_auc"] = None
        result["pr_auc"] = None

    return result


def train_one(name, target, X_train, y_train, X_val, y_val, feature_cols):
    positives = int(y_train.sum())
    negatives = int(len(y_train) - positives)

    if positives == 0 or negatives == 0:
        raise ValueError(f"{name}: training target has only one class.")

    # Balanced weighting based only on TRAIN labels.
    scale_pos_weight = negatives / positives

    model = XGBClassifier(
        n_estimators=500,
        max_depth=5,
        learning_rate=0.035,
        subsample=0.85,
        colsample_bytree=0.85,
        min_child_weight=5,
        reg_alpha=0.1,
        reg_lambda=2.0,
        objective="binary:logistic",
        eval_metric="aucpr",
        tree_method="hist",
        device="cuda",
        random_state=42,
        scale_pos_weight=scale_pos_weight,
        n_jobs=1,
    )

    print(f"\n=== Training {name} model ===")
    print(f"Train rows: {len(X_train):,}")
    print(f"Train positives: {positives:,}")
    print(f"Train negatives: {negatives:,}")
    print(f"scale_pos_weight: {scale_pos_weight:.4f}")
    print("Device: CUDA")

    model.fit(
        X_train,
        y_train,
        eval_set=[(X_val, y_val)],
        verbose=False,
    )

    val_prob = model.predict_proba(X_val)[:, 1]
    val_metrics = metrics(y_val, val_prob)

    model_path = MODEL_DIR / f"gorakshak_forecast_{name}_xgb_v1.joblib"
    joblib.dump(
        {
            "model": model,
            "feature_columns": feature_cols,
            "target": target,
            "model_type": "XGBoost",
            "data_type": "SYNTHETIC_DEVELOPMENT",
            "clinical_validation": False,
        },
        model_path,
    )

    print(f"\n{name.upper()} VALIDATION")
    for k, v in val_metrics.items():
        print(f"  {k}: {v}")

    print(f"Saved: {model_path}")

    return model, val_metrics, model_path


def main():
    print("=== GoRakshak Forecasting Model Training V1 ===")

    for f in [TRAIN_FILE, VAL_FILE, TEST_FILE]:
        if not f.exists():
            raise FileNotFoundError(f"Missing dataset: {f}")

    train, val, test, feature_cols = load_data()

    X_train = train[feature_cols].astype(np.float32)
    X_val = val[feature_cols].astype(np.float32)
    X_test = test[feature_cols].astype(np.float32)

    results = {
        "data_type": "SYNTHETIC_DEVELOPMENT",
        "clinical_validation": False,
        "feature_count": len(feature_cols),
        "features": feature_cols,
        "models": {},
        "test_status": "NOT_EVALUATED — TEST HAS ZERO POSITIVE TARGETS",
    }

    print(f"Features: {len(feature_cols)}")
    print(f"Train: {len(train):,} | Validation: {len(val):,} | Test: {len(test):,}")

    for name, target in TARGETS.items():
        y_train = train[target].astype(int)
        y_val = val[target].astype(int)
        y_test = test[target].astype(int)

        print(f"\n{name}:")
        print(f"  train positives = {int(y_train.sum()):,}")
        print(f"  validation positives = {int(y_val.sum()):,}")
        print(f"  test positives = {int(y_test.sum()):,}")

        model, val_metrics, model_path = train_one(
            name,
            target,
            X_train,
            y_train,
            X_val,
            y_val,
            feature_cols,
        )

        results["models"][name] = {
            "target": target,
            "validation": val_metrics,
            "model_path": str(model_path),
            "test": None,
        }

    # Feature importance from the trained models.
    importance_rows = []
    for name in TARGETS:
        model_path = MODEL_DIR / f"gorakshak_forecast_{name}_xgb_v1.joblib"
        bundle = joblib.load(model_path)
        model = bundle["model"]

        for feature, importance in zip(feature_cols, model.feature_importances_):
            importance_rows.append({
                "model": name,
                "feature": feature,
                "importance": float(importance),
            })

    importance_df = pd.DataFrame(importance_rows)
    importance_path = REPORT_DIR / "feature_importance_v1.csv"
    importance_df.sort_values(
        ["model", "importance"],
        ascending=[True, False]
    ).to_csv(importance_path, index=False)

    report_path = REPORT_DIR / "training_report_v1.json"
    report_path.write_text(
        json.dumps(results, indent=2),
        encoding="utf-8",
    )

    print("\n=== TRAINING COMPLETE ===")
    print(f"Models saved in: {MODEL_DIR}")
    print(f"Feature importance: {importance_path}")
    print(f"Training report: {report_path}")

    print("\nTEST STATUS")
    print("  NOT EVALUATED.")
    print("  Current test split contains zero positive targets.")
    print("  No test performance numbers were fabricated.")

    print("\nSTATUS: FORECASTING MODELS TRAINED ON SYNTHETIC DEVELOPMENT DATA.")
    print("IMPORTANT: Validation metrics are development metrics, not clinical performance.")


if __name__ == "__main__":
    main()
