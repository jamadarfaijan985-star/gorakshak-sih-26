"""
Farm management routes.
"""

from datetime import datetime
import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.session import get_db
from app.db.mongodb_utils import (
    get_farm_by_code,
    create_farm,
    list_farms,
    get_herd_summary,
    normalise_doc,
    normalise_docs,
)
from app.schemas.schemas import (
    FarmResponse,
    FarmCreate,
    FarmUpdate,
    HerdSummaryResponse,
    ListResponse,
    PaginationMeta,
)
from app.api.v1.deps import get_current_user, require_farm_access

router = APIRouter(prefix="/api/v1/farms", tags=["farms"])


@router.post("", response_model=FarmResponse)
async def create_farm_endpoint(
    request: FarmCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create a new farm.  Admin only."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users may create farms",
        )

    existing = await get_farm_by_code(db, request.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Farm with code {request.code} already exists",
        )

    new_id = str(_uuid.uuid4())
    farm_data = {
        "_id": new_id,
        "name": request.name,
        "code": request.code,
        "location_text": request.location_text,
        "latitude": request.latitude,
        "longitude": request.longitude,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    stored_id = await create_farm(db, farm_data)
    farm_data["_id"] = stored_id
    return FarmResponse(**normalise_doc(farm_data))


@router.get("", response_model=ListResponse[FarmResponse])
async def list_farms_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    List farms.
    - Admin: all farms.
    - Non-admin: only their assigned farm (if any).
    """
    if current_user.get("role") == "admin":
        farms, total = await list_farms(db, skip=skip, limit=limit)
    else:
        user_farm_id = current_user.get("farm_id")
        if not user_farm_id:
            farms, total = [], 0
        else:
            # Reuse get_farm_by_id via require_farm_access
            from app.db.mongodb_utils import get_farm_by_id
            farm = await get_farm_by_id(db, str(user_farm_id))
            farms = [farm] if farm else []
            total = len(farms)

    return ListResponse(
        data=[FarmResponse(**f) for f in farms],
        meta=PaginationMeta(total=total, skip=skip, limit=limit),
    )


@router.get("/{farm_id}", response_model=FarmResponse)
async def get_farm_endpoint(
    farm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get a single farm by ID.  Requires farm access."""
    farm = await require_farm_access(farm_id, current_user, db)
    return FarmResponse(**farm)


@router.put("/{farm_id}", response_model=FarmResponse)
async def update_farm_endpoint(
    farm_id: str,
    request: FarmUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Update farm details.  Requires farm access."""
    await require_farm_access(farm_id, current_user, db)

    update_data = request.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()

    await db.farms.update_one({"_id": farm_id}, {"$set": update_data})

    from app.db.mongodb_utils import get_farm_by_id
    updated = await get_farm_by_id(db, farm_id)
    return FarmResponse(**updated)


@router.delete("/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_farm_endpoint(
    farm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Delete a farm and its animals.  Admin only."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users may delete farms",
        )
    await require_farm_access(farm_id, current_user, db)
    await db.farms.delete_one({"_id": farm_id})
    await db.animals.delete_many({"farm_id": farm_id})


@router.get("/{farm_id}/summary", response_model=HerdSummaryResponse)
async def get_herd_summary_endpoint(
    farm_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get herd-level summary for a farm.  Requires farm access."""
    await require_farm_access(farm_id, current_user, db)
    summary = await get_herd_summary(db, farm_id)
    return HerdSummaryResponse(**summary)
