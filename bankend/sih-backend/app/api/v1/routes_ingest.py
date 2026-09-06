"""
Data ingestion routes (sensor batch, manual-lab, udder image).
"""

import asyncio
import logging
import os
from datetime import datetime
from typing import Optional
import uuid as _uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.config import settings
from app.db.session import get_db
from app.db.mongodb_utils import (
    get_animal_by_id,
    get_animal_by_tag,
    create_sensor_reading,
    create_manual_lab_data,
    normalise_doc,
)
from app.services.feature_engineering import compute_thi, update_animal_baselines
from app.services.sms_alerting import heat_stress_message, send_sms
from app.services.udder_cv_service import run_udder_cv
from app.schemas.schemas import (
    BatchSensorReadingIngest,
    ManualLabDataCreate,
    UdderImageResponse,
)
from app.api.v1.deps import get_current_user, require_animal_farm_access

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ingest", tags=["ingest"])


# ---------------------------------------------------------------------------
# ESP8266 / Hardware device schema
# ---------------------------------------------------------------------------

class ESP8266SensorPayload(BaseModel):
    """
    Flat JSON payload sent directly by the ESP8266 collar firmware.

    Field mapping  →  internal schema
    ----------------------------------
    cow_id              →  tag_id  (resolved to animal_id via DB lookup)
    body_temperature    →  surface_temp_c   (DS18B20 on-collar probe)
    ambient_temperature →  ambient_temp_c   (SHT31-D)
    humidity            →  relative_humidity (SHT31-D, %)
    activity            →  activity_raw     (MPU6050 magnitude, float)
    mic_average         →  audio_features.mic_average  (MAX9814)
    mic_peak_peak       →  audio_features.mic_peak_peak
    """
    cow_id: str
    body_temperature: Optional[float] = None
    ambient_temperature: Optional[float] = None
    humidity: Optional[float] = None
    activity: Optional[float] = None
    mic_average: Optional[float] = None
    mic_peak_peak: Optional[float] = None
    timestamp: Optional[str] = None


