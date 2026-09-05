"""
MongoDB utility functions for common CRUD operations.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from motor.motor_asyncio import AsyncIOMotorDatabase


# ---------------------------------------------------------------------------
# _id → id serialisation helpers
# ---------------------------------------------------------------------------

def normalise_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Motor returns MongoDB documents with ``_id``.
    Every Pydantic response schema exposes the primary key as ``id``.
    This helper renames ``_id`` to ``id`` on a shallow copy so that
    ``SomeResponse(**normalise_doc(doc))`` always works.

    UUIDs are stored as plain strings in this project; the BSON ObjectId
    branch is purely defensive.
    """
    if doc is None:
        return None
    out = dict(doc)
    if "_id" in out:
        out["id"] = str(out.pop("_id"))
    return out


def normalise_docs(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Apply normalise_doc to a list, dropping any None entries."""
    return [normalise_doc(d) for d in docs if d is not None]


# ---------------------------------------------------------------------------
# User helpers
# ---------------------------------------------------------------------------

async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> Optional[Dict[str, Any]]:
    """Get user by email. Returns raw doc (with _id) for password-check use."""
    return await db.users.find_one({"email": email})


async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID. Returns raw doc so callers can choose to normalise."""
    try:
        return await db.users.find_one({"_id": user_id})
    except Exception:
        return None


async def create_user(db: AsyncIOMotorDatabase, user_data: Dict[str, Any]) -> str:
    """Create user and return the stored ID string."""
    result = await db.users.insert_one(user_data)
    return str(result.inserted_id)


# ---------------------------------------------------------------------------
# Farm helpers
# ---------------------------------------------------------------------------

async def get_farm_by_id(db: AsyncIOMotorDatabase, farm_id: str) -> Optional[Dict[str, Any]]:
    """Return normalised farm doc (id instead of _id), or None."""
    doc = await db.farms.find_one({"_id": farm_id})
    return normalise_doc(doc)


async def get_farm_by_code(db: AsyncIOMotorDatabase, code: str) -> Optional[Dict[str, Any]]:
    """Return normalised farm doc by code, or None."""
    doc = await db.farms.find_one({"code": code})
    return normalise_doc(doc)


async def create_farm(db: AsyncIOMotorDatabase, farm_data: Dict[str, Any]) -> str:
    """Insert farm document and return its _id string."""
    result = await db.farms.insert_one(farm_data)
    return str(result.inserted_id)


async def list_farms(
    db: AsyncIOMotorDatabase,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[Dict[str, Any]], int]:
    """Return (normalised farm list, total count)."""
    total = await db.farms.count_documents({})
    docs = await db.farms.find({}).skip(skip).limit(limit).to_list(limit)
    return normalise_docs(docs), total


# ---------------------------------------------------------------------------
# Animal helpers
# ---------------------------------------------------------------------------

async def get_animal_by_id(db: AsyncIOMotorDatabase, animal_id: str) -> Optional[Dict[str, Any]]:
    """Return normalised animal doc by internal ID, or None."""
    doc = await db.animals.find_one({"_id": animal_id})
    return normalise_doc(doc)


async def get_animal_by_tag(db: AsyncIOMotorDatabase, tag_id: str) -> Optional[Dict[str, Any]]:
    """Return normalised animal doc by tag_id, or None."""
    doc = await db.animals.find_one({"tag_id": tag_id})
    return normalise_doc(doc)


async def create_animal(db: AsyncIOMotorDatabase, animal_data: Dict[str, Any]) -> str:
    """Insert animal document and return its _id string."""
    result = await db.animals.insert_one(animal_data)
    return str(result.inserted_id)


async def list_farm_animals(
    db: AsyncIOMotorDatabase,
    farm_id: str,
    skip: int = 0,
    limit: int = 100,
    species: Optional[str] = None,
    risk_level: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], int]:
    """Return (normalised animal list for farm, total count)."""
    filter_dict: Dict[str, Any] = {"farm_id": farm_id}
    if species:
        filter_dict["species"] = species
    # risk_level filter would require aggregation; deferred to future phase
    total = await db.animals.count_documents(filter_dict)
    docs = await db.animals.find(filter_dict).skip(skip).limit(limit).to_list(limit)
    return normalise_docs(docs), total


