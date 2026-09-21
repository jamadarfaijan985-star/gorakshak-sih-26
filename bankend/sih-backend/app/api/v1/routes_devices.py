"""
Device Mapping Routes — /api/v1/devices
=========================================
Maps hardware device IDs (e.g. "ESP8266-COW-001") to animal tag_ids already
registered in MongoDB.  This is the ONLY place the ESP8266 firmware identifier
is connected to an animal record — no firmware changes needed.

Collection: device_mappings
Document shape:
    {
      "_id":        "ESP8266-COW-001",   # device_id is the primary key
      "tag_id":     "F01_COW_001",       # must match an existing animal.tag_id
      "notes":      "Collar on stall 3",
      "created_at": ISODate,
      "updated_at": ISODate
    }

Endpoints
---------
POST  /api/v1/devices/register     — create or update a device → animal mapping
GET   /api/v1/devices              — list all mappings (paginated)
GET   /api/v1/devices/{device_id}  — get one mapping
DELETE /api/v1/devices/{device_id} — remove a mapping

All endpoints require JWT authentication (any role).
"""

from __future__ import annotations

import logging
import math
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.core.config import settings
from app.api.v1.deps import get_current_user, require_farm_access
from app.db.mongodb_utils import normalise_doc

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/devices", tags=["devices"])

REAL_DEVICE_ID = "ESP8266-COW-001"
REAL_ANIMAL_TAG = "F01_COW_001"


def _telemetry_status(received_at: Optional[datetime]) -> str:
    if received_at is None:
        return "offline"
    age = math.floor((datetime.utcnow() - received_at.replace(tzinfo=None)).total_seconds())
    if age <= 15:
        return "connected"
    if age <= 60:
        return "stale"
    return "offline"


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class DeviceMappingCreate(BaseModel):
    """Request body for registering or updating a device → animal mapping."""
    device_id: str          # Hardware identifier, e.g. "ESP8266-COW-001"
    tag_id: str             # Must match an existing animal.tag_id in MongoDB
    notes: Optional[str] = None


