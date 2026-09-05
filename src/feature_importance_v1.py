import joblib
import pandas as pd
import numpy as np
from pathlib import Path

ROOT = Path(r"D:\GoRakshak\ai-ml")
MODELS = ROOT / "models"
OUT = ROOT / "data" / "processed" / "feature_importance_v1"
OUT.mkdir(parents=True, exist_ok=True)

all_results = []

for horizon in ["7d", "14d"]:
    path = MODELS / f"gorakshak_forecast_{horizon}_xgb_v2.joblib"

    if not path.exists():
        print(f"ERROR: Model not found: {path}")
        continue

    package = joblib.load(path)
    model = package["model"]
    features = package["feature_columns"]

    # XGBoost may store importance keys as actual feature names
    # when the model was trained with a pandas DataFrame.
    booster = model.get_booster()
    gain_map = booster.get_score(importance_type="gain")

    rows = []

    for i, feature in enumerate(features):
        # Prefer actual feature name; fall back to f0/f1... if necessary.
        gain = gain_map.get(feature, gain_map.get(f"f{i}", 0.0))

        rows.append({
            "horizon": horizon,
            "feature": feature,
            "gain": float(gain),
            "normalized_importance": float(model.feature_importances_[i])
        })

    df = pd.DataFrame(rows)

    total_gain = df["gain"].sum()

    if total_gain > 0:
        df["gain_share"] = df["gain"] / total_gain
    else:
        df["gain_share"] = 0.0

    df = df.sort_values(
        "gain",
        ascending=False
    ).reset_index(drop=True)

    df["rank"] = np.arange(1, len(df) + 1)

    df.to_csv(OUT / f"feature_importance_{horizon}_gain.csv", index=False)
    all_results.append(df)

    print("\n" + "=" * 70)
    print(f"{horizon.upper()} — TOP 20 FEATURES BY XGBOOST GAIN")
    print("=" * 70)
    print(df.head(20).to_string(index=False))

# Combined ranking
if all_results:
    combined = pd.concat(all_results, ignore_index=True)
    combined.to_csv(OUT / "feature_importance_all_horizons.csv", index=False)

    # Feature-family summary
    def family(f):
        x = f.lower()
        if "scc" in x:
            return "SCC"
        if "milk_temperature" in x:
            return "Milk Temperature"
        if "milk_conductivity" in x:
            return "Milk Conductivity"
        if "milk_ph" in x:
            return "Milk pH"
        if "milk_yield" in x:
            return "Milk Yield"
        if "body_temperature" in x:
            return "Body Temperature"
        if "rumination" in x:
            return "Rumination"
        if "activity" in x:
            return "Activity"
        if "feed_intake" in x:
            return "Feed Intake"
        if "ambient_temperature" in x:
            return "Ambient Temperature"
        if "humidity" in x:
            return "Humidity"
        if x == "thi" or x.startswith("thi_"):
            return "THI"
        if "days_in_milk" in x or "dim_phase" in x:
            return "Lactation/DIM"
        if x == "age_years":
            return "Age"
        if x == "parity":
            return "Parity"
        return "Other"

    combined["feature_family"] = combined["feature"].map(family)

    family_summary = (
        combined.groupby(["horizon", "feature_family"], as_index=False)
        .agg(
            total_gain=("gain", "sum"),
            mean_gain=("gain", "mean"),
            feature_count=("feature", "count"),
        )
    )
    family_summary["gain_share"] = (
        family_summary["total_gain"] /
        family_summary.groupby("horizon")["total_gain"].transform("sum")
    )
    family_summary = family_summary.sort_values(
        ["horizon", "total_gain"], ascending=[True, False]
    )
    family_summary.to_csv(OUT / "feature_family_summary.csv", index=False)

    print("\n" + "=" * 70)
    print("FEATURE FAMILY SUMMARY")
    print("=" * 70)
    for horizon in ["7d", "14d"]:
        print(f"\n{horizon.upper()}")
        print(
            family_summary[family_summary["horizon"] == horizon]
            [["feature_family", "feature_count", "gain_share"]]
            .to_string(index=False)
        )

print(f"\nDONE. Results saved to: {OUT}")