# ---------------------------------------------------------------------------
# Sensor reading helpers
# ---------------------------------------------------------------------------

async def create_sensor_reading(db: AsyncIOMotorDatabase, reading_data: Dict[str, Any]) -> str:
    result = await db.sensor_readings.insert_one(reading_data)
    return str(result.inserted_id)


async def get_sensor_history(
    db: AsyncIOMotorDatabase,
    animal_id: str,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[Dict[str, Any]], int]:
    """Return (normalised sensor readings, total count), most recent first."""
    filter_dict = {"animal_id": animal_id}
    total = await db.sensor_readings.count_documents(filter_dict)
    docs = (
        await db.sensor_readings.find(filter_dict)
        .sort("recorded_at", -1)
        .skip(skip)
        .limit(limit)
        .to_list(limit)
    )
    return normalise_docs(docs), total


# ---------------------------------------------------------------------------
# Manual lab data helpers
# ---------------------------------------------------------------------------

async def create_manual_lab_data(db: AsyncIOMotorDatabase, lab_data: Dict[str, Any]) -> str:
    result = await db.manual_lab_data.insert_one(lab_data)
    return str(result.inserted_id)


# ---------------------------------------------------------------------------
# Risk score helpers
# ---------------------------------------------------------------------------

async def create_risk_score(db: AsyncIOMotorDatabase, risk_data: Dict[str, Any]) -> str:
    result = await db.risk_scores.insert_one(risk_data)
    return str(result.inserted_id)


async def get_latest_risk_score(
    db: AsyncIOMotorDatabase,
    animal_id: str,
) -> Optional[Dict[str, Any]]:
    """Return normalised latest risk score for an animal, or None."""
    doc = await db.risk_scores.find_one(
        {"animal_id": animal_id},
        sort=[("computed_at", -1)],
    )
    return normalise_doc(doc)


async def get_risk_history(
    db: AsyncIOMotorDatabase,
    animal_id: str,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[Dict[str, Any]], int]:
    """Return (normalised risk scores, total count), most recent first."""
    filter_dict = {"animal_id": animal_id}
    total = await db.risk_scores.count_documents(filter_dict)
    docs = (
        await db.risk_scores.find(filter_dict)
        .sort("computed_at", -1)
        .skip(skip)
        .limit(limit)
        .to_list(limit)
    )
    return normalise_docs(docs), total


# ---------------------------------------------------------------------------
# Alert helpers
# ---------------------------------------------------------------------------

async def create_alert(db: AsyncIOMotorDatabase, alert_data: Dict[str, Any]) -> str:
    result = await db.alerts.insert_one(alert_data)
    return str(result.inserted_id)