@router.post("/sensor")
async def ingest_sensor_data(
    request: BatchSensorReadingIngest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Ingest batched sensor readings from a gateway.
    Caller must have access to the farm that owns the animal.
    """
    # Resolve animal
    animal = None
    if request.animal_id:
        animal = await get_animal_by_id(db, str(request.animal_id))
    elif request.tag_id:
        animal = await get_animal_by_tag(db, request.tag_id)

    if not animal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Animal not found")

    # Authorise against the animal's farm
    await require_animal_farm_access(animal["id"], current_user, db)

    animal_id = animal["id"]  # already normalised by get_animal_by_id
    created_count = 0
    errors = []
    heat_stress_reading = None

    for reading_input in request.readings:
        try:
            thi = None
            if reading_input.ambient_temp_c is not None and reading_input.relative_humidity is not None:
                thi = compute_thi(reading_input.ambient_temp_c, reading_input.relative_humidity)
                if thi is not None and thi >= settings.SMS_THI_THRESHOLD:
                    if heat_stress_reading is None or thi > heat_stress_reading["thi"]:
                        heat_stress_reading = {
                            "thi": thi,
                            "ambient_temp_c": reading_input.ambient_temp_c,
                            "relative_humidity": reading_input.relative_humidity,
                        }

            reading_data = {
                "_id": str(_uuid.uuid4()),
                "animal_id": animal_id,
                "recorded_at": reading_input.recorded_at,
                "received_at": datetime.utcnow(),
                "activity_raw": reading_input.activity_raw,
                "surface_temp_c": reading_input.surface_temp_c,
                "ambient_temp_c": reading_input.ambient_temp_c,
                "relative_humidity": reading_input.relative_humidity,
                "audio_features": reading_input.audio_features,
                "rumination_inferred_min": reading_input.rumination_inferred_min,
                "thi": thi,
                "source": reading_input.source,
            }
            await create_sensor_reading(db, reading_data)
            created_count += 1
        except Exception as exc:
            errors.append({"error": str(exc)})

    try:
        await update_animal_baselines(db, animal_id, window_days=7)
    except Exception as exc:
        errors.append({"operation": "baseline_update", "error": str(exc)})

    sms_alert_sent = False
    if heat_stress_reading:
        sms_alert_sent = await send_sms(
            current_user.get("phone"),
            heat_stress_message(
                animal.get("tag_id", animal_id),
                heat_stress_reading["thi"],
                heat_stress_reading["ambient_temp_c"],
                heat_stress_reading["relative_humidity"],
            ),
        )

    return {
        "created": created_count,
        "total": len(request.readings),
        "errors": errors,
        "animal_id": animal_id,
        "sms_alert_sent": sms_alert_sent,
    }


@router.post("/manual-lab", response_model=dict)
async def ingest_manual_lab_data(
    request: ManualLabDataCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Ingest manual lab data entry.
    Caller must have access to the farm that owns the animal.
    """
    animal_id_str = str(request.animal_id)
    await require_animal_farm_access(animal_id_str, current_user, db)

    lab_data = {
        "_id": str(_uuid.uuid4()),
        "animal_id": animal_id_str,
        "recorded_at": request.recorded_at,
        "milk_yield_l": request.milk_yield_l,
        "milk_temp_c": request.milk_temp_c,
        "udder_temp_c": request.udder_temp_c,
        "cmt_result": request.cmt_result,
        "scc_value": request.scc_value,
        "scc_unit": request.scc_unit,
        "milk_ph": request.milk_ph,
        "milk_ec": request.milk_ec,
        "data_source": request.data_source,
        "entered_by_user_id": str(current_user.get("_id", "")),
        "created_at": datetime.utcnow(),
    }

    lab_id = await create_manual_lab_data(db, lab_data)
    return {
        "id": lab_id,
        "animal_id": animal_id_str,
        "created_at": lab_data["created_at"].isoformat(),
    }


@router.post("/udder-image", response_model=UdderImageResponse)
async def upload_udder_image(
    animal_id: str = Form(...),
    captured_at: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Upload an udder image (multipart/form-data).

    YOLO inference runs synchronously before the response is returned so the
    caller always receives a populated cv_result (not null).  The inference
    takes ~0.5-2 s on CPU; acceptable for a single upload action.
    Caller must have access to the farm that owns the animal.
    """
    await require_animal_farm_access(animal_id, current_user, db)

    os.makedirs(settings.MEDIA_DIR, exist_ok=True)

    filename = f"{animal_id}_{datetime.utcnow().timestamp()}_{file.filename}"
    file_path = os.path.join(settings.MEDIA_DIR, filename)

    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {exc}",
        )

    # Resolve species for model routing
    species = "cow"
    try:
        animal = await get_animal_by_id(db, animal_id)
        if animal:
            species = (animal.get("species") or "cow").lower()
    except Exception:  # noqa: BLE001
        pass

    # Run YOLO inference synchronously in a thread executor so we don't block
    # the event loop, but we DO await the result before responding.
    cv_result_raw = None
    model_version = None
    if settings.UDDER_CV_ENABLED:
        try:
            loop = asyncio.get_event_loop()
            cv_result_raw = await loop.run_in_executor(
                None, run_udder_cv, file_path, species
            )
            if cv_result_raw is not None:
                model_version = cv_result_raw.pop("model_version", None)
                cv_result_raw.pop("raw_label", None)
                cv_result_raw.pop("detections", None)
                logger.info(
                    "Udder CV complete synchronously: species=%s model=%s",
                    species, model_version,
                )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Udder CV inference failed: %s", exc)
            cv_result_raw = None

    image_data = {
        "_id": str(_uuid.uuid4()),
        "animal_id": animal_id,
        "captured_at": datetime.fromisoformat(captured_at),
        "image_url": f"/media/{filename}",
        "cv_result": cv_result_raw,
        "cv_model_version": model_version,
        "reviewed_by_vet": None,
        "created_at": datetime.utcnow(),
    }
    await db.udder_images.insert_one(image_data)

    return UdderImageResponse(**normalise_doc(image_data))



# ---------------------------------------------------------------------------
# ESP8266 / Hardware device endpoint
# ---------------------------------------------------------------------------


@router.post("/esp8266")
async def ingest_esp8266(
    payload: ESP8266SensorPayload,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Single-reading ingest from an ESP8266 collar device.

    **Authentication**: None required — devices POST directly.
    The cow_id (tag_id) must already exist in the database.

    Field mapping from ESP8266 firmware → internal sensor schema:
    - body_temperature   → surface_temp_c
    - ambient_temperature → ambient_temp_c
    - humidity           → relative_humidity
    - activity           → activity_raw
    - mic_average / mic_peak_peak → stored in audio_features{}

    THI is computed automatically.
    Baselines are updated automatically.
    Call POST /api/v1/risk/compute with the animal_id afterwards to
    run the ML risk engine on the freshly stored reading.
    """
    # Resolve animal by tag_id (cow_id from firmware)
    animal = await get_animal_by_tag(db, payload.cow_id)
    if not animal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Animal with tag_id '{payload.cow_id}' not found. "
                   "Register the animal in the system before sending data.",
        )

    animal_id = animal["id"]

    # Determine recorded_at — use device timestamp if supplied, else server time
    if payload.timestamp:
        try:
            recorded_at = datetime.fromisoformat(payload.timestamp)
        except ValueError:
            recorded_at = datetime.utcnow()
    else:
        recorded_at = datetime.utcnow()

    # Compute THI from ambient temp + humidity
    thi = None
    if payload.ambient_temperature is not None and payload.humidity is not None:
        thi = compute_thi(payload.ambient_temperature, payload.humidity)

    # Pack microphone channels into the audio_features dict
    audio_features = {}
    if payload.mic_average is not None:
        audio_features["mic_average"] = payload.mic_average
    if payload.mic_peak_peak is not None:
        audio_features["mic_peak_peak"] = payload.mic_peak_peak

    reading_data = {
        "_id": str(_uuid.uuid4()),
        "animal_id": animal_id,
        "recorded_at": recorded_at,
        "received_at": datetime.utcnow(),
        "surface_temp_c": payload.body_temperature,
        "ambient_temp_c": payload.ambient_temperature,
        "relative_humidity": payload.humidity,
        "activity_raw": payload.activity,
        "audio_features": audio_features or None,
        "rumination_inferred_min": None,    # inferred by ML pipeline later
        "thi": thi,
        "source": "esp8266_collar",
    }

    reading_id = await create_sensor_reading(db, reading_data)

    # Update per-animal rolling baselines (7-day window)
    try:
        await update_animal_baselines(db, animal_id, window_days=7)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Baseline update failed for %s: %s", animal_id, exc)

    # Check for heat-stress SMS alert
    sms_alert_sent = False
    if thi is not None and thi >= settings.SMS_THI_THRESHOLD:
        sms_alert_sent = await send_sms(
            None,  # no user phone at device level — handled by SMS service config
            heat_stress_message(
                payload.cow_id, thi,
                payload.ambient_temperature,
                payload.humidity,
            ),
        )

    return {
        "status": "ok",
        "reading_id": reading_id,
        "animal_id": animal_id,
        "tag_id": payload.cow_id,
        "species": animal.get("species"),
        "stored": {
            "surface_temp_c": payload.body_temperature,
            "ambient_temp_c": payload.ambient_temperature,
            "relative_humidity": payload.humidity,
            "activity_raw": payload.activity,
            "thi": thi,
            "audio_features": audio_features or None,
        },
        "baselines_updated": True,
        "sms_alert_sent": sms_alert_sent,
        "next_step": f"POST /api/v1/risk/compute with {{\"animal_id\": \"{animal_id}\"}} to run ML prediction",
    }


@router.get("/udder-image/{image_id}", response_model=UdderImageResponse)
async def get_udder_image(
    image_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Fetch a stored udder image record by ID (includes cv_result once available).
    Useful for polling after an async CV job.
    """
    doc = await db.udder_images.find_one({"_id": image_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Udder image record not found",
        )
    await require_animal_farm_access(doc["animal_id"], current_user, db)
    return UdderImageResponse(**normalise_doc(doc))
