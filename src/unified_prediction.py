import json
from pathlib import Path
from typing import Optional, Dict, Any, List

import joblib
import numpy as np
import pandas as pd
import shap


ROOT = Path(r"D:\GoRakshak\ai-ml")
MODEL_DIR = ROOT / "models"
BEHAVIOR_FILE = ROOT / "data" / "processed" / "behavior_model_v2" / "behavior_latest_signals_v1.csv"


class GoRakshakUnifiedEngine:
    """
    Unified GoRakshak inference layer.

    Model 1:
      - 7-day XGBoost mastitis forecast
      - 14-day XGBoost mastitis forecast

    Model 3:
      - independent rumination/activity behavioral signal

    Model 2:
      - intentionally not implemented until Farhan supplies its
        model contract. No prediction is fabricated.
    """

    def __init__(self):
        self.model7_pkg = joblib.load(
            MODEL_DIR / "gorakshak_forecast_7d_xgb_v2.joblib"
        )
        self.model14_pkg = joblib.load(
            MODEL_DIR / "gorakshak_forecast_14d_xgb_v2.joblib"
        )

        self.model7 = self.model7_pkg["model"]
        self.model14 = self.model14_pkg["model"]

        self.features7 = list(self.model7_pkg["feature_columns"])
        self.features14 = list(self.model14_pkg["feature_columns"])

        if self.features7 != self.features14:
            raise ValueError("7-day and 14-day feature schemas do not match.")

        if len(self.features7) != 72:
            raise ValueError(
                f"Expected 72 forecasting features, got {len(self.features7)}."
            )

        self.behavior = None
        if BEHAVIOR_FILE.exists():
            self.behavior = pd.read_csv(BEHAVIOR_FILE)
            if "animal_id" not in self.behavior.columns:
                raise ValueError("Behavior file is missing animal_id.")

            # Prevent ambiguous lookup.
            if self.behavior["animal_id"].duplicated().any():
                raise ValueError("Behavior file contains duplicate animal_id values.")

            self.behavior = self.behavior.set_index("animal_id", drop=False)

        self.explainers = {
            "7d": shap.TreeExplainer(self.model7),
            "14d": shap.TreeExplainer(self.model14),
        }

    @staticmethod
    def _risk_level(p: float) -> str:
        if p >= 0.75:
            return "HIGH"
        if p >= 0.50:
            return "MODERATE"
        if p >= 0.25:
            return "LOW"
        return "VERY_LOW"

    @staticmethod
    def _clean_features(data: Dict[str, Any], features: List[str]) -> pd.DataFrame:
        missing = [f for f in features if f not in data]
        if missing:
            raise ValueError(
                "Missing required forecasting features: "
                + ", ".join(missing)
            )

        X = pd.DataFrame([{f: data[f] for f in features}])
        X = X.apply(pd.to_numeric, errors="coerce")

        bad = [f for f in features if pd.isna(X.iloc[0][f])]
        if bad:
            raise ValueError(
                "Non-numeric or missing values in required features: "
                + ", ".join(bad)
            )

        X = X.replace([np.inf, -np.inf], np.nan)
        if X.isna().any().any():
            raise ValueError("Infinite/invalid forecasting feature value supplied.")

        return X

    def _predict_probability(self, model, X: pd.DataFrame) -> float:
        return float(model.predict_proba(X)[:, 1][0])

    def _shap_contributions(
        self,
        horizon: str,
        X: pd.DataFrame,
        top_n: int = 5
    ) -> List[Dict[str, Any]]:
        explainer = self.explainers[horizon]
        values = explainer.shap_values(X)

        if isinstance(values, list):
            values = values[-1]

        values = np.asarray(values)
        if values.ndim == 3:
            values = values[:, :, -1]

        contributions = []
        for feature, value, shap_value in zip(
            X.columns,
            X.iloc[0].values,
            values[0]
        ):
            contributions.append({
                "feature": feature,
                "value": float(value),
                "shap_value": float(shap_value),
                "direction": (
                    "INCREASES_RISK"
                    if shap_value >= 0
                    else "DECREASES_RISK"
                )
            })

        contributions.sort(
            key=lambda x: abs(x["shap_value"]),
            reverse=True
        )

        return contributions[:top_n]

    @staticmethod
    def _human_explanation(feature: str, direction: str) -> Optional[str]:
        if direction != "INCREASES_RISK":
            return None

        messages = {
            "scc": "SCC is contributing upward pressure to the predicted risk.",
            "scc_delta_vs_prev7d": "SCC is changing relative to the recent 7-day baseline.",
            "scc_mean_prev3d": "Recent SCC level is contributing to the predicted risk.",
            "scc_mean_prev7d": "Recent SCC level is contributing to the predicted risk.",
            "milk_conductivity": "Milk conductivity is contributing to the predicted risk.",
            "milk_conductivity_delta_vs_prev7d": "Milk conductivity is changing relative to the recent baseline.",
            "milk_conductivity_mean_prev3d": "Recent milk conductivity is contributing to the predicted risk.",
            "milk_conductivity_mean_prev7d": "Recent milk conductivity is contributing to the predicted risk.",
            "milk_temperature": "Milk temperature is contributing to the predicted risk.",
            "milk_temperature_delta_vs_prev7d": "Milk temperature is changing relative to the recent baseline.",
            "body_temperature": "Body temperature is contributing to the predicted risk.",
            "body_temperature_delta_vs_prev7d": "Body temperature is trending upward relative to the recent baseline.",
            "rumination_min": "Rumination is contributing to the predicted risk.",
            "rumination_min_delta_vs_prev7d": "Rumination has changed relative to the recent 7-day baseline.",
            "activity_index": "Activity is contributing to the predicted risk.",
            "activity_index_delta_vs_prev7d": "Activity has changed relative to the recent 7-day baseline.",
            "milk_yield_kg_delta_vs_prev7d": "Milk yield has changed relative to the recent 7-day baseline.",
            "thi": "Current heat-stress conditions are contributing to the predicted risk.",
        }

        if feature in messages:
            return messages[feature]

        # Handle rolling variants generically.
        if feature.startswith("scc_"):
            return "Recent SCC pattern is contributing to the predicted risk."
        if feature.startswith("milk_conductivity_"):
            return "Recent milk-conductivity pattern is contributing to the predicted risk."
        if feature.startswith("milk_temperature_"):
            return "Recent milk-temperature pattern is contributing to the predicted risk."
        if feature.startswith("body_temperature_"):
            return "Recent body-temperature pattern is contributing to the predicted risk."
        if feature.startswith("rumination_min_"):
            return "Recent rumination pattern is contributing to the predicted risk."
        if feature.startswith("activity_index_"):
            return "Recent activity pattern is contributing to the predicted risk."

        return None

    def _behavior_signal(self, animal_id: Optional[str]) -> Dict[str, Any]:
        if not animal_id:
            return {
                "available": False,
                "reason": "No animal_id supplied."
            }

        if self.behavior is None:
            return {
                "available": False,
                "reason": "Behavior signal file not available."
            }

        if animal_id not in self.behavior.index:
            return {
                "available": False,
                "reason": "No legitimate behavior record found for this animal_id."
            }

        row = self.behavior.loc[animal_id]

        available = bool(row.get("behavior_signal_available", False))

        return {
            "available": available,
            "animal_id": animal_id,
            "date": str(row.get("date", "")),
            "status": str(row.get("behavior_status", "UNKNOWN")),
            "anomaly_score": float(row.get("behavior_anomaly_score", 0.0)),
            "rumination_mean": float(row.get("rumination_mean", np.nan)),
            "activity_mean": float(row.get("activity_mean", np.nan)),
            "rumination_delta_7d": float(row.get("rumination_delta_7d", np.nan)),
            "activity_delta_7d": float(row.get("activity_delta_7d", np.nan)),
            "history_observations": int(row.get("history_observations", 0)),
            "history_confidence": str(
                row.get("behavior_history_confidence", "UNKNOWN")
            )
        }

    def predict(
        self,
        animal_id: Optional[str],
        forecasting_data: Dict[str, Any],
        include_shap: bool = True
    ) -> Dict[str, Any]:

        X = self._clean_features(forecasting_data, self.features7)

        risk7 = self._predict_probability(self.model7, X)
        risk14 = self._predict_probability(self.model14, X)

        explanations = []

        if include_shap:
            shap7 = self._shap_contributions("7d", X, top_n=5)
            shap14 = self._shap_contributions("14d", X, top_n=5)

            for item in shap7 + shap14:
                text = self._human_explanation(
                    item["feature"], item["direction"]
                )
                if text and text not in explanations:
                    explanations.append(text)

        behavior = self._behavior_signal(animal_id)

        if behavior.get("available"):
            if behavior["status"] in {"MODERATE_DEVIATION", "HIGH"}:
                explanations.append(
                    "Behavioral monitoring indicates deviation from the animal's recent baseline."
                )

        overall = max(risk7, risk14)

        if overall >= 0.75:
            recommendation = (
                "Prioritize monitoring and perform a confirmatory CMT/udder "
                "or veterinary examination."
            )
        elif overall >= 0.50:
            recommendation = (
                "Increase monitoring and consider a confirmatory CMT/udder examination."
            )
        elif overall >= 0.25:
            recommendation = (
                "Continue routine monitoring and watch for changes in milk, "
                "temperature, and behavior."
            )
        else:
            recommendation = "Continue routine monitoring."

        return {
            "animal_id": animal_id,
            "model_status": {
                "model_1": "AVAILABLE",
                "model_2": "NOT_AVAILABLE_PENDING_FARHAN",
                "model_3": "AVAILABLE" if behavior.get("available") else "NO_MATCH"
            },
            "forecast": {
                "risk_7d": round(risk7, 6),
                "risk_7d_percent": round(risk7 * 100, 2),
                "risk_7d_level": self._risk_level(risk7),
                "risk_14d": round(risk14, 6),
                "risk_14d_percent": round(risk14 * 100, 2),
                "risk_14d_level": self._risk_level(risk14),
            },
            "behavior": behavior,
            "explanations": explanations[:8],
            "recommendation": recommendation,
            "data_disclaimer": (
                "Forecasting models are synthetic-development models and are "
                "not clinically validated. Output is decision support, not diagnosis."
            )
        }


