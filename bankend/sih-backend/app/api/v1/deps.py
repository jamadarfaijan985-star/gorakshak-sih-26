"""
Shared FastAPI dependency functions for authentication and authorisation.
"""

from typing import Annotated, Optional

from fastapi import Depends, Header, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import decode_token
from app.db.session import get_db
from app.db.mongodb_utils import get_user_by_id, get_farm_by_id, get_animal_by_id


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

async def get_current_user(
    authorization: Annotated[Optional[str], Header()] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    """
    Extract and validate Bearer JWT from the Authorization header.
    Returns the raw user document (with ``_id``).
    Raises HTTP 401 on any failure.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format — expected 'Bearer <token>'",
        )

    token = parts[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
        )

    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


# ---------------------------------------------------------------------------
# Farm authorisation
# ---------------------------------------------------------------------------

def _is_admin(user: dict) -> bool:
    return user.get("role") == "admin"


async def require_farm_access(
    farm_id: str,
    current_user: dict,
    db: AsyncIOMotorDatabase,
) -> dict:
    """
    Verify that *current_user* is allowed to access *farm_id*.

    Access is granted when ANY of the following is true:
    - user.role == "admin"           (admin users see all farms)
    - user.farm_id == farm_id        (user is assigned to this farm)

    Raises HTTP 403 if neither condition holds.
    Raises HTTP 404 if the farm does not exist.
    Returns the normalised farm document on success.
    """
    farm = await get_farm_by_id(db, farm_id)
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found",
        )

    if _is_admin(current_user):
        return farm

    user_farm_id = str(current_user.get("farm_id") or "")
    if user_farm_id != farm_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this farm",
        )

    return farm


async def require_animal_farm_access(
    animal_id: str,
    current_user: dict,
    db: AsyncIOMotorDatabase,
) -> dict:
    """
    Look up *animal_id*, then verify the current user has access to the
    animal's farm.  Returns the normalised animal document on success.
    """
    animal = await get_animal_by_id(db, animal_id)
    if not animal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Animal not found",
        )

    await require_farm_access(animal["farm_id"], current_user, db)
    return animal
