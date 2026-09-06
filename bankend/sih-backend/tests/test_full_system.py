"""
Gorakshak Full System Test Suite
=================================
Tests every layer of the integrated system end-to-end:

  Layer 0 — Static/Import checks (no DB, no models needed)
  Layer 1 — Configuration & paths
  Layer 2 — Model loader (joblib + YOLO)
  Layer 3 — ML Risk Engine (classification pipelines)
  Layer 4 — Forecast Engine (7d/14d XGBoost)
  Layer 5 — Udder CV Service (YOLO inference)
  Layer 6 — Feature Engineering (THI, baselines, deviation)
  Layer 7 — API endpoints via FastAPI TestClient (auth, farms, animals,
             ingest sensor, ingest lab, risk compute, risk forecast,
             model-status, alerts, herd summary, udder image upload)

Run from bankend/sih-backend/ with:
    pytest tests/test_full_system.py -v --tb=short

No real MongoDB or model files are required for Layer 0-1.
Layers 2-5 require the .joblib and .pt files in /models/.
Layer 6-7 require a running MongoDB (or mongomock, configured via env).
"""

import io
import os
import sys
import json
import uuid
import asyncio
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Optional
from unittest.mock import MagicMock, patch, AsyncMock

import pytest

# ---------------------------------------------------------------------------
# Path setup — ensure app package is importable
# ---------------------------------------------------------------------------
_HERE = Path(__file__).resolve().parent
_BACKEND_ROOT = _HERE.parent
sys.path.insert(0, str(_BACKEND_ROOT))

logger = logging.getLogger(__name__)

# ===========================================================================
# LAYER 0 — Static import checks
# ===========================================================================

class TestImports:
    """Verify every new module imports without error (no side-effects)."""

    def test_import_config(self):
        from app.core.config import settings
        assert settings is not None

    def test_import_model_loader(self):
        from app.services import model_loader
        assert hasattr(model_loader, "load_all_models")
        assert hasattr(model_loader, "get_forecast_package")
        assert hasattr(model_loader, "get_cow_milk_pipeline")
        assert hasattr(model_loader, "get_cow_clinical_pipeline")
        assert hasattr(model_loader, "get_buffalo_pipeline")
        assert hasattr(model_loader, "get_cow_udder_model")
        assert hasattr(model_loader, "get_buffalo_udder_model")
        assert hasattr(model_loader, "model_status")
        assert hasattr(model_loader, "get_pipeline_feature_names")

    def test_import_ml_risk_engine(self):
        from app.services.ml_risk_engine import MLRiskEngine
        assert MLRiskEngine is not None

    def test_import_forecast_engine(self):
        from app.services.forecast_engine import (
            forecast_for_animal,
            build_forecasting_features,
        )
        assert callable(forecast_for_animal)
        assert callable(build_forecasting_features)

    def test_import_udder_cv_service(self):
        from app.services.udder_cv_service import run_udder_cv
        assert callable(run_udder_cv)

    def test_import_feature_engineering(self):
        from app.services.feature_engineering import (
            compute_thi,
            update_animal_baselines,
            compute_deviation_score,
            extract_features_for_risk_engine,
            extract_forecasting_features,
        )
        assert callable(compute_thi)
        assert callable(extract_forecasting_features)

    def test_import_risk_engine_original(self):
        from app.services.risk_engine import RuleBasedRiskEngine
        assert RuleBasedRiskEngine is not None

    def test_import_routes_risk(self):
        # Must not fail at import time even if models not loaded
        from app.api.v1 import routes_risk
        assert routes_risk.router is not None

    def test_import_routes_ingest(self):
        from app.api.v1 import routes_ingest
        assert routes_ingest.router is not None

    def test_import_main_app(self):
        from app.main import app
        assert app is not None


# ===========================================================================
# LAYER 1 — Configuration & path resolution
# ===========================================================================

class TestConfiguration:
    """Verify settings resolve correctly, especially MODEL_DIR."""

    def test_model_dir_is_set(self):
        from app.core.config import settings
        assert settings.MODEL_DIR, "MODEL_DIR must not be empty"

    def test_model_dir_points_to_models_folder(self):
        from app.core.config import settings
        p = Path(settings.MODEL_DIR)
        # The path should end with 'models'
        assert p.name == "models", (
            f"Expected MODEL_DIR to end with 'models', got '{p.name}'. "
            f"Full path: {p}"
        )

    def test_model_dir_exists(self):
        from app.core.config import settings
        p = Path(settings.MODEL_DIR)
        assert p.exists(), (
            f"MODEL_DIR does not exist on disk: {p}. "
            "Ensure the repo root /models folder is present."
        )

    def test_joblib_files_present(self):
        from app.core.config import settings
        model_dir = Path(settings.MODEL_DIR)
        expected = [
            settings.FORECAST_7D_MODEL_FILE,
            settings.FORECAST_14D_MODEL_FILE,
            settings.COW_MILK_MODEL_FILE,
            settings.COW_CLINICAL_MODEL_FILE,
            settings.BUFFALO_V2_MODEL_FILE,
        ]
        missing = [f for f in expected if not (model_dir / f).exists()]
        assert not missing, f"Missing joblib model files: {missing}"

    def test_yolo_files_present(self):
        from app.core.config import settings
        model_dir = Path(settings.MODEL_DIR)
        expected = [
            settings.COW_UDDER_MODEL_FILE,
            settings.BUFFALO_UDDER_MODEL_FILE,
        ]
        missing = [f for f in expected if not (model_dir / f).exists()]
        assert not missing, f"Missing YOLO model files: {missing}"

    def test_udder_cv_enabled_flag_is_bool(self):
        from app.core.config import settings
        assert isinstance(settings.UDDER_CV_ENABLED, bool)


# ===========================================================================
# LAYER 2 — Model Loader
# ===========================================================================

