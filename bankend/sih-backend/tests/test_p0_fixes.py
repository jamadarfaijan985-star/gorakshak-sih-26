"""
Phase 1 regression tests — P0 fixes.

Covers:
  1. _id → id serialisation  (normalise_doc helper)
  2. get_herd_summary() — farm_id present, datetime type, farm-scoped open_alerts_count
  3. Farm-level authorisation — no cross-farm access

Uses mongomock-motor (async-compatible in-memory MongoDB stub) so no real
MongoDB connection is required.

Install: pip install mongomock-motor
"""

import asyncio
import uuid
from datetime import datetime

import pytest

try:
    from mongomock_motor import AsyncMongoMockClient
    MONGOMOCK_AVAILABLE = True
except ImportError:
    MONGOMOCK_AVAILABLE = False

from app.db.mongodb_utils import (
    normalise_doc,
    normalise_docs,
    get_herd_summary,
    get_farm_by_id,
    get_animal_by_id,
)

pytestmark = pytest.mark.asyncio


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_db():
    """Return an in-memory async MongoDB client and a test DB."""
    client = AsyncMongoMockClient()
    return client["test_db"]


# ---------------------------------------------------------------------------
# 1.  normalise_doc / normalise_docs
# ---------------------------------------------------------------------------

def test_normalise_doc_renames_id_field():
    doc = {"_id": "abc-123", "name": "Farm A", "code": "F01"}
    result = normalise_doc(doc)
    assert "id" in result
    assert result["id"] == "abc-123"
    assert "_id" not in result


def test_normalise_doc_none_returns_none():
    assert normalise_doc(None) is None


def test_normalise_doc_preserves_other_fields():
    doc = {"_id": "x", "name": "Cow", "species": "cow", "farm_id": "f1"}
    result = normalise_doc(doc)
    assert result["name"] == "Cow"
    assert result["species"] == "cow"
    assert result["farm_id"] == "f1"


def test_normalise_docs_list():
    docs = [
        {"_id": "id1", "value": 1},
        {"_id": "id2", "value": 2},
    ]
    results = normalise_docs(docs)
    assert len(results) == 2
    for r in results:
        assert "id" in r
        assert "_id" not in r


def test_normalise_docs_skips_none():
    docs = [{"_id": "id1"}, None, {"_id": "id2"}]
    results = normalise_docs(docs)
    assert len(results) == 2


# ---------------------------------------------------------------------------
# 2.  get_herd_summary — correctness
# ---------------------------------------------------------------------------

@pytest.mark.skipif(not MONGOMOCK_AVAILABLE, reason="mongomock-motor not installed")
async def test_herd_summary_farm_id_present():
    db = _make_db()
    farm_id = str(uuid.uuid4())

    # Insert one active cow
    await db.animals.insert_one({
        "_id": str(uuid.uuid4()),
        "farm_id": farm_id,
        "species": "cow",
        "status": "active",
        "tag_id": "T01",
    })

    summary = await get_herd_summary(db, farm_id)
    assert "farm_id" in summary, "farm_id must be present in herd summary"
    assert summary["farm_id"] == farm_id


@pytest.mark.skipif(not MONGOMOCK_AVAILABLE, reason="mongomock-motor not installed")
async def test_herd_summary_last_updated_is_datetime():
    db = _make_db()
    farm_id = str(uuid.uuid4())
    await db.animals.insert_one({
        "_id": str(uuid.uuid4()),
        "farm_id": farm_id,
        "species": "buffalo",
        "status": "active",
        "tag_id": "T02",
    })

    summary = await get_herd_summary(db, farm_id)
    assert isinstance(summary["last_updated"], datetime), (
        f"last_updated must be datetime, got {type(summary['last_updated'])}"
    )


@pytest.mark.skipif(not MONGOMOCK_AVAILABLE, reason="mongomock-motor not installed")
async def test_herd_summary_open_alerts_farm_scoped():
    """
    Alert belonging to FARM_A should NOT appear in FARM_B's open_alerts_count.
    """
    db = _make_db()
    farm_a = str(uuid.uuid4())
    farm_b = str(uuid.uuid4())

    animal_a_id = str(uuid.uuid4())
    animal_b_id = str(uuid.uuid4())

    # Animals
    await db.animals.insert_many([
        {"_id": animal_a_id, "farm_id": farm_a, "species": "cow",
         "status": "active", "tag_id": "A1"},
        {"_id": animal_b_id, "farm_id": farm_b, "species": "cow",
         "status": "active", "tag_id": "B1"},
    ])

    # Two open alerts — one per farm
    await db.alerts.insert_many([
        {"_id": str(uuid.uuid4()), "animal_id": animal_a_id,
         "status": "open", "triggered_at": datetime.utcnow(), "severity": "high",
         "message": "Alert for farm A"},
        {"_id": str(uuid.uuid4()), "animal_id": animal_b_id,
         "status": "open", "triggered_at": datetime.utcnow(), "severity": "low",
         "message": "Alert for farm B"},
    ])

    summary_a = await get_herd_summary(db, farm_a)
    summary_b = await get_herd_summary(db, farm_b)

    # Each farm should see exactly 1 alert, not 2
    assert summary_a["open_alerts_count"] == 1, (
        f"Farm A should have 1 open alert, got {summary_a['open_alerts_count']}"
    )
    assert summary_b["open_alerts_count"] == 1, (
        f"Farm B should have 1 open alert, got {summary_b['open_alerts_count']}"
    )


