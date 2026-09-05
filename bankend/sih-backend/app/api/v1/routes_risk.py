"""
Risk computation and alert routes.

Engine selection
----------------
_compute_for_animal() tries MLRiskEngine first (gorakshak_cow_clinical_v2 /
gorakshak_buffalo_v2 joblib pipelines).  If the ML models are not loaded or
inference fails for any reason, it falls back transparently to the original
RuleBasedRiskEngine and records which engine actually produced the score via
the ``model_version`` field.

New endpoints
-------------
POST /api/v1/risk/forecast/{animal_id}   — 7-day + 14-day XGBoost forecasts
GET  /api/v1/risk/model-status           — reports which models are loaded
"""

import logging
from datetime import datetime, timedelta
from typing import Optional
import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.session import get_db
from app.db.mongodb_utils import (
    create_risk_score,
    get_open_alerts,
    create_alert,
    update_alert_status,
    get_animal_by_id,
    normalise_doc,
    normalise_docs,
)
from app.services.feature_engineering import extract_features_for_risk_engine
from app.services.risk_engine import RuleBasedRiskEngine
from app.services.ml_risk_engine import MLRiskEngine
from app.services.forecast_engine import forecast_for_animal
from app.services.model_loader import model_status as get_model_status
from app.services.alerting import should_generate_alert, resolve_alerts_for_animal
from app.schemas.schemas import (
    RiskComputeRequest,
    RiskEngineInputSchema,
    RiskScoreResponse,
    AlertResponse,
    AlertUpdateSchema,
    ListResponse,
    PaginationMeta,
)
from app.api.v1.deps import get_current_user, require_farm_access, require_animal_farm_access

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/risk", tags=["risk"])


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _map_severity(risk_level: str) -> str:
    return {
        "no_risk":  "low",
        "low":      "low",
        "moderate": "medium",
        "high":     "critical",
    }.get(risk_level, "medium")


def _run_risk_engine(engine_input: RiskEngineInputSchema):
    """
    Try MLRiskEngine first; fall back to RuleBasedRiskEngine on any failure.

    Returns (output: RiskEngineOutputSchema, engine_used: str).
    """
    try:
        engine = MLRiskEngine()
        output = engine.predict(engine_input)
        logger.debug("MLRiskEngine produced risk_level=%s", output.risk_level)
        return output, "ml"
    except Exception as ml_exc:
        logger.warning(
            "MLRiskEngine failed (%s) — falling back to RuleBasedRiskEngine", ml_exc
        )

    engine = RuleBasedRiskEngine()
    output = engine.predict(engine_input)
    return output, "rule_based"


async def _compute_for_animal(db: AsyncIOMotorDatabase, animal_id: str) -> dict:
    """Compute risk for one animal and persist the result; never raises."""
    animal = await get_animal_by_id(db, animal_id)
    if not animal:
        return {"animal_id": animal_id, "status": "error", "error": "Animal not found"}

    now = datetime.utcnow()
    window_start = now - timedelta(days=7)

    try:
        features = await extract_features_for_risk_engine(db, animal_id, window_start, now)
        if not features:
            return {
                "animal_id": animal_id,
                "status": "no_data",
                "message": "Insufficient data for risk computation",
            }

        output, engine_used = _run_risk_engine(RiskEngineInputSchema(**features))

        risk_data = {
            "_id": str(_uuid.uuid4()),
            "animal_id": animal_id,
            "computed_at": now,
            "window_start": window_start,
            "window_end": now,
            "risk_level": output.risk_level,
            "risk_score_numeric": output.risk_score_numeric,
            "contributing_factors": [cf.dict() for cf in output.contributing_factors],
            "recommended_action": output.recommended_action,
            "model_version": output.model_version,
            "forecast_horizon_days": output.forecast_horizon_days,
            "is_forecast": output.is_forecast,
        }
        risk_id = await create_risk_score(db, risk_data)

        alert_generated = False
        if await should_generate_alert(db, animal_id, output.risk_level):
            alert_data = {
                "_id": str(_uuid.uuid4()),
                "animal_id": animal_id,
                "risk_score_id": risk_id,
                "triggered_at": now,
                "severity": _map_severity(output.risk_level),
                "risk_level": output.risk_level,
                "message": output.recommended_action or f"Risk level: {output.risk_level}",
                "status": "open",
                "acknowledged_by": None,
                "resolved_at": None,
            }
            await create_alert(db, alert_data)
            alert_generated = True

        if output.risk_level == "no_risk":
            await resolve_alerts_for_animal(db, animal_id)

        return {
            "animal_id": animal_id,
            "risk_score_id": risk_id,
            "risk_level": output.risk_level,
            "risk_score": output.risk_score_numeric,
            "alert_generated": alert_generated,
            "engine_used": engine_used,
            "model_version": output.model_version,
            "status": "computed",
        }

    except Exception as exc:
        logger.exception("_compute_for_animal failed for animal_id=%s", animal_id)
        return {"animal_id": animal_id, "status": "error", "error": str(exc)}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/compute")