async def get_open_alerts(
    db: AsyncIOMotorDatabase,
    farm_id: str,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Return (normalised open alerts for farm, total count).
    Uses a $lookup to filter alerts by farm via the animal's farm_id.
    """
    base_pipeline = [
        {
            "$lookup": {
                "from": "animals",
                "localField": "animal_id",
                "foreignField": "_id",
                "as": "animal",
            }
        },
        {
            "$match": {
                "animal.farm_id": farm_id,
                "status": "open",
            }
        },
        {"$sort": {"triggered_at": -1}},
    ]

    count_pipeline = base_pipeline + [{"$count": "total"}]
    count_result = await db.alerts.aggregate(count_pipeline).to_list(None)
    total = count_result[0]["total"] if count_result else 0

    data_pipeline = base_pipeline + [{"$skip": skip}, {"$limit": limit}]
    docs = await db.alerts.aggregate(data_pipeline).to_list(limit)
    return normalise_docs(docs), total


async def update_alert_status(
    db: AsyncIOMotorDatabase,
    alert_id: str,
    status: str,
    acknowledged_by: Optional[str] = None,
) -> bool:
    update_data: Dict[str, Any] = {"status": status}
    if acknowledged_by:
        update_data["acknowledged_by"] = acknowledged_by
    if status == "resolved":
        update_data["resolved_at"] = datetime.utcnow()
    result = await db.alerts.update_one({"_id": alert_id}, {"$set": update_data})
    return result.modified_count > 0


# ---------------------------------------------------------------------------
# Herd summary  (P0 bugfixes: farm_id returned, datetime type, farm-scoped
#                open_alerts_count via animal join)
# ---------------------------------------------------------------------------

async def get_herd_summary(
    db: AsyncIOMotorDatabase,
    farm_id: str,
) -> Dict[str, Any]:
    """
    Return herd-level summary for a single farm.

    Fixes applied vs original implementation
    ----------------------------------------
    1. ``farm_id`` is now included in the returned dict so that
       ``HerdSummaryResponse`` validates without error.
    2. ``last_updated`` is returned as a ``datetime`` object, not an
       ISO-string, so Pydantic's ``datetime`` field accepts it.
    3. ``open_alerts_count`` is farm-scoped: counts only alerts whose
       parent animal belongs to this farm (avoids cross-farm data leak).
    """
    total_animals = await db.animals.count_documents(
        {"farm_id": farm_id, "status": "active"}
    )

    cow_count = await db.animals.count_documents(
        {"farm_id": farm_id, "species": "cow"}
    )
    buffalo_count = await db.animals.count_documents(
        {"farm_id": farm_id, "species": "buffalo"}
    )

    # Risk distribution via latest risk score per animal
    # Uses $unwind + $sort + $group to avoid $sortArray (MongoDB 5.2+)
    # which is not supported by mongomock.
    risk_pipeline = [
        {"$match": {"farm_id": farm_id}},
        {
            "$lookup": {
                "from": "risk_scores",
                "localField": "_id",
                "foreignField": "animal_id",
                "as": "risk_scores",
            }
        },
        # Unwind so each (animal, risk_score) becomes its own document;
        # preserveNullAndEmptyArrays so animals with no scores are kept.
        {
            "$unwind": {
                "path": "$risk_scores",
                "preserveNullAndEmptyArrays": True,
            }
        },
        # Sort descending by computed_at so the most recent score comes first.
        {"$sort": {"risk_scores.computed_at": -1}},
        # Group back to one document per animal, keeping the first (latest) score.
        {
            "$group": {
                "_id": "$_id",
                "risk_level": {"$first": "$risk_scores.risk_level"},
            }
        },
        # Final group: count animals per risk level.
        {
            "$group": {
                "_id": "$risk_level",
                "count": {"$sum": 1},
            }
        },
    ]
    risk_dist_result = await db.animals.aggregate(risk_pipeline).to_list(None)
    risk_distribution: Dict[str, int] = {
        "no_risk": 0,
        "low": 0,
        "moderate": 0,
        "high": 0,
    }
    for item in risk_dist_result:
        key = item.get("_id")
        if key and key in risk_distribution:
            risk_distribution[key] = item["count"]

    # Farm-scoped open alert count — join alerts → animals by farm_id
    alert_count_pipeline = [
        {"$match": {"status": "open"}},
        {
            "$lookup": {
                "from": "animals",
                "localField": "animal_id",
                "foreignField": "_id",
                "as": "animal",
            }
        },
        {"$match": {"animal.farm_id": farm_id}},
        {"$count": "total"},
    ]
    alert_count_result = await db.alerts.aggregate(alert_count_pipeline).to_list(None)
    open_alerts_count: int = (
        alert_count_result[0]["total"] if alert_count_result else 0
    )

    return {
        "farm_id": farm_id,                   # Fix 1: was missing
        "total_animals": total_animals,
        "animals_by_species": {"cow": cow_count, "buffalo": buffalo_count},
        "risk_distribution": risk_distribution,
        "open_alerts_count": open_alerts_count,  # Fix 3: farm-scoped
        "last_updated": datetime.utcnow(),      # Fix 2: datetime, not str
    }


# ---------------------------------------------------------------------------
# Baseline helpers
# ---------------------------------------------------------------------------

async def create_baseline(db: AsyncIOMotorDatabase, baseline_data: Dict[str, Any]) -> str:
    result = await db.baselines.update_one(
        {"animal_id": baseline_data["animal_id"], "metric": baseline_data["metric"]},
        {"$set": baseline_data},
        upsert=True,
    )
    return f"{baseline_data['animal_id']}:{baseline_data['metric']}"


async def get_baseline(
    db: AsyncIOMotorDatabase,
    animal_id: str,
    metric: str,
) -> Optional[Dict[str, Any]]:
    return await db.baselines.find_one({"animal_id": animal_id, "metric": metric})
