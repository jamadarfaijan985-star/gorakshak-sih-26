"""SMS notification service for heat-stress alerts."""

import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def heat_stress_message(
    animal_tag: str,
    thi: float,
    ambient_temp_c: float,
    relative_humidity: float,
) -> str:
    """Build the short message sent when livestock THI is elevated."""
    return (
        f"Gorakshak alert: animal {animal_tag} has high heat stress. "
        f"THI {thi:.1f}, temperature {ambient_temp_c:.1f}C, "
        f"humidity {relative_humidity:.0f}%. Check the animal."
    )


async def send_sms(phone_number: Optional[str], message: str) -> bool:
    """Send an SMS through Twilio; return False when disabled or unsuccessful."""
    if not phone_number:
        logger.info("Skipping heat-stress SMS because the user has no phone number")
        return False

    credentials = (
        settings.SMS_ENABLED,
        settings.TWILIO_ACCOUNT_SID,
        settings.TWILIO_AUTH_TOKEN,
        settings.TWILIO_FROM_NUMBER,
    )
    if not all(credentials):
        logger.info("Skipping SMS because SMS is disabled or Twilio is not configured")
        return False

    url = (
        f"https://api.twilio.com/2010-04-01/Accounts/"
        f"{settings.TWILIO_ACCOUNT_SID}/Messages.json"
    )
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                url,
                data={
                    "To": phone_number,
                    "From": settings.TWILIO_FROM_NUMBER,
                    "Body": message,
                },
                auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
            )
            response.raise_for_status()
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("Heat-stress SMS delivery failed: %s", exc)
        return False