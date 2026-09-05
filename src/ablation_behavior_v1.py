import json
from pathlib import Path

import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix
)

ROOT = Path(r"D:\GoRakshak\ai-ml")
DATA = ROOT / "data" / "processed" / "forecasting_v2"
OUT = ROOT / "data" / "processed" / "ablation_v1"
OUT.mkdir(parents=True, exist_ok=True)

train = pd.read_csv(DATA / "forecast_train_v1.csv")
val = pd.read_csv(DATA / "forecast_validation_v1.csv")
test = pd.read_csv(DATA / "forecast_test_v1.csv")

targets = ["mastitis_within_7d", "mastitis_within_14d"]

# Start from the authoritative 72-feature list used by the forecasting models.
feature_info = json.load(open(DATA / "forecast_feature_list_v1.json"))
all_features = feature_info["features"]

missing = [c for c in all_features if c not in train.columns]
if missing:
    raise ValueError(f"Missing required model features: {missing}")

# "Base" = all forecasting features EXCEPT behavioral sensing features.
# This retains milk, physiological and environmental information and their
# leakage-aware temporal statistics.
behavior_keywords = (
    "rumination",
    "activity_index",
)

behavior_features = [
    c for c in all_features
    if any(k in c.lower() for k in behavior_keywords)
]
base_features = [c for c in all_features if c not in behavior_features]

print("ALL FEATURES:", len(all_features))
print("BASE FEATURES:", len(base_features))
print("BEHAVIOR FEATURES:", len(behavior_features))
print("\nBehavior block:")
print("\n".join(behavior_features))

def clean_xy(df, features, target):
    X = df[features].apply(pd.to_numeric, errors="coerce")
    y = pd.to_numeric(df[target], errors="coerce")
    # Training builder should already have complete model features, but make
    # this robust without inventing values.
    X = X.replace([np.inf, -np.inf], np.nan)
    med = X.median(numeric_only=True)
    X = X.fillna(med)
    y = y.fillna(0).astype(int)
    return X, y

def train_eval(feature_set_name, features, target):
    Xtr, ytr = clean_xy(train, features, target)
    Xv, yv = clean_xy(val, features, target)
    Xt, yt = clean_xy(test, features, target)

    pos = int(ytr.sum())
    neg = int(len(ytr) - pos)
    spw = neg / pos if pos else 1.0

    model = XGBClassifier(
        n_estimators=500,
        max_depth=5,
        learning_rate=0.035,
        subsample=0.85,
        colsample_bytree=0.85,
        min_child_weight=5,
        reg_alpha=0.1,
        reg_lambda=2.0,
        scale_pos_weight=spw,
        objective="binary:logistic",
        eval_metric="aucpr",
        tree_method="hist",
        device="cuda",
        random_state=42,
        n_jobs=4,
    )

    print(f"\nTRAINING {feature_set_name} / {target} ...")
    model.fit(Xtr, ytr, eval_set=[(Xv, yv)], verbose=False)

    rows = []
    for split_name, X, y in [
        ("validation", Xv, yv),
        ("test", Xt, yt),
    ]:
        p = model.predict_proba(X)[:, 1]
        pred = (p >= 0.5).astype(int)
        tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()

        rows.append({
            "feature_set": feature_set_name,
            "target": target,
            "split": split_name,
            "n_features": len(features),
            "positive": int(y.sum()),
            "negative": int((y == 0).sum()),
            "accuracy": accuracy_score(y, pred),
            "precision": precision_score(y, pred, zero_division=0),
            "recall": recall_score(y, pred, zero_division=0),
            "f1": f1_score(y, pred, zero_division=0),
            "roc_auc": roc_auc_score(y, p),
            "pr_auc": average_precision_score(y, p),
            "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp),
        })

    model.save_model(str(OUT / f"ablation_{feature_set_name}_{target}.json"))
    return rows

results = []

for target in targets:
    results += train_eval("BASE_NO_BEHAVIOR", base_features, target)
    results += train_eval("FULL_WITH_BEHAVIOR", all_features, target)

result_df = pd.DataFrame(results)
result_df.to_csv(OUT / "ablation_results_v1.csv", index=False)

summary = {
    "purpose": "Development-only ablation of behavioral sensing features.",
    "data_origin": "SYNTHETIC_DEVELOPMENT",
    "train_rows": len(train),
    "validation_rows": len(val),
    "test_rows": len(test),
    "all_features": len(all_features),
    "base_features": len(base_features),
    "behavior_features": behavior_features,
    "note": "No real/public mastitis labels were used for this ablation. Results must not be presented as clinical validation.",
}
json.dump(summary, open(OUT / "ablation_report_v1.json", "w"), indent=2)

print("\n===== ABLATION RESULTS =====")
print(result_df.to_string(index=False))

print("\n===== BEHAVIOR CONTRIBUTION (TEST) =====")
test_df = result_df[result_df["split"] == "test"].copy()
for target in targets:
    a = test_df[(test_df.target == target) & (test_df.feature_set == "BASE_NO_BEHAVIOR")].iloc[0]
    b = test_df[(test_df.target == target) & (test_df.feature_set == "FULL_WITH_BEHAVIOR")].iloc[0]
    print(f"\n{target}")
    for m in ["pr_auc", "roc_auc", "precision", "recall", "f1", "accuracy"]:
        print(f"{m:10s}: {a[m]:.6f} -> {b[m]:.6f}  delta={b[m]-a[m]:+.6f}")

print(f"\nSaved: {OUT}")