class DeviceMappingResponse(BaseModel):
    """Response body for a single device mapping."""
    device_id: str
    tag_id: str
    animal_id: Optional[str] = None   # resolved _id of the animal (if found)
    animal_species: Optional[str] = None
    farm_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _enrich_mapping(doc: dict, db: AsyncIOMotorDatabase) -> dict:
    """Add animal_id / species / farm_id by looking up the tag_id."""
    animal = await db["animals"].find_one({"tag_id": doc["tag_id"]})
    doc["animal_id"]      = str(animal["_id"])      if animal else None
    doc["animal_species"] = animal.get("species")   if animal else None
    doc["farm_id"]        = animal.get("farm_id")   if animal else None
    return doc


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/register", response_model=DeviceMappingResponse, status_code=status.HTTP_200_OK)
async def register_device(
    body: DeviceMappingCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Register (or update) a device → animal mapping.

    - **device_id**: The identifier burned into the ESP8266 firmware (e.g. `"ESP8266-COW-001"`).
    - **tag_id**: Must match the `tag_id` field of an existing animal record.

    Once registered, the MQTT bridge will automatically resolve incoming
    `godrishti/ESP8266-COW-001/sensors` messages to the correct animal.

    If the mapping already exists it is updated (upsert).
    """
    # Verify the tag_id resolves to a real animal
    animal = await db["animals"].find_one({"tag_id": body.tag_id})
    if animal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"No animal with tag_id '{body.tag_id}' found. "
                "Register the animal via POST /api/v1/animals first."
            ),
        )

    now = datetime.utcnow()

    # Upsert — safe to call repeatedly (idempotent)
    await db["device_mappings"].update_one(
        {"_id": body.device_id},
        {
            "$set": {
                "tag_id":     body.tag_id,
                "notes":      body.notes,
                "updated_at": now,
            },
            "$setOnInsert": {
                "created_at": now,
            },
        },
        upsert=True,
    )

    logger.info(
        "[devices] Mapping registered: device_id=%s → tag_id=%s  animal_id=%s",
        body.device_id,
        body.tag_id,
        str(animal["_id"]),
    )

    doc = {
        "device_id":  body.device_id,
        "tag_id":     body.tag_id,
        "notes":      body.notes,
        "created_at": now,
        "updated_at": now,
    }
    doc = await _enrich_mapping(doc, db)
    return DeviceMappingResponse(**doc)


@router.get("/{device_id}/status", response_model=dict)
async def get_device_status(
    device_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Return authoritative device, mapping, transport, and telemetry status."""
    mapping = await db["device_mappings"].find_one({"_id": device_id})
    if mapping is None:
        raise HTTPException(status_code=404, detail=f"No mapping found for device_id '{device_id}'")
    animal = await db["animals"].find_one({"tag_id": mapping.get("tag_id")})
    if animal is None:
        raise HTTPException(status_code=404, detail="Mapped animal not found")
    await require_farm_access(str(animal.get("farm_id")), current_user, db)
    latest = await db["sensor_readings"].find_one(
        {"animal_id": str(animal["_id"])}, sort=[("received_at", -1)]
    )
    received_at = latest.get("received_at") if latest else None
    risk = await db["risk_scores"].find_one(
        {"animal_id": str(animal["_id"])}, sort=[("computed_at", -1)]
    )
    try:
        from app.services.mqtt_bridge import mqtt_bridge
        mqtt_connected = mqtt_bridge.connected
    except Exception:
        mqtt_connected = False
    farm = await db["farms"].find_one({"_id": str(animal.get("farm_id"))})
    return {
        "device_id": device_id,
        "tag_id": animal.get("tag_id"),
        "animal_id": str(animal["_id"]),
        "farm_id": str(animal.get("farm_id")),
        "farm_name": farm.get("name") if farm else None,
        "status": _telemetry_status(received_at),
        "transport": {"mqtt": "connected" if mqtt_connected else "offline", "http_fallback": "available"},
        "broker": f"{settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}",
        "topic": f"godrishti/{device_id}/sensors",
        "last_seen": received_at,
        "packets_received": await db["sensor_readings"].count_documents({"animal_id": str(animal["_id"])}),
        "latest_reading": normalise_doc(latest) if latest else None,
        "latest_risk": normalise_doc(risk) if risk else None,
    }


@router.get("", response_model=dict)
async def list_device_mappings(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    List all registered device → animal mappings.

    Returns:
        `{ "data": [...], "meta": { "total": N, "skip": S, "limit": L } }`
    """
    total = await db["device_mappings"].count_documents({})
    cursor = db["device_mappings"].find({}).skip(skip).limit(limit)
    docs = []
    async for raw in cursor:
        doc = {
            "device_id":  raw["_id"],
            "tag_id":     raw.get("tag_id", ""),
            "notes":      raw.get("notes"),
            "created_at": raw.get("created_at", datetime.utcnow()),
            "updated_at": raw.get("updated_at", datetime.utcnow()),
        }
        doc = await _enrich_mapping(doc, db)
        docs.append(doc)

    return {
        "data": docs,
        "meta": {"total": total, "skip": skip, "limit": limit},
    }


@router.get("/{device_id}", response_model=DeviceMappingResponse)
async def get_device_mapping(
    device_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get a single device mapping by device_id."""
    raw = await db["device_mappings"].find_one({"_id": device_id})
    if raw is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No mapping found for device_id '{device_id}'.",
        )
    doc = {
        "device_id":  raw["_id"],
        "tag_id":     raw.get("tag_id", ""),
        "notes":      raw.get("notes"),
        "created_at": raw.get("created_at", datetime.utcnow()),
        "updated_at": raw.get("updated_at", datetime.utcnow()),
    }
    doc = await _enrich_mapping(doc, db)
    return DeviceMappingResponse(**doc)


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device_mapping(
    device_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Remove a device → animal mapping.

    After deletion the MQTT bridge will log UNKNOWN_DEVICE_ID for messages
    from this device until a new mapping is registered.
    """
    result = await db["device_mappings"].delete_one({"_id": device_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No mapping found for device_id '{device_id}'.",
        )
    logger.info("[devices] Mapping deleted: device_id=%s", device_id)