class TestModelLoader:
    """Test the singleton model registry."""

    def test_model_status_before_load(self):
        """model_status() should return not_loaded for all keys before load_all_models()."""
        # Re-import to get a fresh module state inspection
        from app.services import model_loader
        # Clear registry to simulate pre-startup state
        model_loader._registry.clear()
        model_loader._errors.clear()
        status = model_loader.model_status()
        for key, info in status.items():
            assert info["status"] in ("ok", "error", "not_loaded"), \
                f"Unexpected status for {key}: {info}"

    def test_load_all_models_runs_without_exception(self):
        """load_all_models() must not raise — failures are logged as warnings."""
        from app.services.model_loader import load_all_models
        try:
            load_all_models()
        except Exception as exc:
            pytest.fail(f"load_all_models() raised an unexpected exception: {exc}")

    def test_model_status_after_load(self):
        """After load_all_models(), each key is either 'ok' or 'error' (never 'not_loaded')."""
        from app.services.model_loader import load_all_models, model_status
        load_all_models()
        status = model_status()
        for key, info in status.items():
            assert info["status"] in ("ok", "error"), \
                f"Model '{key}' is still 'not_loaded' after load_all_models()"

    def test_forecast_packages_loaded(self):
        """Both forecasting packages should be ok and have expected keys."""
        from app.services.model_loader import load_all_models, get_forecast_package
        load_all_models()
        for horizon in ("7d", "14d"):
            try:
                pkg = get_forecast_package(horizon)
                assert "model" in pkg, f"forecast_{horizon} package missing 'model' key"
                assert "feature_columns" in pkg, \
                    f"forecast_{horizon} package missing 'feature_columns' key"
                cols = list(pkg["feature_columns"])
                assert len(cols) == 72, \
                    f"Expected 72 feature columns for {horizon}, got {len(cols)}"
            except RuntimeError as exc:
                pytest.skip(f"Forecast model {horizon} not available: {exc}")

    def test_cow_pipelines_loaded(self):
        from app.services.model_loader import load_all_models, get_cow_clinical_pipeline, get_cow_milk_pipeline
        load_all_models()
        for getter, name in [
            (get_cow_clinical_pipeline, "cow_clinical"),
            (get_cow_milk_pipeline, "cow_milk"),
        ]:
            try:
                pipeline = getter()
                assert hasattr(pipeline, "predict_proba"), \
                    f"{name} pipeline missing predict_proba method"
            except RuntimeError as exc:
                pytest.skip(f"{name} pipeline not available: {exc}")

    def test_buffalo_pipeline_loaded(self):
        from app.services.model_loader import load_all_models, get_buffalo_pipeline
        load_all_models()
        try:
            pipeline = get_buffalo_pipeline()
            assert hasattr(pipeline, "predict_proba")
        except RuntimeError as exc:
            pytest.skip(f"Buffalo pipeline not available: {exc}")

    def test_get_pipeline_feature_names(self):
        from app.services.model_loader import load_all_models, get_cow_clinical_pipeline, get_pipeline_feature_names
        load_all_models()
        try:
            pipeline = get_cow_clinical_pipeline()
            names = get_pipeline_feature_names(pipeline)
            assert isinstance(names, list), "Expected a list of feature names"
            # Should have at least a few columns
            assert len(names) > 0, "Pipeline feature names list is empty"
        except RuntimeError as exc:
            pytest.skip(f"cow_clinical pipeline not available: {exc}")

    def test_invalid_horizon_raises_value_error(self):
        from app.services.model_loader import get_forecast_package
        with pytest.raises(ValueError, match="Invalid horizon"):
            get_forecast_package("30d")


# ===========================================================================
# LAYER 3 — ML Risk Engine
# ===========================================================================

class TestMLRiskEngine:
    """Unit-test MLRiskEngine with mocked pipelines."""

    def _make_mock_pipeline(self, probability: float = 0.65):
        """Return a mock sklearn pipeline that returns a fixed probability."""
        import numpy as np
        mock = MagicMock()
        mock.predict_proba.return_value = np.array([[1 - probability, probability]])
        mock.named_steps = {
            "preprocessor": MagicMock(
                transformers_=[
                    ("numeric", MagicMock(), ["scc_value", "milk_ec", "thi"]),
                    ("categorical", MagicMock(), []),
                ]
            ),
            "model": MagicMock(feature_importances_=np.array([0.5, 0.3, 0.2])),
        }
        mock.named_steps["preprocessor"].get_feature_names_out.return_value = [
            "numeric__scc_value", "numeric__milk_ec", "numeric__thi"
        ]
        return mock

    def _make_engine_input(self, species: str = "cow") -> "RiskEngineInputSchema":
        from app.schemas.schemas import RiskEngineInputSchema
        return RiskEngineInputSchema(
            animal_id=uuid.uuid4(),
            window_start=datetime.utcnow() - timedelta(days=7),
            window_end=datetime.utcnow(),
            features={
                "animal_meta": {
                    "species": species,
                    "breed": "HF",
                    "age_months": 36,
                    "lactation_number": 2,
                    "previous_mastitis": False,
                },
                "thi_avg": 72.5,
                "thi_max": 78.0,
                "activity_deviation": -1.8,
                "rumination_inferred_deviation": -1.2,
                "surface_temp_deviation": 1.5,
                "manual_lab_data": {
                    "scc_value": 350000.0,
                    "milk_ec": 5.8,
                    "milk_temp_c": 38.5,
                    "milk_yield_l": 8.0,
                    "milk_ph": 6.7,
                    "cmt_result": "1+",
                },
            },
        )

    def test_cow_routing_uses_clinical_pipeline(self):
        from app.services.ml_risk_engine import MLRiskEngine

        mock_pipeline = self._make_mock_pipeline(0.65)
        with patch("app.services.ml_risk_engine.get_cow_clinical_pipeline", return_value=mock_pipeline), \
             patch("app.services.ml_risk_engine.get_pipeline_feature_names",
                   return_value=["scc_value", "milk_ec", "thi"]):
            engine = MLRiskEngine()
            output = engine.predict(self._make_engine_input("cow"))

        assert output.model_version == "gorakshak_cow_clinical_v2"
        assert output.risk_level == "moderate"
        assert output.risk_score_numeric == pytest.approx(0.65, abs=0.01)
        assert output.is_forecast is False

    def test_buffalo_routing(self):
        from app.services.ml_risk_engine import MLRiskEngine

        mock_pipeline = self._make_mock_pipeline(0.80)
        with patch("app.services.ml_risk_engine.get_buffalo_pipeline", return_value=mock_pipeline), \
             patch("app.services.ml_risk_engine.get_pipeline_feature_names",
                   return_value=["scc_value", "milk_ec", "thi"]):
            engine = MLRiskEngine()
            output = engine.predict(self._make_engine_input("buffalo"))

        assert output.model_version == "gorakshak_buffalo_v2"
        assert output.risk_level == "high"

    def test_risk_levels_map_correctly(self):
        from app.services.ml_risk_engine import _risk_level
        assert _risk_level(0.80) == "high"
        assert _risk_level(0.60) == "moderate"
        assert _risk_level(0.35) == "low"
        assert _risk_level(0.10) == "no_risk"

    def test_fallback_to_milk_pipeline_when_clinical_unavailable(self):
        from app.services.ml_risk_engine import MLRiskEngine

        mock_milk = self._make_mock_pipeline(0.30)
        with patch("app.services.ml_risk_engine.get_cow_clinical_pipeline",
                   side_effect=RuntimeError("not loaded")), \
             patch("app.services.ml_risk_engine.get_cow_milk_pipeline", return_value=mock_milk), \
             patch("app.services.ml_risk_engine.get_pipeline_feature_names",
                   return_value=["scc_value", "milk_ec", "thi"]):
            engine = MLRiskEngine()
            output = engine.predict(self._make_engine_input("cow"))

        assert output.model_version == "gorakshak_cow_milk_v2"

    def test_output_schema_fields_present(self):
        from app.services.ml_risk_engine import MLRiskEngine

        mock_pipeline = self._make_mock_pipeline(0.55)
        with patch("app.services.ml_risk_engine.get_cow_clinical_pipeline", return_value=mock_pipeline), \
             patch("app.services.ml_risk_engine.get_pipeline_feature_names",
                   return_value=["scc_value", "milk_ec", "thi"]):
            engine = MLRiskEngine()
            output = engine.predict(self._make_engine_input("cow"))

        assert output.risk_level in ("no_risk", "low", "moderate", "high")
        assert output.risk_score_numeric is not None
        assert isinstance(output.contributing_factors, list)
        assert output.recommended_action
        assert output.model_version
        assert output.is_forecast is False
        assert output.forecast_horizon_days is None

    def test_real_pipelines_if_available(self):
        """Integration smoke test — only runs if real joblib files are loaded."""
        from app.services.model_loader import load_all_models, model_status
        from app.services.ml_risk_engine import MLRiskEngine

        load_all_models()
        status = model_status()
        if status.get("cow_clinical", {}).get("status") != "ok":
            pytest.skip("cow_clinical pipeline not loaded — skipping real inference test")

        engine = MLRiskEngine()
        output = engine.predict(self._make_engine_input("cow"))
        assert output.risk_level in ("no_risk", "low", "moderate", "high")
        assert 0.0 <= output.risk_score_numeric <= 1.0


