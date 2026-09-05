"""
Herd analytics / summary routes.
The herd summary endpoint is now also available via routes_farms.py.
This router is kept for backward-compatibility.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.session import get_db
from app.db.mongodb_utils import get_herd_summary
from app.schemas.schemas import HerdSummaryResponse
from app.api.v1.deps import get_current_user, require_farm_access

router = APIRouter(prefix="/api/v1/farms", tags=["summary"])


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
