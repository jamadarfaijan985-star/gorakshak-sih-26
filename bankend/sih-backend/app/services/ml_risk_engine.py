"""
ML Risk Engine — mastitis classification using trained joblib pipelines.

Implements the same predict(input) -> RiskEngineOutputSchema interface as
RuleBasedRiskEngine so routes_risk.py can swap between them transparently.

Species routing
---------------
  cow    → gorakshak_cow_clinical_v2  (preferred: clinical feature set)
           falls back to gorakshak_cow_milk_v2 if clinical unavailable
  buffalo → gorakshak_buffalo_v2

Feature mapping
---------------
The V2 sklearn pipelines were trained on harmonized public datasets whose
column names differ from the backend's internal feature dict keys.  The
_build_feature_row() method handles the translation, filling None for any
column the pipeline knows about but that the backend hasn't computed yet.
The sklearn ColumnTransformer's SimpleImputer then fills remaining gaps
with median/mode — exactly as during training.

Fallback
--------
If a pipeline raises at any point (missing model file, unexpected feature
schema, etc.) the engine raises RuntimeError with a clear message so
routes_risk.py can catch it and fall back to RuleBasedRiskEngine.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from app.schemas.schemas import (
    ContributingFactorSchema,
    RiskEngineInputSchema,
    RiskEngineOutputSchema,
)
from app.services.model_loader import (
    get_buffalo_pipeline,
    get_cow_clinical_pipeline,
    get_cow_milk_pipeline,
    get_pipeline_feature_names,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Feature name mapping: backend key → training dataset column name(s)
#
# The V2 datasets used different column names than the backend's internal
# feature dict.  We try each alias in order and use the first match found
# in the pipeline's fitted feature list.  Keys map to lists so we can
# handle multiple possible aliases from different dataset sources.
# ---------------------------------------------------------------------------

_BACKEND_TO_DATASET: Dict[str, List[str]] = {
    # Sensor / environmental
    "thi_avg":                      ["thi", "thi_avg", "thi_mean"],
    "thi_max":                       ["thi_max"],
    "surface_temp_deviation":        ["surface_temp_c", "udder_temp_c", "body_temperature"],
    "activity_deviation":            ["activity_raw", "activity_index", "activity"],
    "rumination_inferred_deviation": ["rumination_inferred_min", "rumination_min", "rumination"],

    # Manual lab — these live inside features["manual_lab_data"] dict
    "scc_value":      ["scc_value", "scc", "somatic_cell_count"],
    "milk_ec":        ["milk_ec", "electrical_conductivity", "ec"],
    "milk_temp_c":    ["milk_temp_c", "milk_temperature", "milk_temp"],
    "milk_yield_l":   ["milk_yield_l", "milk_yield_kg", "milk_yield"],
    "milk_ph":        ["milk_ph", "ph"],
    "udder_temp_c":   ["udder_temp_c", "udder_temperature"],
    "cmt_result":     ["cmt_result", "cmt", "cmt_score_text"],

    # Animal meta
    "lactation_number": ["lactation_number", "parity", "lactation_no"],
    "age_months":        ["age_months", "age"],
    "previous_mastitis": ["previous_mastitis", "prior_mastitis"],
}


def _risk_level(probability: float) -> str:
    if probability >= 0.75:
        return "high"
    if probability >= 0.50:
        return "moderate"
    if probability >= 0.25:
        return "low"
    return "no_risk"


def _recommended_action(risk_level: str) -> str:
    actions = {
        "high":     ("Immediate veterinary examination recommended. Perform detailed udder "
                     "assessment, collect milk samples for CMT/SCC/pH/EC, check for visible "
                     "signs of inflammation or discharge."),
        "moderate": ("Schedule targeted udder assessment within 24 hours. Collect milk samples "
                     "for lab analysis (CMT, SCC, pH, EC). Monitor closely for escalation."),
        "low":      ("Continue routine monitoring. Check next scheduled herd visit for any "
                     "changes in clinical signs."),
        "no_risk":  "Animal appears healthy. Continue routine monitoring.",
    }
    return actions.get(risk_level, "Continue routine monitoring.")


def _build_feature_row(
    features: Dict[str, Any],
    pipeline_feature_names: List[str],
) -> pd.DataFrame:
    """
    Translate the backend feature dict into a single-row DataFrame whose
    columns match (a subset of) what the sklearn pipeline was trained on.

    Any column the pipeline knows about but that we can't map is set to
    np.nan — the pipeline's SimpleImputer will fill it with the training
    median/mode, matching how missing values were handled at training time.
    """
    # Flatten manual_lab_data sub-dict into the top-level feature namespace
    flat: Dict[str, Any] = dict(features)
    lab = features.get("manual_lab_data") or {}
    flat.update(lab)

    # Also flatten animal_meta
    meta = features.get("animal_meta") or {}
    flat.update(meta)

    # Build a mapping from each pipeline column name → value
    row: Dict[str, Any] = {}

    for pipeline_col in pipeline_feature_names:
        # Direct hit (pipeline column name == backend key)
        if pipeline_col in flat and flat[pipeline_col] is not None:
            row[pipeline_col] = flat[pipeline_col]
            continue

        # Alias lookup: find which backend key maps to this pipeline column
        found = False
        for backend_key, aliases in _BACKEND_TO_DATASET.items():
            if pipeline_col in aliases:
                val = flat.get(backend_key)
                if val is None:
                    # Try the other aliases in the same group
                    for alias in aliases:
                        if alias in flat and flat[alias] is not None:
                            val = flat[alias]
                            break
                row[pipeline_col] = val  # may still be None → np.nan below
                found = True
                break

        if not found:
            row[pipeline_col] = None  # pipeline imputer will fill

    # Convert None → np.nan for numeric compatibility
    for k, v in row.items():
        if v is None:
            row[k] = np.nan

    return pd.DataFrame([row], columns=pipeline_feature_names)


def _top_contributing_factors(
    pipeline,
    X: pd.DataFrame,
    top_n: int = 5,
) -> List[ContributingFactorSchema]:
    """
    Extract top-N feature importances from the fitted XGBoost step and
    turn them into ContributingFactorSchema objects.

    Uses the XGBoost model's feature_importances_ attribute which is always
    available after fitting, unlike SHAP (which would add latency per-request).
    Importances are normalised so the top-N sum to ≤ 1.0.
    """
    try:
        xgb_model = pipeline.named_steps.get("model")
        if xgb_model is None or not hasattr(xgb_model, "feature_importances_"):
            return []

        preprocessor = pipeline.named_steps.get("preprocessor")
        if preprocessor is None:
            return []

        # Get output feature names from the preprocessor
        try:
            out_names = preprocessor.get_feature_names_out()
        except Exception:  # noqa: BLE001
            out_names = [f"f{i}" for i in range(len(xgb_model.feature_importances_))]

        importances = xgb_model.feature_importances_
        if len(importances) != len(out_names):
            return []

        total = float(importances.sum()) or 1.0
        pairs = sorted(
            zip(out_names, importances),
            key=lambda p: p[1],
            reverse=True,
        )[:top_n]

        factors = []
        for name, imp in pairs:
            # Strip sklearn ColumnTransformer prefix (e.g. "numeric__scc_value" → "scc_value")
            clean_name = name.split("__", 1)[-1] if "__" in name else name
            factors.append(
                ContributingFactorSchema(
                    factor=clean_name,
                    weight=round(float(imp) / total, 4),
                )
            )
        return factors

    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not extract feature importances: %s", exc)
        return []


# ---------------------------------------------------------------------------
# Public engine class
# ---------------------------------------------------------------------------

class MLRiskEngine:
    """
    ML-based risk engine that routes to the correct trained pipeline
    depending on the animal's species.

    Usage (mirrors RuleBasedRiskEngine)::

        engine = MLRiskEngine()
        output = engine.predict(risk_engine_input)

    Raises RuntimeError if the required model is unavailable.
    """

    def predict(self, engine_input: RiskEngineInputSchema) -> RiskEngineOutputSchema:
        features = engine_input.features
        species = (features.get("animal_meta") or {}).get("species", "").lower()

        pipeline, model_version = self._select_pipeline(species)
        pipeline_cols = get_pipeline_feature_names(pipeline)

        if not pipeline_cols:
            raise RuntimeError(
                f"Could not introspect feature names for pipeline '{model_version}'. "
                "The pipeline may not be fitted or uses an unsupported ColumnTransformer structure."
            )

        X = _build_feature_row(features, pipeline_cols)

        try:
            probability = float(pipeline.predict_proba(X)[:, 1][0])
        except Exception as exc:
            raise RuntimeError(
                f"Inference failed for pipeline '{model_version}': {exc}"
            ) from exc

        level = _risk_level(probability)
        contributing = _top_contributing_factors(pipeline, X)

        return RiskEngineOutputSchema(
            risk_level=level,
            risk_score_numeric=round(probability, 4),
            contributing_factors=contributing,
            recommended_action=_recommended_action(level),
            model_version=model_version,
            is_forecast=False,
            forecast_horizon_days=None,
        )

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    @staticmethod
    def _select_pipeline(species: str):
        """
        Route to the right pipeline.

        Cow  → cow_clinical_v2 preferred, cow_milk_v2 as fallback.
        Buffalo → buffalo_v2.
        Unknown → try cow_clinical_v2 (safest default for demo).
        """
        if species == "buffalo":
            return get_buffalo_pipeline(), "gorakshak_buffalo_v2"

        # cow or unknown
        try:
            return get_cow_clinical_pipeline(), "gorakshak_cow_clinical_v2"
        except RuntimeError:
            pass  # clinical model not loaded — fall back to milk model

        try:
            return get_cow_milk_pipeline(), "gorakshak_cow_milk_v2"
        except RuntimeError as exc:
            raise RuntimeError(
                "No cow classification model is available. "
                "Ensure gorakshak_cow_clinical_v2.joblib or "
                "gorakshak_cow_milk_v2.joblib exists in MODEL_DIR."
            ) from exc