def main():
    engine = GoRakshakUnifiedEngine()

    print("=" * 72)
    print("GORAKSHAK UNIFIED AI ENGINE")
    print("=" * 72)
    print("Model 1 (7D):  LOADED")
    print("Model 1 (14D): LOADED")
    print("Model 2:       PENDING FARHAN")
    print(
        "Model 3:       LOADED"
        if engine.behavior is not None
        else "Model 3:       BEHAVIOR FILE NOT FOUND"
    )

    print("\nSchema verification:")
    print("Forecasting features:", len(engine.features7))
    print("7D target:", engine.model7_pkg["target"])
    print("14D target:", engine.model14_pkg["target"])
    print("Clinical validation:", engine.model7_pkg["clinical_validation"])

    # Safe smoke test using an actual temporal test row.
    test_path = ROOT / "data" / "processed" / "forecasting_v2" / "forecast_test_v1.csv"

    if test_path.exists():
        test = pd.read_csv(test_path)
        sample = test.iloc[0]

        data = {
            feature: sample[feature]
            for feature in engine.features7
        }

        result = engine.predict(
            animal_id=str(sample["animal_id"]),
            forecasting_data=data,
            include_shap=True
        )

        print("\n===== SMOKE TEST =====")
        print(json.dumps(result, indent=2))

        out_path = ROOT / "data" / "processed" / "unified_prediction_smoke_test.json"
        out_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
        print("\nSaved smoke test:", out_path)

    print("\nSTATUS: UNIFIED AI ENGINE READY")


if __name__ == "__main__":
    main()