@pytest.mark.skipif(not MONGOMOCK_AVAILABLE, reason="mongomock-motor not installed")
async def test_herd_summary_species_counts():
    db = _make_db()
    farm_id = str(uuid.uuid4())

    await db.animals.insert_many([
        {"_id": str(uuid.uuid4()), "farm_id": farm_id, "species": "cow",
         "status": "active", "tag_id": "C1"},
        {"_id": str(uuid.uuid4()), "farm_id": farm_id, "species": "cow",
         "status": "active", "tag_id": "C2"},
        {"_id": str(uuid.uuid4()), "farm_id": farm_id, "species": "buffalo",
         "status": "active", "tag_id": "B1"},
    ])

    summary = await get_herd_summary(db, farm_id)
    assert summary["total_animals"] == 3
    assert summary["animals_by_species"]["cow"] == 2
    assert summary["animals_by_species"]["buffalo"] == 1


# ---------------------------------------------------------------------------
# 3.  Farm-level authorisation logic
# ---------------------------------------------------------------------------

from app.api.v1.deps import require_farm_access, require_animal_farm_access
from fastapi import HTTPException
import pytest


@pytest.mark.skipif(not MONGOMOCK_AVAILABLE, reason="mongomock-motor not installed")
async def test_require_farm_access_grants_own_farm():
    """A non-admin user can access their own farm."""
    db = _make_db()
    farm_id = str(uuid.uuid4())
    await db.farms.insert_one({"_id": farm_id, "name": "Farm X", "code": "FX",
                                "created_at": datetime.utcnow()})

    user = {"_id": "user1", "role": "farmer", "farm_id": farm_id}
    # Should not raise
    farm = await require_farm_access(farm_id, user, db)
    assert farm["id"] == farm_id


@pytest.mark.skipif(not MONGOMOCK_AVAILABLE, reason="mongomock-motor not installed")
async def test_require_farm_access_blocks_other_farm():
    """A non-admin user cannot access a different farm."""
    db = _make_db()
    farm_id_a = str(uuid.uuid4())
    farm_id_b = str(uuid.uuid4())

    await db.farms.insert_one({"_id": farm_id_b, "name": "Farm B", "code": "FB",
                                "created_at": datetime.utcnow()})

    user = {"_id": "user1", "role": "farmer", "farm_id": farm_id_a}

    with pytest.raises(HTTPException) as exc_info:
        await require_farm_access(farm_id_b, user, db)

    assert exc_info.value.status_code == 403


@pytest.mark.skipif(not MONGOMOCK_AVAILABLE, reason="mongomock-motor not installed")
async def test_require_farm_access_admin_sees_all():
    """Admin users can access any farm."""
    db = _make_db()
    farm_id = str(uuid.uuid4())
    await db.farms.insert_one({"_id": farm_id, "name": "Farm Z", "code": "FZ",
                                "created_at": datetime.utcnow()})

    admin_user = {"_id": "admin1", "role": "admin", "farm_id": None}
    # Should not raise
    farm = await require_farm_access(farm_id, admin_user, db)
    assert farm["id"] == farm_id


@pytest.mark.skipif(not MONGOMOCK_AVAILABLE, reason="mongomock-motor not installed")
async def test_require_farm_access_404_nonexistent_farm():
    """Accessing a farm that does not exist returns 404."""
    db = _make_db()
    user = {"_id": "user1", "role": "admin", "farm_id": None}

    with pytest.raises(HTTPException) as exc_info:
        await require_farm_access(str(uuid.uuid4()), user, db)

    assert exc_info.value.status_code == 404


@pytest.mark.skipif(not MONGOMOCK_AVAILABLE, reason="mongomock-motor not installed")
async def test_require_animal_farm_access_blocks_cross_farm():
    """
    Critical cross-farm test: user assigned to farm A cannot access
    an animal that belongs to farm B.
    """
    db = _make_db()
    farm_a = str(uuid.uuid4())
    farm_b = str(uuid.uuid4())
    animal_b_id = str(uuid.uuid4())

    await db.farms.insert_many([
        {"_id": farm_a, "name": "Farm A", "code": "FA", "created_at": datetime.utcnow()},
        {"_id": farm_b, "name": "Farm B", "code": "FB", "created_at": datetime.utcnow()},
    ])
    await db.animals.insert_one({
        "_id": animal_b_id,
        "farm_id": farm_b,
        "species": "cow",
        "status": "active",
        "tag_id": "B99",
    })

    user_a = {"_id": "userA", "role": "farmer", "farm_id": farm_a}

    with pytest.raises(HTTPException) as exc_info:
        await require_animal_farm_access(animal_b_id, user_a, db)

    assert exc_info.value.status_code == 403, (
        "Expected 403 when user from farm A tries to access animal in farm B"
    )


@pytest.mark.skipif(not MONGOMOCK_AVAILABLE, reason="mongomock-motor not installed")
async def test_require_animal_farm_access_allows_own_farm():
    """User can access an animal in their own farm."""
    db = _make_db()
    farm_id = str(uuid.uuid4())
    animal_id = str(uuid.uuid4())

    await db.farms.insert_one({"_id": farm_id, "name": "My Farm", "code": "MF",
                                "created_at": datetime.utcnow()})
    await db.animals.insert_one({
        "_id": animal_id,
        "farm_id": farm_id,
        "species": "buffalo",
        "status": "active",
        "tag_id": "MY01",
    })

    user = {"_id": "u1", "role": "farmer", "farm_id": farm_id}
    animal = await require_animal_farm_access(animal_id, user, db)
    assert animal["id"] == animal_id


@pytest.mark.skipif(not MONGOMOCK_AVAILABLE, reason="mongomock-motor not installed")
async def test_require_animal_farm_access_404_missing_animal():
    db = _make_db()
    user = {"_id": "u1", "role": "admin", "farm_id": None}

    with pytest.raises(HTTPException) as exc_info:
        await require_animal_farm_access(str(uuid.uuid4()), user, db)

    assert exc_info.value.status_code == 404
