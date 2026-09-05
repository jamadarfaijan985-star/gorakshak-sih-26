"""
Alerting service module for MongoDB backend.

Per PRD §11: Alert generation on risk-level transitions.
Avoid re-alerting for the same standing risk — only alert on level increase or every N hours.
"""

from datetime import datetime, timedelta
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase


# Minimum time between re-alerts for same animal (only re-alert if escalation or timeout)
ALERT_TIMEOUT_HOURS = 6


async def should_generate_alert(
    db: AsyncIOMotorDatabase,
    animal_id: str,
    new_risk_level: str,
) -> bool:
    """
    Determine if an alert should be generated based on risk level transition.
    
    Alert if:
    1. Risk escalated to a higher level (no_risk -> low -> moderate -> high)
    2. Standing elevated risk with 6+ hour timeout (no recent alert)
    
    Do NOT re-alert for same standing risk.
    """
    # Get most recent alert for animal
    recent_alert = await db.alerts.find_one(
        {"animal_id": animal_id},
        sort=[("triggered_at", -1)],
    )

    if not recent_alert:
        # No previous alert - generate if risk is not "no_risk"
        return new_risk_level != "no_risk"

    # Check if risk escalated
    risk_levels = ["no_risk", "low", "moderate", "high"]
    new_level_index = risk_levels.index(new_risk_level) if new_risk_level in risk_levels else 0
    prev_level = recent_alert.get("risk_level")
    prev_level_index = risk_levels.index(prev_level) if prev_level in risk_levels else 0

    if new_level_index > prev_level_index:
        # Risk escalated
        return True

    # Check if timeout exceeded (6+ hours with open alert)
    if recent_alert.get("status") == "open":
        timeout_time = recent_alert.get("triggered_at", datetime.utcnow()) + timedelta(hours=ALERT_TIMEOUT_HOURS)
        if datetime.utcnow() >= timeout_time and new_risk_level != "no_risk":
            return True

    return False


async def resolve_alerts_for_animal(
    db: AsyncIOMotorDatabase,
    animal_id: str,
) -> None:
    """
    Auto-resolve all open alerts when risk drops to no_risk.
    """
    await db.alerts.update_many(
        {
            "animal_id": animal_id,
            "status": "open",
        },
        {
            "$set": {
                "status": "resolved",
                "resolved_at": datetime.utcnow(),
            }
        },
    )


async def get_open_alerts(
    db: AsyncIOMotorDatabase,
    farm_id: Optional[str] = None,
) -> list:
    """
    Get all open alerts, optionally filtered by farm.
    """
    filter_dict = {"status": "open"}

    if farm_id:
        # Join with animals to get farm_id
        pipeline = [
            {"$match": filter_dict},
            {"$lookup": {
                "from": "animals",
                "localField": "animal_id",
                "foreignField": "_id",
                "as": "animal",
            }},
            {"$match": {"animal.farm_id": farm_id}},
            {"$sort": {"triggered_at": -1}},
        ]
        alerts = await db.alerts.aggregate(pipeline).to_list(None)
    else:
        alerts = await db.alerts.find(filter_dict).sort("triggered_at", -1).to_list(None)

    return alerts