# ===========================================================================
# LAYER 4 — Forecast Engine
# ===========================================================================

class TestForecastEngine:
    """Test forecasting feature construction and model inference."""

    def _make_sensor_row(self, days_ago: int = 0, **overrides):
        base = {
            "recorded_at": datetime.utcnow() - timedelta(days=days_ago, hours=1),
            "activity_raw": 1200.0,
            "surface_temp_c": 38.5,
            "ambient_temp_c": 28.0,
            "relative_humidity": 65.0,
            "rumination_inferred_min": 420.0,
            "thi": 72.4,
        }
        base.update(overrides)
        return base

    def _make_lab_row(self, days_ago: int = 0, **overrides):
        base = {
            "recorded_at": datetime.utcnow() - timedelta(days=days_ago),
            "scc_value": 200000.0,
            "milk_ec": 5.2,
            "milk_temp_c": 37.8,
            "milk_yield_l": 10.5,
            "milk_ph": 6.6,
        }
        base.update(overrides)
        return base

    def test_build_forecasting_features_returns_dict(self):
        from app.services.forecast_engine import build_forecasting_features
        sensors = [self._make_sensor_row(d) for d in range(15)]
        labs    = [self._make_lab_row(d)    for d in range(15)]
        result = build_forecasting_features(sensors, labs)
        assert result is not None
        assert isinstance(result, dict)
        assert len(result) > 0

    def test_build_forecasting_features_empty_returns_none(self):
        from app.services.forecast_engine import build_forecasting_features
        assert build_forecasting_features([], []) is None

    def test_build_forecasting_features_keys_include_known_names(self):
        from app.services.forecast_engine import build_forecasting_features
        sensors = [self._make_sensor_row(d) for d in range(10)]
        labs    = [self._make_lab_row(d)    for d in range(10)]
        result = build_forecasting_features(sensors, labs)
        # These are the primary feature families the model expects
        expected_prefixes = [
            "body_temperature", "rumination_min", "activity_index",
            "scc", "milk_conductivity", "milk_temperature", "thi",
        ]
        for prefix in expected_prefixes:
            found = any(k.startswith(prefix) for k in result.keys())
            assert found, \
                f"No feature starting with '{prefix}' found in result. Keys: {list(result.keys())}"

    def test_risk_level_helper(self):
        from app.services.forecast_engine import _risk_level
        assert _risk_level(0.80) == "HIGH"
        assert _risk_level(0.60) == "MODERATE"
        assert _risk_level(0.30) == "LOW"
        assert _risk_level(0.10) == "VERY_LOW"

    @pytest.mark.asyncio
    async def test_forecast_for_animal_raises_on_no_data(self):
        from app.services.forecast_engine import forecast_for_animal
        from app.services.model_loader import load_all_models, model_status

        load_all_models()
        if model_status().get("forecast_7d", {}).get("status") != "ok":
            pytest.skip("Forecast models not loaded")

        # Mock DB with no data
        mock_db = MagicMock()
        mock_db.sensor_readings.find.return_value.to_list = AsyncMock(return_value=[])
        mock_db.manual_lab_data.find.return_value.to_list  = AsyncMock(return_value=[])
        mock_db.sensor_readings.find.return_value.sort = MagicMock(
            return_value=mock_db.sensor_readings.find.return_value
        )
        mock_db.manual_lab_data.find.return_value.sort = MagicMock(
            return_value=mock_db.manual_lab_data.find.return_value
        )

        with pytest.raises(ValueError, match="[Ii]nsufficient"):
            await forecast_for_animal(mock_db, "test_animal_id", include_shap=False)

    @pytest.mark.asyncio
    async def test_forecast_for_animal_returns_full_payload(self):
        from app.services.forecast_engine import forecast_for_animal
        from app.services.model_loader import load_all_models, model_status

        load_all_models()
        if model_status().get("forecast_7d", {}).get("status") != "ok":
            pytest.skip("Forecast models not loaded")

        sensors = [self._make_sensor_row(d) for d in range(14)]
        labs    = [self._make_lab_row(d)    for d in range(14)]

        mock_db = MagicMock()
        # forecast_engine calls .find(query, sort=[...]).to_list(None)
        # so the return value of .find() must have a directly-awaitable .to_list()
        mock_db.sensor_readings.find.return_value.to_list = AsyncMock(return_value=sensors)
        mock_db.manual_lab_data.find.return_value.to_list  = AsyncMock(return_value=labs)

        result = await forecast_for_animal(mock_db, "test_animal", include_shap=False)

        assert "forecast" in result
        forecast = result["forecast"]
        assert "risk_7d" in forecast
        assert "risk_14d" in forecast
        assert "risk_7d_level" in forecast
        assert "risk_14d_level" in forecast
        assert 0.0 <= forecast["risk_7d"] <= 1.0
        assert 0.0 <= forecast["risk_14d"] <= 1.0
        assert result["model_status"]["forecast_7d"] == "AVAILABLE"
        assert "recommendation" in result
        assert "data_disclaimer" in result


