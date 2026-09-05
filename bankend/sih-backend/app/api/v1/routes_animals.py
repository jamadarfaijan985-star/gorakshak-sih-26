"""
Animal management routes.
"""

from datetime import datetime
from typing import Optional
import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.session import get_db
from app.db.mongodb_utils import (
    get_animal_by_tag,
    create_animal,
    list_farm_animals,
    get_sensor_history,
    get_risk_history,
    get_latest_risk_score,
    normalise_doc,
    normalise_docs,
)
from app.schemas.schemas import (
    AnimalResponse,
    AnimalCreate,
    AnimalUpdate,
    SensorReadingResponse,
    RiskScoreResponse,
    ListResponse,
    PaginationMeta,
)
from app.api.v1.deps import (
    get_current_user,
    require_farm_access,
    require_animal_farm_access,
)

router = APIRouter(prefix="/api/v1/animals", tags=["animals"])


@router.post("", response_model=AnimalResponse)
async def create_animal_endpoint(
    request: AnimalCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create a new animal.  The requesting user must have access to the farm."""
    farm_id_str = str(request.farm_id)
    await require_farm_access(farm_id_str, current_user, db)

    existing = await get_animal_by_tag(db, request.tag_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Animal with tag {request.tag_id} already exists",
        )

    new_id = str(_uuid.uuid4())
    animal_data = {
        "_id": new_id,
        "farm_id": farm_id_str,
        "tag_id": request.tag_id,
        "species": request.species,
        "breed": request.breed,
        "age_months": request.age_months,
        "lactation_number": request.lactation_number,
        "pregnancy_status": request.pregnancy_status,
        "previous_mastitis": request.previous_mastitis,
        "disease_history": request.disease_history or [],
        "vaccination_history": request.vaccination_history or [],
        "treatment_history": request.treatment_history or [],
        "comorbidities": request.comorbidities or [],
        "status": request.status or "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    stored_id = await create_animal(db, animal_data)
    animal_data["_id"] = stored_id
    return AnimalResponse(**normalise_doc(animal_data))


@router.get("", response_model=ListResponse[AnimalResponse])
async def list_animals_endpoint(
    farm_id: str = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    species: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """List animals for a farm.  Requires farm access."""
    await require_farm_access(farm_id, current_user, db)

    animals, total = await list_farm_animals(
        db,
        farm_id=farm_id,
        skip=skip,
        limit=limit,
        species=species,
        risk_level=risk_level,
    )

    return ListResponse(
        data=[AnimalResponse(**a) for a in animals],
        meta=PaginationMeta(total=total, skip=skip, limit=limit),
    )


@router.get("/{animal_id}", response_model=AnimalResponse)
async def get_animal_endpoint(
    animal_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get a single animal.  Requires access to the animal's farm."""
    animal = await require_animal_farm_access(animal_id, current_user, db)
    return AnimalResponse(**animal)


@router.put("/{animal_id}", response_model=AnimalResponse)
async def update_animal_endpoint(
    animal_id: str,
    request: AnimalUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Update an animal.  Requires access to the animal's farm."""
    await require_animal_farm_access(animal_id, current_user, db)

    update_data = request.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    await db.animals.update_one({"_id": animal_id}, {"$set": update_data})

    from app.db.mongodb_utils import get_animal_by_id
    updated = await get_animal_by_id(db, animal_id)
    return AnimalResponse(**updated)


@router.get("/{animal_id}/sensor-history", response_model=ListResponse[SensorReadingResponse])
async def get_sensor_history_endpoint(
    animal_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get sensor reading history for an animal.  Requires farm access."""
    await require_animal_farm_access(animal_id, current_user, db)

    readings, total = await get_sensor_history(db, animal_id, skip=skip, limit=limit)
    return ListResponse(
        data=[SensorReadingResponse(**r) for r in readings],
        meta=PaginationMeta(total=total, skip=skip, limit=limit),
    )


@router.get("/{animal_id}/risk", response_model=RiskScoreResponse)
async def get_current_risk_endpoint(
    animal_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get latest risk score for an animal.  Requires farm access."""
    await require_animal_farm_access(animal_id, current_user, db)

    risk = await get_latest_risk_score(db, animal_id)
    if not risk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No risk score computed yet for this animal",
        )
    return RiskScoreResponse(**risk)


@router.get("/{animal_id}/risk-history", response_model=ListResponse[RiskScoreResponse])
async def get_risk_history_endpoint(
    animal_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get risk score history for an animal.  Requires farm access."""
    await require_animal_farm_access(animal_id, current_user, db)

    scores, total = await get_risk_history(db, animal_id, skip=skip, limit=limit)
    return ListResponse(
        data=[RiskScoreResponse(**s) for s in scores],
        meta=PaginationMeta(total=total, skip=skip, limit=limit),
    )
