"""
Forecast Engine — 7-day and 14-day mastitis risk forecasting.

Wraps the GoRakshakUnifiedEngine logic (originally in src/unified_prediction.py)
inside an async FastAPI-compatible service that builds the 72-feature input
vector from live MongoDB data instead of a static CSV file.

Public API
----------
async forecast_for_animal(db, animal_id, include_shap=True) -> dict
    Returns a rich forecast payload suitable for the /risk/forecast endpoint.

build_forecasting_features(sensor_rows, lab_rows) -> dict | None
    Pure function — builds the 72-feature dict from lists of sensor and lab
    MongoDB documents.  Returns None if there is insufficient data.
"""

from __future__ import annotations

import logging
import math
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from app.services.model_loader import get_forecast_package

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Risk classification helpers (matching unified_prediction.py thresholds)
# ---------------------------------------------------------------------------

def _risk_level(p: float) -> str:
    if p >= 0.75:
        return "HIGH"
    if p >= 0.50:
        return "MODERATE"
    if p >= 0.25:
        return "LOW"
    return "VERY_LOW"


def _recommended_action(overall: float) -> str:
    if overall >= 0.75:
        return (
            "Prioritize monitoring and perform a confirmatory CMT/udder "
            "or veterinary examination."
        )
    if overall >= 0.50:
        return "Increase monitoring and consider a confirmatory CMT/udder examination."
    if overall >= 0.25:
        return (
            "Continue routine monitoring and watch for changes in milk, "
            "temperature, and behavior."
        )
    return "Continue routine monitoring."


# ---------------------------------------------------------------------------
# Feature construction
# ---------------------------------------------------------------------------

# Rolling windows (days) used during training
_WINDOWS = (3, 7, 14)

# Sensor fields and their mapping to the forecasting feature namespace
_SENSOR_FIELD_MAP = {
    "surface_temp_c":          "body_temperature",   # collar surface temp used as proxy
    "rumination_inferred_min": "rumination_min",
    "activity_raw":            "activity_index",
    "thi":                     "thi",
}

# Lab fields and their mapping
_LAB_FIELD_MAP = {
    "scc_value":    "scc",
    "milk_ec":      "milk_conductivity",
    "milk_temp_c":  "milk_temperature",
    "milk_yield_l": "milk_yield_kg",   # litres ≈ kg for water; close enough for screening
}


def _safe_mean(values: List[float]) -> Optional[float]:
    clean = [v for v in values if v is not None and not math.isnan(v)]
    return float(np.mean(clean)) if clean else None


def _safe_delta(current: Optional[float], baseline: Optional[float]) -> Optional[float]:
    if current is None or baseline is None:
        return None
    return current - baseline


