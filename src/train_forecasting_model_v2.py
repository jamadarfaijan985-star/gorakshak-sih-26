"""
GoRakshak — Final Forecasting Model Training V2
===============================================

Trains 7-day and 14-day mastitis forecasting models using the corrected
temporal forecasting dataset V2.

Evaluation:
  TRAIN -> fitting
  VALIDATION -> development/model-selection check
  TEST -> final untouched temporal evaluation

IMPORTANT:
This dataset is synthetic development data. Metrics are NOT clinical
validation and must not be presented as real-world accuracy.
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
DATA_DIR = ROOT / "ai-ml" / "data" / "processed" / "forecasting_v2"
MODEL_DIR = ROOT / "ai-ml" / "models"
REPORT_DIR = ROOT / "ai-ml" / "data" / "processed" / "model_training_v2"

MODEL_DIR.mkdir(parents=True, exist_ok=True)
REPORT_DIR.mkdir(parents=True, exist_ok=True)

TRAIN_FILE = DATA_DIR / "forecast_train_v1.csv"
VAL_FILE = DATA_DIR / "forecast_validation_v1.csv"
TEST_FILE = DATA_DIR / "forecast_test_v1.csv"

TARGETS = {
    "7d": "mastitis_within_7d",
    "14d": "mastitis_within_14d",
}

META_COLS = {
    "animal_id",
    "farm_id",
    "species",
    "date",
    "day_index",
    "data_origin",
}

def load_data():
    train = pd.read_csv(TRAIN_FILE)
    val = pd.read_csv(VAL_FILE)
    test = pd.read_csv(TEST_FILE)

    if not (set(train.columns) == set(val.columns) == set(test.columns)):
        raise ValueError("Train/validation/test columns do not match.")

    feature_cols = [
        c for c in train.columns
        if c not in META_COLS and c not in TARGETS.values()
    ]

    non_numeric = [
        c for c in feature_cols
        if not pd.api.types.is_numeric_dtype(train[c])
    ]
    if non_numeric:
        raise ValueError(f"Unexpected non-numeric feature columns: {non_numeric}")

    # Explicit leakage guard.
    forbidden_terms = [
        "mastitis", "target", "label", "event",
        "diagnostic", "pain", "clotting", "milk_visibility",
        "source_label"
    ]
    leaked = [
        c for c in feature_cols
        if any(term in c.lower() for term in forbidden_terms)
    ]
    if leaked:
        raise ValueError(f"Potential leakage features detected: {leaked}")

    if train[feature_cols].isna().any().any():
        raise ValueError("Missing values found in training features.")
    if val[feature_cols].isna().any().any():
        raise ValueError("Missing values found in validation features.")
    if test[feature_cols].isna().any().any():
        raise ValueError("Missing values found in test features.")

    # The corrected dataset builder is required to produce both classes.
    for split_name, frame in [
        ("TRAIN", train), ("VALIDATION", val), ("TEST", test)
    ]:
        for target in TARGETS.values():
            if frame[target].astype(int).nunique() < 2:
                raise ValueError(
                    f"{split_name} {target} does not contain both classes."
                )

    return train, val, test, feature_cols


def evaluate(y_true, prob, threshold=0.50):
    pred = (prob >= threshold).astype(int)
    cm = confusion_matrix(y_true, pred, labels=[0, 1])

    result = {
        "n": int(len(y_true)),
        "positive": int(y_true.sum()),
        "positive_rate": float(y_true.mean()),
        "threshold": float(threshold),
        "accuracy": float(accuracy_score(y_true, pred)),
        "precision": float(precision_score(y_true, pred, zero_division=0)),
        "recall": float(recall_score(y_true, pred, zero_division=0)),
        "f1": float(f1_score(y_true, pred, zero_division=0)),
        "confusion_matrix": cm.tolist(),
        "roc_auc": float(roc_auc_score(y_true, prob)),
        "pr_auc": float(average_precision_score(y_true, prob)),
    }
    return result


def train_model(name, target, X_train, y_train, X_val, y_val, X_test, y_test, features):
    pos = int(y_train.sum())
    neg = int(len(y_train) - pos)

    if pos == 0 or neg == 0:
        raise ValueError(f"{name}: training target has only one class.")

    scale_pos_weight = neg / pos

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
    print(f"Train rows:       {len(X_train):,}")
    print(f"Train positives:  {pos:,}")
    print(f"Train negatives:  {neg:,}")
    print(f"scale_pos_weight: {scale_pos_weight:.4f}")
    print("Device: CUDA")

    model.fit(
        X_train,
        y_train,
        eval_set=[(X_val, y_val)],
        verbose=False,
    )

    val_prob = model.predict_proba(X_val)[:, 1]
    test_prob = model.predict_proba(X_test)[:, 1]

    val_metrics = evaluate(y_val, val_prob)
    test_metrics = evaluate(y_test, test_prob)

    model_path = MODEL_DIR / f"gorakshak_forecast_{name}_xgb_v2.joblib"

    joblib.dump(
        {
            "model": model,
            "feature_columns": features,
            "target": target,
            "model_type": "XGBoost",
            "training_dataset": "forecasting_v2",
            "data_type": "SYNTHETIC_DEVELOPMENT",
            "clinical_validation": False,
            "threshold": 0.50,
        },
        model_path,
    )

    print(f"\n{name.upper()} VALIDATION")
    for k, v in val_metrics.items():
        print(f"  {k}: {v}")

    print(f"\n{name.upper()} FINAL TEMPORAL TEST")
    for k, v in test_metrics.items():
        print(f"  {k}: {v}")

    print(f"\nSaved: {model_path}")

    return model, val_metrics, test_metrics, model_path


def main():
    print("=== GoRakshak Final Forecasting Model Training V2 ===")

    for f in [TRAIN_FILE, VAL_FILE, TEST_FILE]:
        if not f.exists():
            raise FileNotFoundError(f"Missing dataset: {f}")

    train, val, test, feature_cols = load_data()

    X_train = train[feature_cols].astype(np.float32)
    X_val = val[feature_cols].astype(np.float32)
    X_test = test[feature_cols].astype(np.float32)

    print(f"Features: {len(feature_cols)}")
    print(
        f"Train: {len(train):,} | "
        f"Validation: {len(val):,} | "
        f"Test: {len(test):,}"
    )

    report = {
        "data_type": "SYNTHETIC_DEVELOPMENT",
        "clinical_validation": False,
        "dataset": "forecasting_v2",
        "feature_count": len(feature_cols),
        "features": feature_cols,
        "models": {},
    }

    importance_rows = []

    for name, target in TARGETS.items():
        y_train = train[target].astype(int)
        y_val = val[target].astype(int)
        y_test = test[target].astype(int)

        print(f"\n{name}:")
        print(f"  train positives      = {int(y_train.sum()):,}")
        print(f"  validation positives = {int(y_val.sum()):,}")
        print(f"  test positives       = {int(y_test.sum()):,}")

        model, val_metrics, test_metrics, model_path = train_model(
            name,
            target,
            X_train, y_train,
            X_val, y_val,
            X_test, y_test,
            feature_cols,
        )

        report["models"][name] = {
            "target": target,
            "validation": val_metrics,
            "test": test_metrics,
            "model_path": str(model_path),
        }

        for feature, importance in zip(feature_cols, model.feature_importances_):
            importance_rows.append({
                "model": name,
                "feature": feature,
                "importance": float(importance),
            })

    importance_df = pd.DataFrame(importance_rows)
    importance_path = REPORT_DIR / "feature_importance_v2.csv"
    importance_df.sort_values(
        ["model", "importance"],
        ascending=[True, False]
    ).to_csv(importance_path, index=False)

    report_path = REPORT_DIR / "training_report_v2.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print("\n=== FINAL TRAINING COMPLETE ===")
    print(f"Models:            {MODEL_DIR}")
    print(f"Feature importance:{importance_path}")
    print(f"Training report:   {report_path}")
    print("\nSTATUS: MODELS TRAINED + TEMPORAL TEST EVALUATED.")
    print("IMPORTANT: All results are synthetic-development metrics, not clinical validation.")


if __name__ == "__main__":
    main()
