"""
Model Loader — singleton registry for all trained ML models.

Loaded once at application startup (see app/main.py lifespan) and then
reused across requests.  All heavy imports (joblib, ultralytics) happen
inside _load_* functions so that the module can be imported without
crashing on hosts that haven't installed the ML stack yet.

Public API
----------
load_all_models()          — called once at startup; populates the registry
get_forecast_package(horizon: "7d" | "14d") -> dict
get_cow_milk_pipeline()    -> sklearn Pipeline
get_cow_clinical_pipeline() -> sklearn Pipeline
get_buffalo_pipeline()     -> sklearn Pipeline
get_cow_udder_model()      -> ultralytics YOLO
get_buffalo_udder_model()  -> ultralytics YOLO
model_status()             -> dict   (health-check snapshot)
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Internal registry
# ---------------------------------------------------------------------------

_registry: Dict[str, Any] = {}
_errors: Dict[str, str] = {}   # key → error message for models that failed to load


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _model_path(filename: str) -> Path:
    """Resolve a model filename against the configured MODEL_DIR."""
    from app.core.config import settings
    return Path(settings.MODEL_DIR) / filename


def _load_joblib(key: str, filename: str) -> None:
    """Load a joblib model/package into the registry, recording any error."""
    try:
        import joblib  # noqa: PLC0415
        path = _model_path(filename)
        if not path.exists():
            raise FileNotFoundError(f"Model file not found: {path}")
        _registry[key] = joblib.load(path)
        logger.info("Loaded joblib model [%s] from %s", key, path)
    except Exception as exc:  # noqa: BLE001
        _errors[key] = str(exc)
        logger.warning("Could not load joblib model [%s]: %s", key, exc)


def _load_yolo(key: str, filename: str) -> None:
    """Load a YOLO model into the registry, recording any error."""
    try:
        from ultralytics import YOLO  # noqa: PLC0415
        path = _model_path(filename)
        if not path.exists():
            raise FileNotFoundError(f"YOLO model file not found: {path}")
        _registry[key] = YOLO(str(path))
        logger.info("Loaded YOLO model [%s] from %s", key, path)
    except Exception as exc:  # noqa: BLE001
        _errors[key] = str(exc)
        logger.warning("Could not load YOLO model [%s]: %s", key, exc)


# ---------------------------------------------------------------------------
# Public: startup loader
# ---------------------------------------------------------------------------

def load_all_models() -> None:
    """
    Load every trained model into the in-process registry.

    Called once from the FastAPI lifespan startup handler.  Failures are
    logged as warnings rather than exceptions so the rest of the backend
    (auth, CRUD, rule-based fallback) can still serve requests even if
    the ML stack is unavailable on that host.
    """
    from app.core.config import settings  # noqa: PLC0415

    logger.info("=== GoRakshak model loader starting ===")
    logger.info("MODEL_DIR = %s", settings.MODEL_DIR)

    # --- Forecasting models (dict packages: model + feature_columns + ...) ---
    _load_joblib("forecast_7d",  settings.FORECAST_7D_MODEL_FILE)
    _load_joblib("forecast_14d", settings.FORECAST_14D_MODEL_FILE)

    # --- Classification pipelines (sklearn Pipeline objects) ---
    _load_joblib("cow_milk",     settings.COW_MILK_MODEL_FILE)
    _load_joblib("cow_clinical", settings.COW_CLINICAL_MODEL_FILE)
    _load_joblib("buffalo_v2",   settings.BUFFALO_V2_MODEL_FILE)

    # --- YOLO CV models (only if UDDER_CV_ENABLED) ---
    if settings.UDDER_CV_ENABLED:
        _load_yolo("cow_udder",     settings.COW_UDDER_MODEL_FILE)
        _load_yolo("buffalo_udder", settings.BUFFALO_UDDER_MODEL_FILE)
    else:
        logger.info("UDDER_CV_ENABLED=false — skipping YOLO model loading")

    _log_summary()


def _log_summary() -> None:
    loaded = sorted(_registry.keys())
    failed = sorted(_errors.keys())
    logger.info("Models loaded (%d): %s", len(loaded), loaded)
    if failed:
        logger.warning("Models NOT loaded (%d): %s", len(failed), failed)


# ---------------------------------------------------------------------------
# Public: accessors (raise RuntimeError if model unavailable)
# ---------------------------------------------------------------------------

def _get(key: str, description: str) -> Any:
    model = _registry.get(key)
    if model is None:
        err = _errors.get(key, "not loaded yet")
        raise RuntimeError(
            f"{description} is not available: {err}. "
            "Check MODEL_DIR configuration and that the model file exists."
        )
    return model


def get_forecast_package(horizon: str) -> dict:
    """
    Return the joblib package dict for the requested horizon.

    Parameters
    ----------
    horizon : "7d" or "14d"

    Returns
    -------
    dict with keys: model, feature_columns, target, threshold, ...
    """
    if horizon not in ("7d", "14d"):
        raise ValueError(f"Invalid horizon '{horizon}'. Must be '7d' or '14d'.")
    key = f"forecast_{horizon}"
    pkg = _get(key, f"Forecasting model ({horizon})")
    # Validate package structure
    for required_key in ("model", "feature_columns"):
        if required_key not in pkg:
            raise RuntimeError(
                f"Forecasting package for {horizon} is missing key '{required_key}'. "
                "The model file may be corrupt or from an incompatible training run."
            )
    return pkg


def get_cow_milk_pipeline():
    """Return the sklearn Pipeline for cow milk mastitis classification."""
    return _get("cow_milk", "Cow milk classification pipeline")


def get_cow_clinical_pipeline():
    """Return the sklearn Pipeline for cow clinical mastitis classification."""
    return _get("cow_clinical", "Cow clinical classification pipeline")


def get_buffalo_pipeline():
    """Return the sklearn Pipeline for buffalo SCM classification."""
    return _get("buffalo_v2", "Buffalo SCM classification pipeline")


def get_cow_udder_model():
    """Return the YOLO classification model for cow udder analysis."""
    return _get("cow_udder", "Cow udder YOLO model")


def get_buffalo_udder_model():
    """Return the YOLO segmentation model for buffalo udder analysis."""
    return _get("buffalo_udder", "Buffalo udder YOLO model")


# ---------------------------------------------------------------------------
# Public: health snapshot (used by /health endpoint & status checks)
# ---------------------------------------------------------------------------

def model_status() -> dict:
    """
    Return a snapshot of every model's availability.

    Structure::

        {
            "forecast_7d":   {"status": "ok"},
            "forecast_14d":  {"status": "ok"},
            "cow_milk":      {"status": "ok"},
            "cow_clinical":  {"status": "ok"},
            "buffalo_v2":    {"status": "ok"},
            "cow_udder":     {"status": "error", "reason": "..."},
            "buffalo_udder": {"status": "not_loaded"},
        }
    """
    all_keys = [
        "forecast_7d", "forecast_14d",
        "cow_milk", "cow_clinical", "buffalo_v2",
        "cow_udder", "buffalo_udder",
    ]
    result = {}
    for key in all_keys:
        if key in _registry:
            result[key] = {"status": "ok"}
        elif key in _errors:
            result[key] = {"status": "error", "reason": _errors[key]}
        else:
            result[key] = {"status": "not_loaded"}
    return result


# ---------------------------------------------------------------------------
# Introspection helpers (used by MLRiskEngine to discover pipeline features)
# ---------------------------------------------------------------------------

def get_pipeline_feature_names(pipeline) -> list[str]:
    """
    Extract the input feature names expected by a V2 sklearn Pipeline.

    The pipeline's ColumnTransformer records which columns it was fitted on.
    We return the union (in order) of numeric + categorical input columns —
    i.e. the column names of the raw DataFrame that must be passed to
    pipeline.predict_proba().

    Returns an empty list if introspection fails (graceful degradation).
    """
    try:
        preprocessor = pipeline.named_steps.get("preprocessor")
        if preprocessor is None:
            return []
        feature_names: list[str] = []
        for _, transformer, columns in preprocessor.transformers_:
            if isinstance(columns, list):
                feature_names.extend(columns)
        return feature_names
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not introspect pipeline features: %s", exc)
        return []
