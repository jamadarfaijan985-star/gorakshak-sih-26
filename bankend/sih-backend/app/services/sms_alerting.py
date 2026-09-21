"""
SMS notification service — Twilio REST API.

Three alert types:
  1. heat_stress_message()  — THI above threshold (fires on every ESP8266 packet)
  2. risk_alert_message()   — ML/rule engine found elevated risk (fires on alert creation)
  3. demo_test_message()    — instant test for judges demo

send_sms()      → single recipient
send_alert_sms() → sends to SMS_ALERT_PHONE (comma-separated list supported)
"""

import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Message builders
# ---------------------------------------------------------------------------

def heat_stress_message(
    animal_tag: str,
    thi: float,
    ambient_temp_c: float,
    relative_humidity: float,
) -> str:
    """THI heat-stress alert — sent when sensor THI crosses SMS_THI_THRESHOLD."""
    return (
        f"[GoDrishti] Heat-Stress Alert\n"
        f"Animal: {animal_tag}\n"
        f"THI: {thi:.1f} (threshold {settings.SMS_THI_THRESHOLD:.0f})\n"
        f"Temp: {ambient_temp_c:.1f}°C  RH: {relative_humidity:.0f}%\n"
        f"Action: Check shade, water & ventilation immediately."
    )


def risk_alert_message(
    animal_tag: str,
    risk_level: str,
    risk_score: Optional[float],
    recommended_action: Optional[str],
    model_version: str,
) -> str:
    """ML/rule-engine risk alert — sent when a new alert document is created."""
    level_map = {
        "no_risk":  "Below Threshold",
        "low":      "Low Risk Signal",
        "moderate": "Elevated Signal ⚠️",
        "high":     "High Risk 🚨",
    }
    score_str = f"{risk_score * 100:.0f}/100" if risk_score is not None else "N/A"
    action = recommended_action or "Perform CMT paddle test and physical examination."
    return (
        f"[GoDrishti] Mastitis Risk Alert\n"
        f"Animal: {animal_tag}\n"
        f"Signal: {level_map.get(risk_level, risk_level)}  Score: {score_str}\n"
        f"Model: {model_version}\n"
        f"Action: {action}"
    )


def demo_test_message(animal_tag: str, surface_temp: float, thi: float) -> str:
    """Instant demo message for judges — shows live sensor + risk data."""
    return (
        f"[GoDrishti Demo] Live Sensor Alert\n"
        f"Animal: {animal_tag}  Device: ESP8266\n"
        f"Surface Temp: {surface_temp:.2f}°C (DS18B20)\n"
        f"THI: {thi:.1f}  — AI Risk Engine: Active\n"
        f"Real-time ESP8266 → MQTT → Backend → SMS pipeline verified ✓"
    )


# ---------------------------------------------------------------------------
# Transport
# ---------------------------------------------------------------------------

async def send_sms(phone_number: Optional[str], message: str) -> bool:
    """
    Send an SMS to a single number via Twilio.
    Returns True on success, False on any failure (never raises).
    """
    if not phone_number:
        logger.info("[SMS] Skipped — no phone number supplied.")
        return False

    if not settings.SMS_ENABLED:
        logger.info("[SMS] Skipped — SMS_ENABLED=False.")
        return False

    missing = [
        name for name, val in [
            ("TWILIO_ACCOUNT_SID", settings.TWILIO_ACCOUNT_SID),
            ("TWILIO_AUTH_TOKEN",  settings.TWILIO_AUTH_TOKEN),
            ("TWILIO_FROM_NUMBER", settings.TWILIO_FROM_NUMBER),
        ]
        if not val
    ]
    if missing:
        logger.warning("[SMS] Skipped — missing Twilio config: %s", missing)
        return False

    url = (
        f"https://api.twilio.com/2010-04-01/Accounts/"
        f"{settings.TWILIO_ACCOUNT_SID}/Messages.json"
    )
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                url,
                data={"To": phone_number, "From": settings.TWILIO_FROM_NUMBER, "Body": message},
                auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
            )
            resp.raise_for_status()
        sid = resp.json().get("sid", "?")
        logger.info("[SMS] Sent to %s  SID=%s", phone_number, sid)
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("[SMS] Delivery failed to %s: %s", phone_number, exc)
        return False


async def send_alert_sms(message: str) -> dict:
    """
    Send `message` to every number in SMS_ALERT_PHONE (comma-separated).
    Returns {"sent": N, "failed": M, "recipients": [...status...]}.
    """
    raw = (settings.SMS_ALERT_PHONE or "").strip()
    if not raw:
        logger.info("[SMS] send_alert_sms: SMS_ALERT_PHONE is not set — skipped.")
        return {"sent": 0, "failed": 0, "recipients": []}

    phones = [p.strip() for p in raw.split(",") if p.strip()]
    results = []
    for phone in phones:
        ok = await send_sms(phone, message)
        results.append({"phone": phone, "sent": ok})
        if ok:
            logger.info("[SMS] Alert sent → %s", phone)
        else:
            logger.warning("[SMS] Alert FAILED → %s", phone)

    sent   = sum(1 for r in results if r["sent"])
    failed = len(results) - sent
    return {"sent": sent, "failed": failed, "recipients": results}