async def compute_risk(
    request: RiskComputeRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Trigger risk computation (screening, not forecast).

    - If ``animal_id`` supplied: compute for that animal (requires farm access).
    - If omitted: compute for all active animals the user can access.

    Uses MLRiskEngine (joblib pipeline) with automatic fallback to the
    rule-based engine if the ML model is unavailable.
    """
    results = []
    alert_count = 0

    if request.animal_id:
        await require_animal_farm_access(str(request.animal_id), current_user, db)
        result = await _compute_for_animal(db, str(request.animal_id))
        results.append(result)
        if result.get("alert_generated"):
            alert_count += 1
    else:
        is_admin = current_user.get("role") == "admin"
        user_farm_id = str(current_user.get("farm_id") or "")
        query: dict = {"status": "active"}
        if not is_admin and user_farm_id:
            query["farm_id"] = user_farm_id

        animals = await db.animals.find(query).to_list(None)
        for a in animals:
            result = await _compute_for_animal(db, a["_id"])
            results.append(result)
            if result.get("alert_generated"):
                alert_count += 1

    return {
        "total_computed": sum(1 for r in results if r.get("status") == "computed"),
        "alerts_generated": alert_count,
        "results": results,
    }


@router.post("/forecast/{animal_id}")
async def forecast_animal_risk(
    animal_id: str,
    include_shap: bool = Query(True, description="Include SHAP-based explanations"),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Run the 7-day and 14-day XGBoost mastitis forecasting models for one animal.

    Fetches the last 21 days of sensor + lab data from MongoDB, constructs the
    72-feature temporal input vector, and returns probability estimates for
    both horizons with human-readable SHAP explanations.

    The result is *not* persisted as a risk_score record — forecasting is an
    advisory overlay on top of the screening risk scores.  Use POST /compute
    for the canonical per-animal risk record.

    Requires farm access for the animal.
    """
    await require_animal_farm_access(animal_id, current_user, db)

    animal = await get_animal_by_id(db, animal_id)
    if not animal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Animal {animal_id} not found.",
        )

    try:
        result = await forecast_for_animal(db, animal_id, include_shap=include_shap)
    except RuntimeError as exc:
        # Forecasting models not loaded
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Forecasting models unavailable: {exc}",
        ) from exc
    except ValueError as exc:
        # Insufficient data
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    # Attach animal tag for convenience
    result["tag_id"]  = animal.get("tag_id")
    result["species"] = animal.get("species")
    return result


@router.get("/model-status")
async def model_status_endpoint(
    current_user: dict = Depends(get_current_user),
):
    """
    Return the load status of every trained ML model.

    Useful for ops/debugging — shows which models loaded successfully at
    startup and which failed (with the error reason).
    """
    return {
        "models": get_model_status(),
        "checked_at": datetime.utcnow().isoformat(),
    }


@router.get("/farms/{farm_id}/alerts", response_model=ListResponse[AlertResponse])
async def get_farm_alerts(
    farm_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """List alerts for a farm.  Requires farm access."""
    await require_farm_access(farm_id, current_user, db)

    alerts, total = await get_open_alerts(db, farm_id, skip=skip, limit=limit)

    if status_filter:
        alerts = [a for a in alerts if a.get("status") == status_filter]
    if severity:
        alerts = [a for a in alerts if a.get("severity") == severity]

    return ListResponse(
        data=[AlertResponse(**a) for a in alerts],
        meta=PaginationMeta(total=len(alerts), skip=skip, limit=limit),
    )


@router.patch("/alerts/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: str,
    request: AlertUpdateSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Acknowledge / resolve / mark false-positive an alert.
    Caller must have access to the farm that owns the alert's animal.
    """
    alert = await db.alerts.find_one({"_id": alert_id})
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found"
        )

    await require_animal_farm_access(alert["animal_id"], current_user, db)

    await update_alert_status(
        db,
        alert_id,
        status=request.status,
        acknowledged_by=(
            str(current_user.get("_id", ""))
            if request.acknowledged_by is None
            else str(request.acknowledged_by)
        ),
    )

    updated = await db.alerts.find_one({"_id": alert_id})
    return AlertResponse(**normalise_doc(updated))