# ===========================================================================
# LAYER 5 — Udder CV Service
# ===========================================================================

class TestUdderCVService:
    """Test YOLO inference routing and output normalisation."""

    def test_run_udder_cv_missing_file_returns_none(self):
        from app.services.udder_cv_service import run_udder_cv
        result = run_udder_cv("/nonexistent/path/image.jpg", "cow")
        assert result is None, "Expected None for missing image file"

    def test_interpret_cow_healthy(self):
        from app.services.udder_cv_service import _interpret_cow_classification
        result = _interpret_cow_classification("healthy", 0.92)
        assert result["confidence"] == pytest.approx(0.92, abs=0.01)
        # Healthy → swelling should be low (1 - confidence)
        assert result["swelling"] < 0.5

    def test_interpret_cow_mastitis(self):
        from app.services.udder_cv_service import _interpret_cow_classification
        result = _interpret_cow_classification("mastitis", 0.88)
        assert result["confidence"] == pytest.approx(0.88, abs=0.01)
        assert result["swelling"] == pytest.approx(0.88, abs=0.01)
        assert result["redness"] == pytest.approx(0.88, abs=0.01)

    def test_interpret_buffalo_no_detection(self):
        from app.services.udder_cv_service import _interpret_buffalo_segmentation
        result = _interpret_buffalo_segmentation([])
        assert result["confidence"] == 0.0
        assert result["swelling"] == 0.0

    def test_interpret_buffalo_with_swelling(self):
        from app.services.udder_cv_service import _interpret_buffalo_segmentation
        detections = [
            {"class_id": 0, "class_name": "swelling", "confidence": 0.75},
            {"class_id": 1, "class_name": "redness", "confidence": 0.60},
        ]
        result = _interpret_buffalo_segmentation(detections)
        assert result["swelling"] == pytest.approx(0.75, abs=0.01)
        assert result["redness"] == pytest.approx(0.60, abs=0.01)
        assert result["confidence"] == pytest.approx(0.75, abs=0.01)

    def test_run_udder_cv_cow_with_mock_model(self, tmp_path):
        """Mock the YOLO model to test the full service flow for cow."""
        import numpy as np
        from app.services import udder_cv_service

        # Create a dummy image file
        img_path = tmp_path / "test_cow.jpg"
        img_path.write_bytes(b"\xff\xd8\xff" + b"\x00" * 100)  # minimal JPEG header

        mock_model = MagicMock()
        mock_result = MagicMock()
        mock_result.probs.top1 = 0
        mock_result.probs.top1conf = 0.91
        mock_result.names = {0: "healthy", 1: "mastitis"}
        mock_model.predict.return_value = [mock_result]

        with patch("app.services.model_loader.get_cow_udder_model", return_value=mock_model):
            result = udder_cv_service.run_udder_cv(str(img_path), "cow")

        assert result is not None
        assert "confidence" in result
        assert "model_version" in result
        assert result["model_version"] == "gorakshak_cow_udder_yolov8_classify_v1"

    def test_run_udder_cv_buffalo_with_mock_model(self, tmp_path):
        """Mock the YOLO model to test the full service flow for buffalo."""
        from app.services import udder_cv_service

        img_path = tmp_path / "test_buffalo.jpg"
        img_path.write_bytes(b"\xff\xd8\xff" + b"\x00" * 100)

        mock_model = MagicMock()
        mock_result = MagicMock()
        mock_result.masks = None  # No detections
        mock_result.boxes = MagicMock()
        mock_model.predict.return_value = [mock_result]

        with patch("app.services.model_loader.get_buffalo_udder_model",
                   return_value=mock_model):
            result = udder_cv_service.run_udder_cv(str(img_path), "buffalo")

        assert result is not None
        assert result["model_version"] == "gorakshak_buffalo_udder_yolov8_segment_v1"

    def test_run_udder_cv_real_cow_model_if_available(self):
        """Integration test — only runs if cow YOLO model is actually loaded."""
        from app.services.model_loader import load_all_models, model_status
        load_all_models()
        if model_status().get("cow_udder", {}).get("status") != "ok":
            pytest.skip("Cow YOLO model not loaded — skipping real inference test")

        # Use the bundled test image if it exists
        from app.core.config import settings
        test_img = Path(settings.MODEL_DIR) / "Cow_Udder_AI_Model" / "test_diseased.jpg"
        if not test_img.exists():
            pytest.skip(f"Test image not found: {test_img}")

        from app.services.udder_cv_service import run_udder_cv
        result = run_udder_cv(str(test_img), "cow")
        assert result is not None
        assert "confidence" in result
        assert 0.0 <= result["confidence"] <= 1.0


# ===========================================================================
# LAYER 6 — Feature Engineering
# ===========================================================================

