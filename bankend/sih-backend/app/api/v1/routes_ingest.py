"""
Data ingestion routes (sensor batch, manual-lab, udder image).
"""

import os
from datetime import datetime
from typing import Optional
import uuid as _uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

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
from app.schemas.schemas import (
    BatchSensorReadingIngest,
    ManualLabDataCreate,
    UdderImageResponse,
)
from app.api.v1.deps import get_current_user, require_animal_farm_access

router = APIRouter(prefix="/api/v1/ingest", tags=["ingest"])


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

    for reading_input in request.readings:
        try:
            thi = None
            if reading_input.ambient_temp_c is not None and reading_input.relative_humidity is not None:
                thi = compute_thi(reading_input.ambient_temp_c, reading_input.relative_humidity)

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

    return {
        "created": created_count,
        "total": len(request.readings),
        "errors": errors,
        "animal_id": animal_id,
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

    image_data = {
        "_id": str(_uuid.uuid4()),
        "animal_id": animal_id,
        "captured_at": datetime.fromisoformat(captured_at),
        "image_url": f"/media/{filename}",
        "cv_result": None,
        "cv_model_version": None,
        "reviewed_by_vet": None,
        "created_at": datetime.utcnow(),
    }
    await db.udder_images.insert_one(image_data)
    return UdderImageResponse(**normalise_doc(image_data))
