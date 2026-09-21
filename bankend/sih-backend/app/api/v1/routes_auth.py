"""
Authentication routes.
"""

from datetime import datetime, timedelta
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.db.mongodb_utils import (
    get_user_by_email,
    create_user,
    normalise_doc,
)
from app.models.models import UserRoleEnum
from app.schemas.schemas import LoginRequest, LoginResponse, UserResponse, UserCreate
from app.api.v1.deps import get_current_user
from datetime import datetime
import uuid as _uuid


async def _ensure_development_farm(user: dict, db: AsyncIOMotorDatabase) -> dict:
    """Assign the shared hardware test farm to unassigned development users."""
    if not settings.DEV_FALLBACK_FARM_ENABLED:
        return user
    farm = await db["farms"].find_one({"code": settings.DEV_FALLBACK_FARM_CODE})
    if farm is None:
        now = datetime.utcnow()
        farm = {
            "_id": str(_uuid.uuid4()),
            "name": settings.DEV_FALLBACK_FARM_NAME,
            "code": settings.DEV_FALLBACK_FARM_CODE,
            "location_text": "Development hardware integration farm",
            "created_at": now,
            "updated_at": now,
        }
        await db["farms"].insert_one(farm)
    await db["users"].update_one({"_id": user["_id"]}, {"$set": {"farm_id": str(farm["_id"])}})
    # Keep the known hardware fixture in the same development farm so the
    # authenticated user, animal, and device status endpoint share one scope.
    await db["animals"].update_one(
        {"tag_id": "F01_COW_001"},
        {"$set": {"farm_id": str(farm["_id"]), "updated_at": datetime.utcnow()}},
    )
    user["farm_id"] = str(farm["_id"])
    return user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Authenticate with email and password; returns JWT."""
    user = await get_user_by_email(db, request.email)
    if not user or not verify_password(request.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user = await _ensure_development_farm(user, db)
    access_token = create_access_token(
        data={"sub": user["_id"]},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    # normalise before passing to UserResponse
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**normalise_doc(user)),
    )


@router.post("/register", response_model=UserResponse)
async def register(
    request: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Register a new user account."""
    existing = await get_user_by_email(db, request.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists",
        )

    import uuid as _uuid
    new_id = str(_uuid.uuid4())
    user_data = {
        "_id": new_id,
        "name": request.name,
        "email": request.email,
        "phone": request.phone,
        "password_hash": get_password_hash(request.password),
        "role": request.role or UserRoleEnum.farmer,
        "farm_id": str(request.farm_id) if request.farm_id else None,
        "preferred_language": request.preferred_language or "en",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    stored_id = await create_user(db, user_data)
    user_data["_id"] = stored_id
    return UserResponse(**normalise_doc(user_data))


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
):
    """Return the authenticated user's profile."""
    return UserResponse(**normalise_doc(current_user))