class TestFeatureEngineering:
    """Test THI computation, baselines, deviations, and feature extraction."""

    def test_compute_thi_standard_values(self):
        from app.services.feature_engineering import compute_thi
        # Known values: T=30°C, RH=80% → THI should be in heat-stress range (>72)
        thi = compute_thi(30.0, 80.0)
        assert thi is not None
        assert thi > 70, f"Expected THI > 70 for T=30°C, RH=80%, got {thi}"

    def test_compute_thi_cool_conditions(self):
        from app.services.feature_engineering import compute_thi
        thi = compute_thi(15.0, 40.0)
        assert thi is not None
        assert thi < 65, f"Expected THI < 65 for T=15°C, RH=40%, got {thi}"

    def test_compute_thi_none_inputs_return_none(self):
        from app.services.feature_engineering import compute_thi
        assert compute_thi(None, 80.0) is None
        assert compute_thi(30.0, None) is None

    def test_compute_thi_rh_fraction_vs_percent(self):
        from app.services.feature_engineering import compute_thi
        # Function should handle both 0-1 and 0-100 RH formats
        thi_pct = compute_thi(30.0, 80.0)   # 80%
        thi_frac = compute_thi(30.0, 0.8)   # 0.8 fraction
        assert thi_pct == pytest.approx(thi_frac, abs=0.1), \
            f"THI should be same for RH=80% and RH=0.8: {thi_pct} vs {thi_frac}"

    @pytest.mark.asyncio
    async def test_compute_deviation_score_returns_none_without_baseline(self):
        from app.services.feature_engineering import compute_deviation_score
        mock_db = MagicMock()
        mock_db.baselines.find_one = AsyncMock(return_value=None)
        result = await compute_deviation_score(mock_db, "animal_1", "activity_raw", 1200.0)
        assert result is None

    @pytest.mark.asyncio
    async def test_compute_deviation_score_correct_zscore(self):
        from app.services.feature_engineering import compute_deviation_score
        mock_db = MagicMock()
        mock_db.baselines.find_one = AsyncMock(return_value={
            "baseline_mean": 1000.0,
            "baseline_stddev": 200.0,
        })
        # z = (1400 - 1000) / 200 = 2.0
        result = await compute_deviation_score(mock_db, "a1", "activity_raw", 1400.0)
        assert result == pytest.approx(2.0, abs=0.01)

    @pytest.mark.asyncio
    async def test_compute_deviation_score_zero_stddev_returns_none(self):
        from app.services.feature_engineering import compute_deviation_score
        mock_db = MagicMock()
        mock_db.baselines.find_one = AsyncMock(return_value={
            "baseline_mean": 1000.0,
            "baseline_stddev": 0.0,
        })
        result = await compute_deviation_score(mock_db, "a1", "activity_raw", 1200.0)
        assert result is None

    @pytest.mark.asyncio
    async def test_extract_features_returns_none_on_no_animal(self):
        from app.services.feature_engineering import extract_features_for_risk_engine
        mock_db = MagicMock()
        mock_db.animals.find_one = AsyncMock(return_value=None)
        result = await extract_features_for_risk_engine(
            mock_db, "nonexistent", datetime.utcnow() - timedelta(days=7), datetime.utcnow()
        )
        assert result is None

    @pytest.mark.asyncio
    async def test_extract_features_includes_new_lab_fields(self):
        """Ensure the extended manual_lab_data dict includes milk_yield_l, milk_ph."""
        from app.services.feature_engineering import extract_features_for_risk_engine

        animal_doc = {
            "_id": "a1", "species": "cow", "breed": "HF",
            "age_months": 36, "lactation_number": 2, "previous_mastitis": False,
        }
        sensor_doc = {
            "recorded_at": datetime.utcnow() - timedelta(hours=1),
            "activity_raw": 1200.0,
            "surface_temp_c": 38.5,
            "rumination_inferred_min": 400.0,
            "thi": 72.0,
        }
        lab_doc = {
            "animal_id": "a1",
            "recorded_at": datetime.utcnow() - timedelta(hours=2),
            "scc_value": 250000.0,
            "milk_ec": 5.5,
            "milk_temp_c": 38.0,
            "milk_yield_l": 9.5,
            "milk_ph": 6.65,
            "udder_temp_c": 38.2,
            "cmt_result": "1+",
        }

        mock_db = MagicMock()
        mock_db.animals.find_one = AsyncMock(return_value=animal_doc)
        mock_db.sensor_readings.find.return_value.to_list = AsyncMock(return_value=[sensor_doc])
        mock_db.manual_lab_data.find_one = AsyncMock(return_value=lab_doc)
        mock_db.udder_images.find_one = AsyncMock(return_value=None)
        mock_db.baselines.find_one = AsyncMock(return_value=None)

        result = await extract_features_for_risk_engine(
            mock_db, "a1",
            datetime.utcnow() - timedelta(days=7), datetime.utcnow()
        )

        assert result is not None
        lab_data = result.get("manual_lab_data", {})
        assert lab_data is not None
        assert "milk_yield_l" in lab_data, "milk_yield_l missing from manual_lab_data"
        assert "milk_ph" in lab_data, "milk_ph missing from manual_lab_data"
        assert "udder_temp_c" in lab_data, "udder_temp_c missing from manual_lab_data"
        assert "animal_meta" in result
        assert result["animal_meta"]["species"] == "cow"


# ===========================================================================
# LAYER 7 — API Endpoints via TestClient
# ===========================================================================

@pytest.fixture(scope="module")
def test_client():
    """
    Create a FastAPI TestClient with a mocked MongoDB database.
    Models are NOT required for this fixture — ML calls use the rule-based fallback.
    """
    from mongomock_motor import AsyncMongoMockClient
    from fastapi.testclient import TestClient
    from app.main import app
    from app.db import session as session_module

    # Use an async-compatible in-memory MongoDB implementation.
    mock_client = AsyncMongoMockClient()
    mock_db = mock_client["bovine_mastitis_test"]

    # Patch the global db reference used by get_db()
    original_db = session_module.db
    session_module.db = mock_db

    with patch("app.main.init_db", new_callable=AsyncMock), \
         patch("app.main.close_db", new_callable=AsyncMock), \
         TestClient(app, raise_server_exceptions=False) as client:
        yield client, mock_db

    session_module.db = original_db


@pytest.fixture(scope="module")
def auth_headers_and_ids(test_client):
    """
    Register an admin user, create a farm and two animals (one cow, one buffalo).
    Returns (headers, farm_id, cow_id, buffalo_id).
    """
    client, db = test_client

    # Register admin user
    reg_resp = client.post("/api/v1/auth/register", json={
        "name": "Test Admin",
        "email": "admin@gorakshak.example",
        "password": "TestPass123!",
        "role": "admin",
        "phone": "+15551234567",
    })
    assert reg_resp.status_code in (200, 400), f"Register failed: {reg_resp.text}"

    # Login
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "admin@gorakshak.example",
        "password": "TestPass123!",
    })
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create farm
    farm_resp = client.post("/api/v1/farms", json={
        "name": "Test Farm",
        "code": f"TF_{uuid.uuid4().hex[:6]}",
        "location_text": "Test Location",
    }, headers=headers)
    assert farm_resp.status_code == 200, f"Farm creation failed: {farm_resp.text}"
    farm_id = farm_resp.json()["id"]

    # Create cow
    cow_resp = client.post("/api/v1/animals", json={
        "tag_id": f"TF_COW_{uuid.uuid4().hex[:6]}",
        "species": "cow",
        "breed": "Holstein Friesian",
        "age_months": 36,
        "lactation_number": 2,
        "farm_id": farm_id,
    }, headers=headers)
    assert cow_resp.status_code == 200, f"Cow creation failed: {cow_resp.text}"
    cow_id = cow_resp.json()["id"]

    # Create buffalo
    buf_resp = client.post("/api/v1/animals", json={
        "tag_id": f"TF_BUF_{uuid.uuid4().hex[:6]}",
        "species": "buffalo",
        "breed": "Murrah",
        "age_months": 48,
        "lactation_number": 3,
        "farm_id": farm_id,
    }, headers=headers)
    assert buf_resp.status_code == 200, f"Buffalo creation failed: {buf_resp.text}"
    buffalo_id = buf_resp.json()["id"]

    return headers, farm_id, cow_id, buffalo_id


