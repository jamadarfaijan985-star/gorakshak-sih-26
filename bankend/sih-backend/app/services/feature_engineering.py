"""
Feature engineering module for computing derived features.

Per PRD §8, the backend is responsible for:
1. THI (Temperature Humidity Index) computation
2. Rolling baseline per animal per metric
3. Deviation score (z-score or % deviation from baseline)

Extended for ML integration:
4. extract_features_for_risk_engine() now also includes raw scalar lab values
   (scc_value, milk_ec, milk_temp_c, milk_yield_l, milk_ph) so the ML
   classification pipelines (gorakshak_cow_clinical_v2, gorakshak_buffalo_v2)
   can pick them up via the feature-mapping layer in ml_risk_engine.py.
5. extract_forecasting_features() is a thin wrapper around
   forecast_engine.build_forecasting_features() — convenience entry point
   for use from routes or scheduled tasks.
"""

import math
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongodb_utils import get_baseline, create_baseline


def compute_thi(ambient_temp_c: float, relative_humidity: float) -> Optional[float]:
    """
    Compute Temperature Humidity Index (THI).

    Uses the livestock/NRC form, which produces the 0-100 THI scale used by
    the risk engine thresholds. Relative humidity may be a fraction or a
    percentage.
    """
    if ambient_temp_c is None or relative_humidity is None:
        return None

    rh_percent = relative_humidity * 100 if relative_humidity <= 1 else relative_humidity
    thi = (
        1.8 * ambient_temp_c + 32
        - (0.55 - 0.0055 * rh_percent)
        * (1.8 * ambient_temp_c - 26.8)
    )
    return round(thi, 2)


async def update_animal_baselines(
    db: AsyncIOMotorDatabase,
    animal_id: str,
    window_days: int = 7,
) -> None:
    """
    Update rolling baselines for an animal for all key metrics.
    
    Per PRD §8: compute mean/stddev over a trailing window (e.g. 7 days)
    """
    now = datetime.utcnow()
    window_start = now - timedelta(days=window_days)

    # Metrics to compute baselines for
    metrics = [
        "activity_raw",
        "rumination_inferred_min",
        "surface_temp_c",
    ]

    for metric in metrics:
        # Query sensor readings for this animal in the window
        readings = await db.sensor_readings.find({
            "animal_id": animal_id,
            "recorded_at": {"$gte": window_start, "$lte": now},
            metric: {"$ne": None},
        }).to_list(None)

        if not readings:
            continue

        # Extract values for the metric
        values = [r[metric] for r in readings if r.get(metric) is not None]

        if len(values) < 2:
            continue

        # Compute mean and stddev
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        stddev = math.sqrt(variance)

        # Store baseline
        baseline_data = {
            "animal_id": animal_id,
            "metric": metric,
            "baseline_mean": round(mean, 4),
            "baseline_stddev": round(stddev, 4),
            "window_days": window_days,
            "updated_at": now,
        }

        await create_baseline(db, baseline_data)


async def compute_deviation_score(
    db: AsyncIOMotorDatabase,
    animal_id: str,
    metric_name: str,
    value: float,
) -> Optional[float]:
    """
    Compute z-score deviation from baseline.
    
    Returns: (value - mean) / stddev, or None if no baseline or stddev=0
    """
    if value is None:
        return None

    baseline = await get_baseline(db, animal_id, metric_name)

    if not baseline:
        return None

    mean = baseline.get("baseline_mean")
    stddev = baseline.get("baseline_stddev")

    if stddev is None or stddev == 0:
        return None

    z_score = (value - mean) / stddev
    return round(z_score, 4)


