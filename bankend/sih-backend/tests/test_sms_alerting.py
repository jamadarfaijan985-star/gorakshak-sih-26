"""Tests for optional Twilio heat-stress SMS delivery."""

from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.services import sms_alerting


@pytest.mark.asyncio
async def test_send_sms_skips_when_not_configured():
    with patch.object(sms_alerting.settings, "SMS_ENABLED", False):
        assert await sms_alerting.send_sms("+15551234567", "test") is False


@pytest.mark.asyncio
async def test_send_sms_posts_to_twilio():
    response = httpx.Response(201, request=httpx.Request("POST", "https://example.com"))
    fake_client = AsyncMock()
    fake_client.__aenter__.return_value.post.return_value = response

    with patch.object(sms_alerting.settings, "SMS_ENABLED", True), \
         patch.object(sms_alerting.settings, "TWILIO_ACCOUNT_SID", "AC123"), \
         patch.object(sms_alerting.settings, "TWILIO_AUTH_TOKEN", "token"), \
         patch.object(sms_alerting.settings, "TWILIO_FROM_NUMBER", "+15550000000"), \
         patch.object(sms_alerting.httpx, "AsyncClient", return_value=fake_client):
        result = await sms_alerting.send_sms("+15551234567", "heat alert")

    assert result is True
    fake_client.__aenter__.return_value.post.assert_awaited_once_with(
        "https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json",
        data={"To": "+15551234567", "From": "+15550000000", "Body": "heat alert"},
        auth=("AC123", "token"),
    )