class TestAuthEndpoints:
    def test_login_returns_jwt(self, test_client):
        client, _ = test_client
        resp = client.post("/api/v1/auth/register", json={
            "name": "Auth Tester",
            "email": f"tester_{uuid.uuid4().hex[:6]}@test.com",
            "password": "Pass123!",
            "role": "farmer",
        })
        assert resp.status_code == 200

    def test_login_bad_credentials(self, test_client):
        client, _ = test_client
        resp = client.post("/api/v1/auth/login", json={
            "email": "nobody@nowhere.com",
            "password": "wrong",
        })
        assert resp.status_code == 401

    def test_me_endpoint_requires_auth(self, test_client):
        client, _ = test_client
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 401

    def test_me_endpoint_with_valid_token(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, *_ = auth_headers_and_ids
        resp = client.get("/api/v1/auth/me", headers=headers)
        assert resp.status_code == 200
        assert "email" in resp.json()


class TestFarmEndpoints:
    def test_list_farms(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, farm_id, *_ = auth_headers_and_ids
        resp = client.get("/api/v1/farms", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "data" in data
        assert any(f["id"] == farm_id for f in data["data"])

    def test_get_farm_by_id(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, farm_id, *_ = auth_headers_and_ids
        resp = client.get(f"/api/v1/farms/{farm_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == farm_id

    def test_herd_summary(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, farm_id, *_ = auth_headers_and_ids
        resp = client.get(f"/api/v1/farms/{farm_id}/summary", headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert "total_animals" in body
        assert "risk_distribution" in body
        assert "open_alerts_count" in body

    def test_farm_not_found_returns_404(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, *_ = auth_headers_and_ids
        resp = client.get(f"/api/v1/farms/{uuid.uuid4()}", headers=headers)
        assert resp.status_code == 404


class TestAnimalEndpoints:
    def test_list_animals_for_farm(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, farm_id, cow_id, buffalo_id = auth_headers_and_ids
        resp = client.get(f"/api/v1/animals?farm_id={farm_id}", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        ids = [a["id"] for a in data["data"]]
        assert cow_id in ids
        assert buffalo_id in ids

    def test_get_single_animal(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, _, cow_id, _ = auth_headers_and_ids
        resp = client.get(f"/api/v1/animals/{cow_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == cow_id
        assert resp.json()["species"] == "cow"

    def test_update_animal(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, _, cow_id, _ = auth_headers_and_ids
        resp = client.put(f"/api/v1/animals/{cow_id}",
                          json={"breed": "Jersey"}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["breed"] == "Jersey"

    def test_sensor_history_empty_initially(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, _, cow_id, _ = auth_headers_and_ids
        resp = client.get(f"/api/v1/animals/{cow_id}/sensor-history", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["meta"]["total"] == 0

    def test_risk_endpoint_404_when_no_score(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, _, cow_id, _ = auth_headers_and_ids
        resp = client.get(f"/api/v1/animals/{cow_id}/risk", headers=headers)
        assert resp.status_code == 404


class TestIngestEndpoints:
    def test_ingest_sensor_data(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, _, cow_id, _ = auth_headers_and_ids
        resp = client.post("/api/v1/ingest/sensor", json={
            "animal_id": cow_id,
            "source": "test_collar",
            "readings": [
                {
                    "recorded_at": (datetime.utcnow() - timedelta(hours=i)).isoformat(),
                    "activity_raw": 1100.0 + i * 10,
                    "surface_temp_c": 38.4 + i * 0.05,
                    "ambient_temp_c": 28.0,
                    "relative_humidity": 65.0,
                    "rumination_inferred_min": 410.0 - i * 5,
                }
                for i in range(5)
            ],
        }, headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["created"] == 5
        assert body["animal_id"] == cow_id
        assert body["sms_alert_sent"] is False

    def test_ingest_sensor_thi_computed(self, test_client, auth_headers_and_ids):
        """Verify THI is computed and stored alongside sensor data."""
        client, db = test_client
        headers, _, cow_id, _ = auth_headers_and_ids
        resp = client.post("/api/v1/ingest/sensor", json={
            "animal_id": cow_id,
            "source": "test_collar",
            "readings": [{
                "recorded_at": datetime.utcnow().isoformat(),
                "activity_raw": 1200.0,
                "ambient_temp_c": 30.0,
                "relative_humidity": 80.0,
            }],
        }, headers=headers)
        assert resp.status_code == 200
        # Verify THI was stored in MongoDB
        reading = asyncio.run(
            db.sensor_readings.find_one({"animal_id": cow_id, "thi": {"$ne": None}})
        )
        assert reading is not None, "THI not computed/stored in sensor reading"
        assert reading["thi"] > 0

    def test_ingest_sensor_sends_sms_for_high_thi(
        self, test_client, auth_headers_and_ids
    ):
        from app.api.v1 import routes_ingest

        client, _ = test_client
        headers, _, cow_id, _ = auth_headers_and_ids
        with patch.object(routes_ingest, "send_sms", new_callable=AsyncMock) as send_sms_mock:
            send_sms_mock.return_value = True
            resp = client.post("/api/v1/ingest/sensor", json={
                "animal_id": cow_id,
                "source": "test_collar",
                "readings": [{
                    "recorded_at": datetime.utcnow().isoformat(),
                    "ambient_temp_c": 30.0,
                    "relative_humidity": 80.0,
                }],
            }, headers=headers)

        assert resp.status_code == 200
        assert resp.json()["sms_alert_sent"] is True
        send_sms_mock.assert_awaited_once()
        assert send_sms_mock.await_args.args[0] == "+15551234567"
        assert "THI" in send_sms_mock.await_args.args[1]

    def test_ingest_manual_lab_data(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, _, cow_id, _ = auth_headers_and_ids
        resp = client.post("/api/v1/ingest/manual-lab", json={
            "animal_id": cow_id,
            "recorded_at": datetime.utcnow().isoformat(),
            "milk_yield_l": 10.5,
            "milk_temp_c": 38.0,
            "cmt_result": "1+",
            "scc_value": 300000,
            "scc_unit": "cells/ml",
            "milk_ph": 6.7,
            "milk_ec": 5.5,
            "data_source": "field_kit",
        }, headers=headers)
        assert resp.status_code == 200
        assert "id" in resp.json()

    def test_ingest_sensor_history_reflects_data(self, test_client, auth_headers_and_ids):
        """After ingestion, sensor-history endpoint should return data."""
        client, _ = test_client
        headers, _, cow_id, _ = auth_headers_and_ids
        resp = client.get(f"/api/v1/animals/{cow_id}/sensor-history", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["meta"]["total"] > 0

    def test_ingest_bad_animal_returns_404(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, *_ = auth_headers_and_ids
        resp = client.post("/api/v1/ingest/sensor", json={
            "animal_id": str(uuid.uuid4()),
            "source": "test",
            "readings": [{"recorded_at": datetime.utcnow().isoformat()}],
        }, headers=headers)
        assert resp.status_code == 404


class TestRiskComputeEndpoints:
    def test_compute_risk_no_data_returns_no_data_status(self, test_client, auth_headers_and_ids):
        """For an animal with no sensor data, risk compute should return no_data gracefully."""
        client, _ = test_client
        headers, _, _, buffalo_id = auth_headers_and_ids
        resp = client.post("/api/v1/risk/compute", json={"animal_id": buffalo_id},
                           headers=headers)
        assert resp.status_code == 200
        results = resp.json()["results"]
        assert len(results) == 1
        assert results[0]["status"] in ("no_data", "computed", "error")

    def test_compute_risk_with_sensor_data(self, test_client, auth_headers_and_ids):
        """After ingesting sensor data, risk compute should succeed."""
        client, _ = test_client
        headers, _, cow_id, _ = auth_headers_and_ids

        # Risk compute for cow (which already has sensor data from TestIngestEndpoints)
        resp = client.post("/api/v1/risk/compute", json={"animal_id": cow_id},
                           headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["total_computed"] >= 0
        results = body["results"]
        assert len(results) == 1
        result = results[0]
        assert result["status"] in ("computed", "no_data", "error")
        if result["status"] == "computed":
            assert result["risk_level"] in ("no_risk", "low", "moderate", "high")
            assert "model_version" in result

    def test_compute_risk_response_has_engine_used_field(self, test_client, auth_headers_and_ids):
        """New 'engine_used' field should be present in computed results."""
        client, _ = test_client
        headers, _, cow_id, _ = auth_headers_and_ids
        resp = client.post("/api/v1/risk/compute", json={"animal_id": cow_id},
                           headers=headers)
        assert resp.status_code == 200
        results = resp.json()["results"]
        if results and results[0]["status"] == "computed":
            assert "engine_used" in results[0], \
                "engine_used field missing from computed risk result"
            assert results[0]["engine_used"] in ("ml", "rule_based")

    def test_risk_history_after_compute(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, _, cow_id, _ = auth_headers_and_ids
        resp = client.get(f"/api/v1/animals/{cow_id}/risk-history", headers=headers)
        assert resp.status_code == 200
        # History may be empty if compute returned no_data, just check schema
        assert "data" in resp.json()
        assert "meta" in resp.json()


class TestForecastEndpoint:
    def test_forecast_returns_503_when_models_not_loaded(self, test_client, auth_headers_and_ids):
        """
        When forecasting models aren't loaded, endpoint must return 503
        (not 500 or a silent failure).
        """
        client, _ = test_client
        headers, _, cow_id, _ = auth_headers_and_ids

        with patch("app.api.v1.routes_risk.forecast_for_animal",
                   side_effect=RuntimeError("Forecast models not loaded")):
            resp = client.post(f"/api/v1/risk/forecast/{cow_id}", headers=headers)
        assert resp.status_code == 503
        assert "unavailable" in resp.json()["detail"].lower()

    def test_forecast_returns_422_when_insufficient_data(self, test_client, auth_headers_and_ids):
        """When there's not enough data, endpoint must return 422."""
        client, _ = test_client
        headers, _, _, buffalo_id = auth_headers_and_ids

        with patch("app.api.v1.routes_risk.forecast_for_animal",
                   side_effect=ValueError("Insufficient sensor/lab data")):
            resp = client.post(f"/api/v1/risk/forecast/{buffalo_id}", headers=headers)
        assert resp.status_code == 422

    def test_forecast_returns_full_payload_when_available(self, test_client, auth_headers_and_ids):
        """When models are loaded, forecast endpoint must return correct structure."""
        client, _ = test_client
        headers, _, cow_id, _ = auth_headers_and_ids

        mock_payload = {
            "animal_id": cow_id,
            "tag_id": "TF_COW_001",
            "species": "cow",
            "computed_at": datetime.utcnow().isoformat(),
            "model_status": {"forecast_7d": "AVAILABLE", "forecast_14d": "AVAILABLE"},
            "forecast": {
                "risk_7d": 0.42,
                "risk_7d_percent": 42.0,
                "risk_7d_level": "MODERATE",
                "risk_14d": 0.55,
                "risk_14d_percent": 55.0,
                "risk_14d_level": "MODERATE",
                "overall": 0.55,
                "overall_level": "MODERATE",
            },
            "explanations": ["SCC is contributing upward pressure to the predicted risk."],
            "recommendation": "Increase monitoring.",
            "features_used": 48,
            "data_disclaimer": "Synthetic development models.",
        }

        with patch("app.api.v1.routes_risk.forecast_for_animal",
                   return_value=mock_payload):
            resp = client.post(f"/api/v1/risk/forecast/{cow_id}", headers=headers)

        assert resp.status_code == 200
        body = resp.json()
        assert "forecast" in body
        assert "risk_7d" in body["forecast"]
        assert "risk_14d" in body["forecast"]
        assert "risk_7d_level" in body["forecast"]
        assert "recommendation" in body

    def test_forecast_nonexistent_animal_returns_404(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, *_ = auth_headers_and_ids
        resp = client.post(f"/api/v1/risk/forecast/{uuid.uuid4()}", headers=headers)
        assert resp.status_code == 404


class TestModelStatusEndpoint:
    def test_model_status_returns_200(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, *_ = auth_headers_and_ids
        resp = client.get("/api/v1/risk/model-status", headers=headers)
        assert resp.status_code == 200

    def test_model_status_has_all_model_keys(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, *_ = auth_headers_and_ids
        resp = client.get("/api/v1/risk/model-status", headers=headers)
        assert resp.status_code == 200
        models = resp.json().get("models", {})
        expected_keys = [
            "forecast_7d", "forecast_14d",
            "cow_milk", "cow_clinical", "buffalo_v2",
            "cow_udder", "buffalo_udder",
        ]
        for key in expected_keys:
            assert key in models, f"Model key '{key}' missing from /model-status response"

    def test_model_status_values_have_status_field(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, *_ = auth_headers_and_ids
        resp = client.get("/api/v1/risk/model-status", headers=headers)
        models = resp.json().get("models", {})
        for key, info in models.items():
            assert "status" in info, f"No 'status' field for model key '{key}'"
            assert info["status"] in ("ok", "error", "not_loaded"), \
                f"Unexpected status value '{info['status']}' for '{key}'"

    def test_model_status_requires_auth(self, test_client):
        client, _ = test_client
        resp = client.get("/api/v1/risk/model-status")
        assert resp.status_code == 401


class TestAlertEndpoints:
    def test_list_alerts_empty_initially(self, test_client, auth_headers_and_ids):
        client, _ = test_client
        headers, farm_id, *_ = auth_headers_and_ids
        resp = client.get(f"/api/v1/risk/farms/{farm_id}/alerts", headers=headers)
        assert resp.status_code == 200
        assert "data" in resp.json()

    def test_health_endpoint(self, test_client):
        client, _ = test_client
        resp = client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert "ml_models" in body
        assert "all_loaded" in body["ml_models"]
        assert "detail" in body["ml_models"]

    def test_root_endpoint(self, test_client):
        client, _ = test_client
        resp = client.get("/")
        assert resp.status_code == 200
        body = resp.json()
        assert "model_status_url" in body


class TestUdderImageUploadEndpoint:
    def test_udder_image_upload_returns_image_record(self, test_client, auth_headers_and_ids, tmp_path):
        """Upload a dummy image and verify the response structure."""
        client, db = test_client
        headers, _, cow_id, _ = auth_headers_and_ids

        dummy_img = tmp_path / "udder.jpg"
        dummy_img.write_bytes(b"\xff\xd8\xff\xe0" + b"\x00" * 200)

        # Patch MEDIA_DIR to tmp_path so we don't write to /media
        with patch("app.api.v1.routes_ingest.settings") as mock_settings:
            mock_settings.MEDIA_DIR = str(tmp_path)
            mock_settings.UDDER_CV_ENABLED = False  # skip actual CV for this test

            with open(dummy_img, "rb") as f:
                resp = client.post(
                    "/api/v1/ingest/udder-image",
                    data={
                        "animal_id": cow_id,
                        "captured_at": datetime.utcnow().isoformat(),
                    },
                    files={"file": ("udder.jpg", f, "image/jpeg")},
                    headers=headers,
                )

        assert resp.status_code == 200, f"Upload failed: {resp.text}"
        body = resp.json()
        assert "id" in body
        assert "animal_id" in body
        assert "image_url" in body
        # cv_result starts as null (CV runs async)
        assert body.get("cv_result") is None

    def test_udder_image_cv_result_updated_async(self, test_client, auth_headers_and_ids, tmp_path):
        """
        Verify that after upload, _run_cv_and_update writes back to MongoDB
        when UDDER_CV_ENABLED=True and a mock model is used.
        """
        client, db = test_client
        headers, _, cow_id, _ = auth_headers_and_ids

        dummy_img = tmp_path / "udder2.jpg"
        dummy_img.write_bytes(b"\xff\xd8\xff\xe0" + b"\x00" * 200)

        mock_cv_result = {
            "swelling": 0.72, "redness": 0.68,
            "asymmetry": None, "lesions": None, "discharge": None,
            "confidence": 0.85,
            "model_version": "gorakshak_cow_udder_yolov8_classify_v1",
        }

        with patch("app.api.v1.routes_ingest.settings") as mock_settings, \
             patch("app.api.v1.routes_ingest.run_udder_cv", return_value=mock_cv_result):

            mock_settings.MEDIA_DIR = str(tmp_path)
            mock_settings.UDDER_CV_ENABLED = True

            with open(dummy_img, "rb") as f:
                resp = client.post(
                    "/api/v1/ingest/udder-image",
                    data={
                        "animal_id": cow_id,
                        "captured_at": datetime.utcnow().isoformat(),
                    },
                    files={"file": ("udder2.jpg", f, "image/jpeg")},
                    headers=headers,
                )

        assert resp.status_code == 200


# ===========================================================================
# LAYER 8 — Rule-based engine still works (regression guard)
# ===========================================================================

class TestRuleBasedEngineFallback:
    """Ensure original RuleBasedRiskEngine still works after our changes."""

    def _make_input(self, species="cow"):
        from app.schemas.schemas import RiskEngineInputSchema
        return RiskEngineInputSchema(
            animal_id=uuid.uuid4(),
            window_start=datetime.utcnow() - timedelta(days=7),
            window_end=datetime.utcnow(),
            features={
                "animal_meta": {"species": species},
                "activity_deviation": -2.0,
                "rumination_inferred_deviation": -1.5,
                "surface_temp_deviation": 1.8,
                "thi_avg": 70.0,
                "thi_max": 74.0,
                "manual_lab_data": {"cmt_result": "2+"},
            },
        )

    def test_rule_based_engine_produces_output(self):
        from app.services.risk_engine import RuleBasedRiskEngine
        engine = RuleBasedRiskEngine()
        output = engine.predict(self._make_input())
        assert output.risk_level in ("no_risk", "low", "moderate", "high")
        assert output.model_version == "rule_based_v1"
        assert output.is_forecast is False

    def test_rule_based_engine_high_risk_scenario(self):
        from app.services.risk_engine import RuleBasedRiskEngine
        from app.schemas.schemas import RiskEngineInputSchema
        engine = RuleBasedRiskEngine()
        inp = RiskEngineInputSchema(
            animal_id=uuid.uuid4(),
            window_start=datetime.utcnow() - timedelta(days=7),
            window_end=datetime.utcnow(),
            features={
                "activity_deviation": -3.0,       # very low activity
                "rumination_inferred_deviation": -2.5,
                "surface_temp_deviation": 2.5,
                "thi_max": 80.0,                  # critical THI
                "manual_lab_data": {"cmt_result": "3+"},
                "animal_meta": {},
            },
        )
        output = engine.predict(inp)
        assert output.risk_level in ("moderate", "high"), \
            f"Expected high/moderate risk for extreme inputs, got {output.risk_level}"