async def extract_features_for_risk_engine(
    db: AsyncIOMotorDatabase,
    animal_id: str,
    window_start: datetime,
    window_end: datetime,
) -> Optional[Dict[str, Any]]:
    """
    Extract all features required by the risk engine for a given time window.
    
    Returns RiskEngineInputSchema-compatible dict, or None if insufficient data.
    Never fabricates values - all None-capable fields are None if unavailable.
    """
    # Fetch animal metadata
    animal = await db.animals.find_one({"_id": animal_id})
    if not animal:
        return None

    # Fetch sensor readings in window
    sensor_readings = await db.sensor_readings.find({
        "animal_id": animal_id,
        "recorded_at": {"$gte": window_start, "$lte": window_end},
    }).to_list(None)

    if not sensor_readings:
        return None

    # Compute feature deviations
    activity_deviation = None
    rumination_deviation = None
    surface_temp_deviation = None

    if sensor_readings:
        # Activity deviation (from latest sensor reading)
        if sensor_readings[-1].get("activity_raw") is not None:
            activity_deviation = await compute_deviation_score(
                db,
                animal_id,
                "activity_raw",
                sensor_readings[-1]["activity_raw"],
            )

        # Rumination deviation
        if sensor_readings[-1].get("rumination_inferred_min") is not None:
            rumination_deviation = await compute_deviation_score(
                db,
                animal_id,
                "rumination_inferred_min",
                sensor_readings[-1]["rumination_inferred_min"],
            )

        # Surface temperature deviation
        if sensor_readings[-1].get("surface_temp_c") is not None:
            surface_temp_deviation = await compute_deviation_score(
                db,
                animal_id,
                "surface_temp_c",
                sensor_readings[-1]["surface_temp_c"],
            )

    # Compute THI stats
    thi_values = [r.get("thi") for r in sensor_readings if r.get("thi") is not None]
    thi_avg = sum(thi_values) / len(thi_values) if thi_values else None
    thi_max = max(thi_values) if thi_values else None

    # Fetch latest manual lab data
    manual_lab = await db.manual_lab_data.find_one(
        {"animal_id": animal_id, "recorded_at": {"$lte": window_end}},
        sort=[("recorded_at", -1)],
    )

    manual_lab_data = None
    if manual_lab:
        manual_lab_data = {
            "cmt_result":   manual_lab.get("cmt_result"),
            "scc_value":    manual_lab.get("scc_value"),
            "scc_unit":     manual_lab.get("scc_unit"),
            "milk_temp_c":  manual_lab.get("milk_temp_c"),
            "milk_ec":      manual_lab.get("milk_ec"),
            # Additional scalar fields consumed by the ML classification pipelines
            "milk_yield_l":  manual_lab.get("milk_yield_l"),
            "milk_ph":       manual_lab.get("milk_ph"),
            "udder_temp_c":  manual_lab.get("udder_temp_c"),
        }

    # Fetch latest udder CV result
    udder_image = await db.udder_images.find_one(
        {"animal_id": animal_id, "captured_at": {"$lte": window_end}},
        sort=[("captured_at", -1)],
    )

    udder_cv_result = None
    if udder_image and udder_image.get("cv_result"):
        udder_cv_result = udder_image["cv_result"]

    # Animal metadata — include scalar fields useful to classification pipelines
    animal_meta = {
        "species":           animal.get("species"),
        "breed":             animal.get("breed"),
        "age_months":        animal.get("age_months"),
        "lactation_number":  animal.get("lactation_number"),
        "previous_mastitis": animal.get("previous_mastitis"),
    }

    # Build feature dict for risk engine
    features = {
        "animal_id":                    animal_id,
        "window_start":                 window_start,
        "window_end":                   window_end,
        # Z-score deviations (used by RuleBasedRiskEngine + as ML features)
        "activity_deviation":           activity_deviation,
        "rumination_inferred_deviation": rumination_deviation,
        "surface_temp_deviation":       surface_temp_deviation,
        # THI
        "thi_avg":                      thi_avg,
        "thi_max":                      thi_max,
        # Sub-dicts passed through to MLRiskEngine feature mapper
        "manual_lab_data":              manual_lab_data,
        "udder_cv_result":              udder_cv_result,
        "animal_meta":                  animal_meta,
    }

    return features


# ---------------------------------------------------------------------------
# Forecasting feature extraction (convenience wrapper)
# ---------------------------------------------------------------------------

async def extract_forecasting_features(
    db: AsyncIOMotorDatabase,
    animal_id: str,
    lookback_days: int = 21,
) -> Optional[Dict[str, Any]]:
    """
    Build the rolling-window feature dict used by the 7d/14d XGBoost
    forecasting models.

    This is a thin async wrapper around
    forecast_engine.build_forecasting_features() that handles the MongoDB
    queries so callers don't need to import forecast_engine directly.

    Returns None if there is insufficient data.
    """
    # Imported here to avoid a circular import at module load time
    from app.services.forecast_engine import build_forecasting_features  # noqa: PLC0415

    window_start = datetime.utcnow() - timedelta(days=lookback_days)

    sensor_rows = await db.sensor_readings.find(
        {"animal_id": animal_id, "recorded_at": {"$gte": window_start}},
        sort=[("recorded_at", 1)],
    ).to_list(None)

    lab_rows = await db.manual_lab_data.find(
        {"animal_id": animal_id, "recorded_at": {"$gte": window_start}},
        sort=[("recorded_at", 1)],
    ).to_list(None)

    return build_forecasting_features(sensor_rows, lab_rows)