def build_forecasting_features(
    sensor_rows: List[Dict[str, Any]],
    lab_rows: List[Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    """
    Build the 72-feature dict from raw MongoDB document lists.

    Parameters
    ----------
    sensor_rows : list of sensor_readings documents, sorted oldest-first.
    lab_rows    : list of manual_lab_data documents, sorted oldest-first.

    Returns
    -------
    dict mapping each of the 72 feature names to a float, or
    None if there is insufficient data to compute even the basic features.
    """
    if not sensor_rows and not lab_rows:
        return None

    now = datetime.utcnow()

    # ------------------------------------------------------------------ #
    # Build daily-level time-series for each feature                       #
    # ------------------------------------------------------------------ #

    # Keyed by (feature_name, date_str) → list of values
    daily: Dict[str, List[float]] = {}

    for row in sensor_rows:
        ts: datetime = row.get("recorded_at") or row.get("received_at") or now
        if isinstance(ts, str):
            ts = datetime.fromisoformat(ts)
        for raw_field, feat_name in _SENSOR_FIELD_MAP.items():
            val = row.get(raw_field)
            if val is not None:
                daily.setdefault(feat_name, []).append(float(val))

    for row in lab_rows:
        for raw_field, feat_name in _LAB_FIELD_MAP.items():
            val = row.get(raw_field)
            if val is not None:
                daily.setdefault(feat_name, []).append(float(val))

    if not daily:
        return None

    # ------------------------------------------------------------------ #
    # Compute rolling means and deltas for each feature                    #
    # ------------------------------------------------------------------ #

    features: Dict[str, Any] = {}

    for feat_name, all_values in daily.items():
        if not all_values:
            continue

        # Current value = mean of the most-recent readings (last ~24 h)
        current = _safe_mean(all_values[-max(1, len(all_values) // 7):])
        features[feat_name] = current

        # Rolling means over each window
        for w in _WINDOWS:
            window_vals = all_values[-w:] if len(all_values) >= w else all_values
            mean_w = _safe_mean(window_vals)
            features[f"{feat_name}_mean_prev{w}d"] = mean_w

        # Delta vs 7-day baseline (most commonly used in SHAP explanations)
        baseline_7d = _safe_mean(all_values[:-7] if len(all_values) > 7 else all_values)
        features[f"{feat_name}_delta_vs_prev7d"] = _safe_delta(current, baseline_7d)

        # Additional derivative features used by the training dataset builder
        if len(all_values) >= 2:
            prev = all_values[-2]
            features[f"{feat_name}_delta_1d"] = _safe_delta(current, prev)

    # ------------------------------------------------------------------ #
    # THI — pull from sensor rows directly (already computed by ingest)    #
    # ------------------------------------------------------------------ #
    thi_vals = [r.get("thi") for r in sensor_rows if r.get("thi") is not None]
    if thi_vals:
        features.setdefault("thi", _safe_mean(thi_vals))
        features.setdefault("thi_mean_prev7d", _safe_mean(thi_vals[-7:]))
        features.setdefault("thi_delta_vs_prev7d",
                            _safe_delta(_safe_mean(thi_vals[-3:]),
                                        _safe_mean(thi_vals[:-7] if len(thi_vals) > 7 else thi_vals)))

    return features


def _align_to_model_features(
    raw_features: Dict[str, Any],
    model_feature_columns: List[str],
) -> pd.DataFrame:
    """
    Align our computed feature dict to the model's expected 72-column schema.

    Columns in model_feature_columns that are missing from raw_features are
    set to NaN.  The XGBoost model handles NaN natively (it was trained with
    all features guaranteed present, but NaN-safety is built into XGBoost's
    tree evaluation).
    """
    row = {col: raw_features.get(col, np.nan) for col in model_feature_columns}
    X = pd.DataFrame([row], columns=model_feature_columns)
    X = X.apply(pd.to_numeric, errors="coerce")
    return X


# ---------------------------------------------------------------------------
# SHAP-style human explanations (ported from unified_prediction.py)
# ---------------------------------------------------------------------------

_EXPLANATION_MAP = {
    "scc":                           "SCC is contributing upward pressure to the predicted risk.",
    "scc_delta_vs_prev7d":           "SCC is changing relative to the recent 7-day baseline.",
    "scc_mean_prev3d":               "Recent SCC level is contributing to the predicted risk.",
    "scc_mean_prev7d":               "Recent SCC level is contributing to the predicted risk.",
    "milk_conductivity":             "Milk conductivity is contributing to the predicted risk.",
    "milk_conductivity_delta_vs_prev7d": "Milk conductivity is changing relative to the recent baseline.",
    "milk_conductivity_mean_prev3d": "Recent milk conductivity is contributing to the predicted risk.",
    "milk_conductivity_mean_prev7d": "Recent milk conductivity is contributing to the predicted risk.",
    "milk_temperature":              "Milk temperature is contributing to the predicted risk.",
    "milk_temperature_delta_vs_prev7d": "Milk temperature is changing relative to the recent baseline.",
    "body_temperature":              "Body temperature is contributing to the predicted risk.",
    "body_temperature_delta_vs_prev7d": "Body temperature is trending upward relative to the recent baseline.",
    "rumination_min":                "Rumination is contributing to the predicted risk.",
    "rumination_min_delta_vs_prev7d": "Rumination has changed relative to the recent 7-day baseline.",
    "activity_index":                "Activity is contributing to the predicted risk.",
    "activity_index_delta_vs_prev7d": "Activity has changed relative to the recent 7-day baseline.",
    "milk_yield_kg_delta_vs_prev7d": "Milk yield has changed relative to the recent 7-day baseline.",
    "thi":                           "Current heat-stress conditions are contributing to the predicted risk.",
}

_PREFIX_MAP = {
    "scc_":              "Recent SCC pattern is contributing to the predicted risk.",
    "milk_conductivity_": "Recent milk-conductivity pattern is contributing to the predicted risk.",
    "milk_temperature_":  "Recent milk-temperature pattern is contributing to the predicted risk.",
    "body_temperature_":  "Recent body-temperature pattern is contributing to the predicted risk.",
    "rumination_min_":    "Recent rumination pattern is contributing to the predicted risk.",
    "activity_index_":    "Recent activity pattern is contributing to the predicted risk.",
    "milk_yield_":        "Recent milk yield pattern is contributing to the predicted risk.",
}


def _feature_to_explanation(feature: str) -> Optional[str]:
    if feature in _EXPLANATION_MAP:
        return _EXPLANATION_MAP[feature]
    for prefix, msg in _PREFIX_MAP.items():
        if feature.startswith(prefix):
            return msg
    return None


def _shap_explanations(model, X: pd.DataFrame, top_n: int = 5) -> List[str]:
    """
    Use SHAP TreeExplainer to build human-readable explanations.
    Falls back to empty list if shap is not installed or fails.
    """
    try:
        import shap  # noqa: PLC0415
        explainer = shap.TreeExplainer(model)
        values = explainer.shap_values(X)
        if isinstance(values, list):
            values = values[-1]
        values = np.asarray(values)
        if values.ndim == 3:
            values = values[:, :, -1]

        contributions = sorted(
            zip(X.columns, values[0]),
            key=lambda p: abs(p[1]),
            reverse=True,
        )[:top_n]

        explanations: List[str] = []
        for feature, shap_val in contributions:
            if shap_val >= 0:
                msg = _feature_to_explanation(feature)
                if msg and msg not in explanations:
                    explanations.append(msg)
        return explanations

    except Exception as exc:  # noqa: BLE001
        logger.debug("SHAP explanations unavailable: %s", exc)
        return []


# ---------------------------------------------------------------------------
# Main async entry point
# ---------------------------------------------------------------------------

async def forecast_for_animal(
    db,
    animal_id: str,
    include_shap: bool = True,
) -> Dict[str, Any]:
    """
    Build a 7-day and 14-day mastitis risk forecast for one animal.

    Fetches the last 21 days of sensor and lab data from MongoDB, constructs
    the 72-feature input vector, and runs both XGBoost forecasting models.

    Returns
    -------
    dict with keys: animal_id, forecast (risk_7d, risk_14d, levels),
    explanations, recommendation, model_status, data_disclaimer.

    Raises
    ------
    RuntimeError  if forecasting models are not loaded.
    ValueError    if there is insufficient data to build any features.
    """
    from app.services.model_loader import get_forecast_package  # noqa: PLC0415

    pkg_7d  = get_forecast_package("7d")
    pkg_14d = get_forecast_package("14d")

    model_7d      = pkg_7d["model"]
    model_14d     = pkg_14d["model"]
    feat_cols_7d  = list(pkg_7d["feature_columns"])
    feat_cols_14d = list(pkg_14d["feature_columns"])

    # Fetch up to 21 days of data from MongoDB
    window_start = datetime.utcnow() - timedelta(days=21)

    sensor_rows = await db.sensor_readings.find(
        {"animal_id": animal_id, "recorded_at": {"$gte": window_start}},
        sort=[("recorded_at", 1)],
    ).to_list(None)

    lab_rows = await db.manual_lab_data.find(
        {"animal_id": animal_id, "recorded_at": {"$gte": window_start}},
        sort=[("recorded_at", 1)],
    ).to_list(None)

    raw_features = build_forecasting_features(sensor_rows, lab_rows)

    if raw_features is None:
        raise ValueError(
            f"Insufficient sensor/lab data for animal {animal_id} to compute "
            "forecasting features. Ensure at least a few sensor readings exist."
        )

    # Align to model's 72-feature schema
    X = _align_to_model_features(raw_features, feat_cols_7d)

    # Inference
    risk_7d  = float(model_7d.predict_proba(X)[:, 1][0])
    risk_14d = float(model_14d.predict_proba(
        _align_to_model_features(raw_features, feat_cols_14d)
    )[:, 1][0])

    overall = max(risk_7d, risk_14d)

    # SHAP explanations (optional — adds ~50 ms per call with TreeExplainer)
    explanations: List[str] = []
    if include_shap:
        explanations = _shap_explanations(model_7d, X, top_n=5)
        if not explanations:
            # If SHAP unavailable, fall back to importance-based explanations
            try:
                importances = model_7d.feature_importances_
                top_indices = np.argsort(importances)[::-1][:5]
                for idx in top_indices:
                    feat = feat_cols_7d[idx]
                    msg = _feature_to_explanation(feat)
                    if msg and msg not in explanations:
                        explanations.append(msg)
            except Exception:  # noqa: BLE001
                pass

    return {
        "animal_id": animal_id,
        "computed_at": datetime.utcnow().isoformat(),
        "model_status": {
            "forecast_7d":  "AVAILABLE",
            "forecast_14d": "AVAILABLE",
        },
        "forecast": {
            "risk_7d":          round(risk_7d, 6),
            "risk_7d_percent":  round(risk_7d * 100, 2),
            "risk_7d_level":    _risk_level(risk_7d),
            "risk_14d":         round(risk_14d, 6),
            "risk_14d_percent": round(risk_14d * 100, 2),
            "risk_14d_level":   _risk_level(risk_14d),
            "overall":          round(overall, 6),
            "overall_level":    _risk_level(overall),
        },
        "explanations":     explanations[:8],
        "recommendation":   _recommended_action(overall),
        "features_used":    len([v for v in raw_features.values() if v is not None]),
        "data_disclaimer": (
            "Forecasting models were trained on synthetic development data and are "
            "not clinically validated. Output is decision support only, not diagnosis."
        ),
    }
