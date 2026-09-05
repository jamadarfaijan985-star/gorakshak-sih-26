import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap

ROOT = Path(r"D:\GoRakshak\ai-ml")
DATA = ROOT / "data" / "processed" / "forecasting_v2"
MODELS = ROOT / "models"
OUT = ROOT / "data" / "processed" / "shap_analysis_v1"
OUT.mkdir(parents=True, exist_ok=True)

train = pd.read_csv(DATA / "forecast_train_v1.csv")
val = pd.read_csv(DATA / "forecast_validation_v1.csv")
test = pd.read_csv(DATA / "forecast_test_v1.csv")

for horizon, target in [
    ("7d", "mastitis_within_7d"),
    ("14d", "mastitis_within_14d"),
]:
    model_path = MODELS / f"gorakshak_forecast_{horizon}_xgb_v2.joblib"
    package = joblib.load(model_path)
    model = package["model"]
    features = package["feature_columns"]

    # Use the temporal test set only. This is evaluation/explanation data,
    # not additional training data.
    X = test[features].apply(pd.to_numeric, errors="coerce")
    X = X.replace([np.inf, -np.inf], np.nan)
    X = X.fillna(X.median())

    # Keep the sample manageable and reproducible while retaining positives.
    pos_idx = test.index[test[target] == 1].tolist()
    neg_idx = test.index[test[target] == 0].tolist()
    rng = np.random.default_rng(42)
    n_neg = min(len(neg_idx), max(400, len(pos_idx) * 10))
    selected = pos_idx + rng.choice(neg_idx, size=n_neg, replace=False).tolist()
    selected = sorted(set(selected))

    Xs = X.loc[selected]

    print("\n" + "=" * 70)
    print(f"SHAP ANALYSIS — {horizon.upper()}")
    print("=" * 70)
    print("Model:", model_path)
    print("Test sample:", len(Xs))
    print("Positive cases:", int(test.loc[selected, target].sum()))

    # TreeExplainer is appropriate for the XGBoost tree model.
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(Xs)

    # Current SHAP versions may return an ndarray for binary XGBoost.
    if isinstance(shap_values, list):
        sv = np.asarray(shap_values[-1])
    else:
        sv = np.asarray(shap_values)

    if sv.ndim == 3:
        sv = sv[:, :, -1]

    mean_abs = np.abs(sv).mean(axis=0)
    mean_signed = sv.mean(axis=0)

    importance = pd.DataFrame({
        "feature": features,
        "mean_abs_shap": mean_abs,
        "mean_signed_shap": mean_signed,
    }).sort_values("mean_abs_shap", ascending=False).reset_index(drop=True)

    importance["rank"] = np.arange(1, len(importance) + 1)
    importance.to_csv(
        OUT / f"shap_global_importance_{horizon}.csv",
        index=False
    )

    print("\nTOP 20 GLOBAL SHAP FEATURES")
    print(
        importance.head(20)[
            ["rank", "feature", "mean_abs_shap", "mean_signed_shap"]
        ].to_string(index=False)
    )

    # Directional association: for each feature, compare SHAP sign with
    # whether the raw feature is above/below its test median. This is only
    # a descriptive diagnostic, not a causal relationship.
    directional = []
    for j, feature in enumerate(features):
        vals = Xs[feature].to_numpy()
        sh = sv[:, j]
        med = np.nanmedian(vals)

        high = sh[vals >= med]
        low = sh[vals < med]

        directional.append({
            "feature": feature,
            "median_test_value": float(med),
            "mean_shap_when_high": float(np.mean(high)) if len(high) else np.nan,
            "mean_shap_when_low": float(np.mean(low)) if len(low) else np.nan,
            "mean_abs_shap": float(np.mean(np.abs(sh))),
        })

    directional_df = pd.DataFrame(directional).sort_values(
        "mean_abs_shap", ascending=False
    )
    directional_df.to_csv(
        OUT / f"shap_directional_diagnostic_{horizon}.csv",
        index=False
    )

    # Save per-row SHAP values for reproducible case explanations.
    case_df = Xs.copy()
    case_df.insert(0, "row_index", selected)
    case_df.insert(1, "actual_target", test.loc[selected, target].astype(int).to_numpy())
    case_df.insert(
        2,
        "predicted_probability",
        model.predict_proba(Xs)[:, 1]
    )

    for j, feature in enumerate(features):
        case_df[f"shap__{feature}"] = sv[:, j]

    case_df.to_csv(
        OUT / f"shap_case_values_{horizon}.csv",
        index=False
    )

    # Explain one highest-risk test case and one positive case with the
    # strongest probability, using SHAP contribution magnitude.
    case_df["_abs_shap_sum"] = np.sum(
        np.abs(case_df[[f"shap__{f}" for f in features]].to_numpy()),
        axis=1
    )

    top_risk = case_df.sort_values("predicted_probability", ascending=False).iloc[0]
    positive_cases = case_df[case_df.actual_target == 1]
    top_positive = (
        positive_cases.sort_values("predicted_probability", ascending=False).iloc[0]
        if len(positive_cases) else top_risk
    )

    for label, row in [("highest_risk_test_case", top_risk),
                       ("highest_probability_true_positive", top_positive)]:
        contrib = pd.DataFrame({
            "feature": features,
            "feature_value": [row[f] for f in features],
            "shap_value": [row[f"shap__{f}"] for f in features],
        })
        contrib["abs_shap"] = contrib["shap_value"].abs()
        contrib["direction"] = np.where(
            contrib["shap_value"] >= 0,
            "INCREASES_RISK",
            "DECREASES_RISK"
        )
        contrib = contrib.sort_values("abs_shap", ascending=False)
        contrib.to_csv(
            OUT / f"{horizon}_{label}_explanation.csv",
            index=False
        )

        print(f"\n{label}")
        print("row_index:", int(row["row_index"]))
        print("actual:", int(row["actual_target"]))
        print("predicted_probability:", round(float(row["predicted_probability"]), 6))
        print(
            contrib.head(10)[
                ["feature", "feature_value", "shap_value", "direction"]
            ].to_string(index=False)
        )

print(f"\nSHAP analysis complete. Saved to: {OUT}")
