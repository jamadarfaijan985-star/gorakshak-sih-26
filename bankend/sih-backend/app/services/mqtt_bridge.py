"""
MQTT Bridge — ESP8266 Hardware → GoDrishti Backend
====================================================
Subscribes to  godrishti/+/sensors  on the Mosquitto broker and translates
every incoming ESP8266 payload into an HTTP call to the existing
POST /api/v1/ingest/esp8266  endpoint so that all existing feature-engineering,
THI computation, baseline-update, and risk-engine code is reused without
modification.

Architecture
------------
    ESP8266
      ↓  Wi-Fi
    Mosquitto broker  :1884
      ↓  godrishti/{device_id}/sensors
    MQTTBridge  (this file — runs in a background asyncio task)
      ↓  device_id → animal tag_id  (device_mappings collection)
      ↓  field translation
    POST /api/v1/ingest/esp8266  (existing unauthenticated endpoint)
      ↓
    MongoDB  sensor_readings
      ↓
    POST /api/v1/risk/compute  (existing ML/rule risk engine)
      ↓
    MongoDB  risk_scores / alerts
      ↓
    Frontend  polls /api/v1/animals/{id}/sensor-history  &  /api/v1/animals/{id}/risk

Device Mapping
--------------
Stored in the  device_mappings  MongoDB collection.
Each document has the shape:
    {
      "_id":        "<device_id>",   e.g. "ESP8266-COW-001"
      "tag_id":     "<animal tag>",  e.g. "F01_COW_001"
      "notes":      "optional free text",
      "created_at": ISODate
    }

Use POST /api/v1/devices/register to create a mapping without touching firmware.

Field Mapping (ESP8266 → /ingest/esp8266)
------------------------------------------
    ESP8266 field                  →  ingest/esp8266 field
    ─────────────────────────────────────────────────────
    device_id                      →  (resolved to tag_id via device_mappings)
    activity / motion              →  activity        (activity_raw)
    surface_temperature            →  body_temperature (surface_temp_c)
    ambient_temperature            →  ambient_temperature (ambient_temp_c)
    humidity                       →  humidity         (relative_humidity)
    chewing_acoustic_signal        →  mic_average      (audio_features.mic_average)
    rumination_inferred_min        →  (stored as rumination_inferred_min directly
                                        via the batch /ingest/sensor endpoint)

Note: local_prototype_risk_score / local_prototype_risk_level are IGNORED.
      The authoritative GoDrishti risk score is always computed by the backend
      ML/rule engine via POST /api/v1/risk/compute.

Scientific Notes
----------------
- DS18B20 readings are surface/skin temperature — NOT core body temperature.
- MAX4466 rumination_inferred_min is an acoustic proxy, not a validated clinical
  measurement.  Neither value constitutes a confirmed mastitis diagnosis.
- THI is computed in the backend (feature_engineering.compute_thi), not on-device.
"""

from __future__ import annotations

import asyncio
import json
import logging
import threading
import time
from datetime import datetime, timezone
from typing import Optional

import httpx

try:
    import paho.mqtt.client as mqtt  # type: ignore[import]
    _PAHO_AVAILABLE = True
except ImportError:  # pragma: no cover
    _PAHO_AVAILABLE = False

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Internal constants
# ---------------------------------------------------------------------------

# The MQTT topic pattern we subscribe to.
# '+' matches exactly one level, so  godrishti/ESP8266-COW-001/sensors  matches.
_SUBSCRIBE_TOPIC = settings.MQTT_TOPIC            # "godrishti/+/sensors"

# The base URL for HTTP calls back into our own FastAPI process.
# Using 127.0.0.1 so TLS/hostname checks are never an issue on localhost.
_BACKEND_BASE = "http://127.0.0.1:8000"

# HTTP client is reused across messages for connection pooling.
# Created once in  MQTTBridge.start()  and closed in  stop().
_http_client: Optional[httpx.AsyncClient] = None

# ---------------------------------------------------------------------------
# Device-mapping helpers (MongoDB)
# ---------------------------------------------------------------------------

async def _resolve_device_id(device_id: str) -> Optional[str]:
    """
    Look up device_id in the  device_mappings  collection and return the
    corresponding animal tag_id, or None if no mapping exists.

    Logs UNKNOWN_DEVICE_ID clearly so operators can register the device.
    """
    try:
        from app.db.session import db as _db  # import here to avoid circular at module load
        if _db is None:
            logger.error("[MQTT] Database not yet initialised — cannot resolve device %s", device_id)
            return None

        doc = await _db["device_mappings"].find_one({"_id": device_id})
        if doc is None:
            logger.warning(
                "[MQTT] UNKNOWN_DEVICE_ID: '%s'  — "
                "Register it via POST /api/v1/devices/register before data will be forwarded.",
                device_id,
            )
            return None

        tag_id: str = doc.get("tag_id", "")
        if not tag_id:
            logger.error(
                "[MQTT] Device mapping for '%s' exists but has an empty tag_id — fix the mapping.",
                device_id,
            )
            return None

        logger.info("[MQTT] Device mapping found: %s → tag_id=%s", device_id, tag_id)
        return tag_id

    except Exception as exc:  # noqa: BLE001
        logger.error("[MQTT] DB lookup failed for device '%s': %s", device_id, exc)
        return None


# ---------------------------------------------------------------------------
# Payload translation
# ---------------------------------------------------------------------------

def _translate_payload(raw: dict, tag_id: str) -> dict:
    """
    Translate an ESP8266 MQTT payload to the flat dict expected by
    POST /api/v1/ingest/esp8266.

    ESP8266 → ingest/esp8266
    ─────────────────────────
    device_id (resolved)        → cow_id
    surface_temperature         → body_temperature
    ambient_temperature         → ambient_temperature
    humidity                    → humidity
    activity / motion           → activity
    chewing_acoustic_signal     → mic_average
        rumination_inferred_min     →  rumination_inferred_min
        device_id / device_uptime_ms → idempotency metadata
        local_prototype_risk_*      → device-local metadata only
      device_uptime_ms             (diagnostic only)
    """
    translated = {
        "cow_id": tag_id,
        "device_id": raw.get("device_id"),
        "device_uptime_ms": raw.get("device_uptime_ms"),
        "local_prototype_risk_score": raw.get("local_prototype_risk_score"),
        "local_prototype_risk_level": raw.get("local_prototype_risk_level"),
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
    }

    # Surface temperature — DS18B20 probe (skin/collar, not core body temperature)
    if raw.get("surface_temperature") is not None:
        translated["body_temperature"] = float(raw["surface_temperature"])

    # Ambient temperature — DHT11
    if raw.get("ambient_temperature") is not None:
        translated["ambient_temperature"] = float(raw["ambient_temperature"])

    # Relative humidity — DHT11
    if raw.get("humidity") is not None:
        translated["humidity"] = float(raw["humidity"])

    # Activity — MPU6500 magnitude (firmware may send as 'activity' or 'motion')
    activity_val = raw.get("activity") if raw.get("activity") is not None else raw.get("motion")
    if activity_val is not None:
        translated["activity"] = float(activity_val)

    # Chewing acoustic signal — MAX4466 ADC average → mic_average
    if raw.get("chewing_acoustic_signal") is not None:
        translated["mic_average"] = float(raw["chewing_acoustic_signal"])

    if raw.get("rumination_inferred_min") is not None:
        translated["rumination_inferred_min"] = float(raw["rumination_inferred_min"])

    return translated


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

async def _post_ingest_esp8266(payload: dict) -> Optional[dict]:
    """
    POST the translated payload to /api/v1/ingest/esp8266.
    Returns the JSON response body, or None on failure.
    """
    global _http_client
    if _http_client is None:
        logger.error("[MQTT] HTTP client not initialised — cannot forward sensor data.")
        return None
    try:
        resp = await _http_client.post(
            f"{_BACKEND_BASE}/api/v1/ingest/esp8266",
            json=payload,
            timeout=10.0,
        )
        if resp.status_code == 200:
            data = resp.json()
            logger.info(
                "[MQTT] Sensor reading stored successfully — reading_id=%s animal_id=%s tag_id=%s",
                data.get("reading_id"),
                data.get("animal_id"),
                data.get("tag_id"),
            )
            return data
        elif resp.status_code == 404:
            logger.error(
                "[MQTT] Backend ingest failed (404) — tag_id not registered in DB: %s",
                payload.get("cow_id"),
            )
        elif resp.status_code == 401:
            logger.error("[MQTT] Authentication failed (401) — unexpected for /ingest/esp8266 (no-auth endpoint).")
        else:
            logger.error(
                "[MQTT] Backend ingest failed (%s): %s",
                resp.status_code,
                resp.text[:200],
            )
    except httpx.ConnectError:
        logger.error("[MQTT] Backend ingest failed — cannot connect to %s (is FastAPI running?)", _BACKEND_BASE)
    except httpx.TimeoutException:
        logger.error("[MQTT] Backend ingest failed — request timed out.")
    except Exception as exc:  # noqa: BLE001
        logger.error("[MQTT] Backend ingest failed — unexpected error: %s", exc)
    return None


async def _trigger_risk_compute(animal_id: str) -> None:
    """
    Trigger risk computation for the animal whose sensor reading was just stored.
    Calls the risk engine directly in-process (no HTTP round-trip needed) so that
    no user auth is required. This triggers the full ML → rule-fallback → alert
    pipeline automatically after every hardware reading.

    Failures are logged but never propagate — the ingest already succeeded.
    """
    try:
        from app.db.session import db as _db  # noqa: PLC0415
        from app.api.v1.routes_risk import _compute_for_animal  # noqa: PLC0415
        if _db is None:
            logger.warning("[MQTT] Risk compute skipped — DB not ready.")
            return
        result = await _compute_for_animal(_db, animal_id)
        logger.info(
            "[MQTT] Risk engine triggered — status=%s risk_level=%s model=%s",
            result.get("status"),
            result.get("risk_level"),
            result.get("model_version"),
        )
        if result.get("alert_generated"):
            logger.warning(
                "[MQTT] ALERT generated for animal_id=%s  risk_level=%s",
                animal_id,
                result.get("risk_level"),
            )
    except Exception as exc:  # noqa: BLE001
        logger.warning("[MQTT] Risk compute call failed (non-fatal): %s", exc)


# ---------------------------------------------------------------------------
# Message handler — called from paho callback, dispatched to asyncio loop
# ---------------------------------------------------------------------------

async def _handle_message(topic: str, payload_bytes: bytes) -> None:
    """
    Full async pipeline for a single MQTT message:
        1. Parse JSON
        2. Extract device_id from topic
        3. Resolve device_id → tag_id via MongoDB
        4. Translate payload fields
        5. POST to /api/v1/ingest/esp8266
        6. Store rumination_inferred_min if present
        7. Trigger POST /api/v1/risk/compute
    """
    # ── 1. Parse JSON ──────────────────────────────────────────────────────
    try:
        raw: dict = json.loads(payload_bytes.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        logger.error("[MQTT] JSON parsing failed on topic '%s': %s  raw=%r", topic, exc, payload_bytes[:100])
        return

    # ── 2. Extract device_id ───────────────────────────────────────────────
    # Topic format:  godrishti/{device_id}/sensors
    parts = topic.split("/")
    if len(parts) < 3:
        logger.error("[MQTT] Unexpected topic format: '%s' — expected godrishti/{device_id}/sensors", topic)
        return

    # Prefer device_id from payload if present (more authoritative than topic)
    device_id: str = raw.get("device_id") or parts[1]
    raw["device_id"] = device_id
    logger.info("[MQTT] Received device: %s  topic: %s", device_id, topic)

    # ── 3. Resolve device_id → tag_id ──────────────────────────────────────
    tag_id = await _resolve_device_id(device_id)
    if tag_id is None:
        # Already logged with UNKNOWN_DEVICE_ID in _resolve_device_id
        return

    # ── 4. Translate payload fields ────────────────────────────────────────
    ingest_payload = _translate_payload(raw, tag_id)
    logger.info(
        "[MQTT] Sensor data translated for tag_id=%s: "
        "surface_temp=%s ambient_temp=%s humidity=%s activity=%s mic_avg=%s",
        tag_id,
        ingest_payload.get("body_temperature"),
        ingest_payload.get("ambient_temperature"),
        ingest_payload.get("humidity"),
        ingest_payload.get("activity"),
        ingest_payload.get("mic_average"),
    )
    logger.info("[MQTT] Sensor data forwarded to backend  →  POST /api/v1/ingest/esp8266")

    # ── 5. POST to /api/v1/ingest/esp8266 ─────────────────────────────────
    result = await _post_ingest_esp8266(ingest_payload)
    if result is None:
        return  # error already logged

    animal_id: str = result.get("animal_id", "")

    # ── 6. Trigger risk computation ────────────────────────────────────────
    if animal_id:
        await _trigger_risk_compute(animal_id)


# ---------------------------------------------------------------------------
# MQTTBridge class
# ---------------------------------------------------------------------------

class MQTTBridge:
    """
    Manages the paho-mqtt client lifecycle inside the FastAPI asyncio event loop.

    paho-mqtt uses its own network thread.  Callbacks received on that thread
    are dispatched to the FastAPI event loop via  asyncio.run_coroutine_threadsafe.
    This keeps MongoDB Motor calls fully async while paho handles TCP/socket I/O.
    """

    def __init__(self) -> None:
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._client: Optional["mqtt.Client"] = None
        self._should_run = False
        self._connected = False
        self._started = False

    @property
    def connected(self) -> bool:
        return self._connected

    # ------------------------------------------------------------------
    # paho callbacks — called from paho's network thread
    # paho-mqtt 2.x uses CallbackAPIVersion.VERSION2 which adds a
    # `reason_code` parameter to on_connect and on_disconnect.
    # ------------------------------------------------------------------

    def _on_connect(self, client, userdata, connect_flags, reason_code, properties):  # noqa: ANN001
        """paho 2.x on_connect — reason_code 0 means success."""
        if reason_code == 0 or str(reason_code) == "Success":
            self._connected = True
            logger.info(
                "[MQTT] MQTT connected  →  broker: %s:%s",
                settings.MQTT_BROKER_HOST,
                settings.MQTT_BROKER_PORT,
            )
            client.subscribe(_SUBSCRIBE_TOPIC, qos=1)
            logger.info("[MQTT] Subscribed: %s", _SUBSCRIBE_TOPIC)
        else:
            self._connected = False
            logger.error(
                "[MQTT] MQTT connection failed  reason=%s  (broker: %s:%s)",
                reason_code,
                settings.MQTT_BROKER_HOST,
                settings.MQTT_BROKER_PORT,
            )

    def _on_disconnect(self, client, userdata, disconnect_flags, reason_code, properties):  # noqa: ANN001
        """paho 2.x on_disconnect."""
        self._connected = False
        if reason_code == 0 or str(reason_code) == "Normal disconnection":
            logger.info("[MQTT] MQTT disconnected cleanly.")
        else:
            logger.warning(
                "[MQTT] MQTT connection lost  reason=%s — paho will auto-reconnect in %ss.",
                reason_code,
                settings.MQTT_RECONNECT_DELAY,
            )

    def _on_message(self, client, userdata, msg):  # noqa: ANN001
        """Received on paho's network thread — dispatch to asyncio."""
        if self._loop is None or self._loop.is_closed():
            return
        asyncio.run_coroutine_threadsafe(
            _handle_message(msg.topic, msg.payload),
            self._loop,
        )

    def _on_log(self, client, userdata, level, buf):  # noqa: ANN001
        # Only forward MQTT_LOG_ERR and MQTT_LOG_WARNING to reduce noise
        if level <= mqtt.MQTT_LOG_WARNING:
            logger.debug("[MQTT-paho] %s", buf)

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def start(self) -> None:
        """
        Initialise the paho client and start its network loop in a daemon thread.
        Called from FastAPI's lifespan on startup.
        """
        global _http_client

        if not _PAHO_AVAILABLE:
            logger.error(
                "[MQTT] paho-mqtt is not installed.  "
                "Run:  pip install paho-mqtt>=1.6.1  then restart the server."
            )
            return

        # FastAPI lifespan should call this once, but this guard prevents a
        # reload or repeated startup hook from creating a second client.
        if self._started and self._client is not None:
            logger.info("[MQTT] MQTT bridge already running; reusing the existing client.")
            return

        self._loop = asyncio.get_event_loop()
        self._should_run = True
        self._started = True

        # Shared HTTP client for all intra-process backend calls
        _http_client = httpx.AsyncClient()

        logger.info(
            "[MQTT] MQTT bridge starting  →  broker: %s:%s  topic: %s",
            settings.MQTT_BROKER_HOST,
            settings.MQTT_BROKER_PORT,
            _SUBSCRIBE_TOPIC,
        )

        self._client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
            client_id=settings.MQTT_CLIENT_ID,
            clean_session=True,
        )

        # Credentials (optional — skip if both are empty)
        if settings.MQTT_USERNAME and settings.MQTT_PASSWORD:
            self._client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)

        # Wire callbacks
        self._client.on_connect    = self._on_connect
        self._client.on_disconnect = self._on_disconnect
        self._client.on_message    = self._on_message
        self._client.on_log        = self._on_log

        # Automatic reconnect: paho retries every MQTT_RECONNECT_DELAY seconds
        self._client.reconnect_delay_set(
            min_delay=settings.MQTT_RECONNECT_DELAY,
            max_delay=settings.MQTT_RECONNECT_DELAY * 6,
        )

        # Connect (non-blocking — actual TCP connect happens in the network thread)
        try:
            self._client.connect_async(
                host=settings.MQTT_BROKER_HOST,
                port=settings.MQTT_BROKER_PORT,
                keepalive=120,
            )
        except Exception as exc:  # noqa: BLE001
            logger.error(
                "[MQTT] MQTT connection failed — could not reach broker %s:%s: %s",
                settings.MQTT_BROKER_HOST,
                settings.MQTT_BROKER_PORT,
                exc,
            )
            # Keep the network loop alive: paho will retry the initial
            # connection using the configured reconnect delay.

        # Start the paho network loop in a daemon thread so it doesn't block uvicorn
        self._client.loop_start()
        logger.info("[MQTT] MQTT bridge background thread started.")

    async def stop(self) -> None:
        """
        Cleanly shut down the MQTT client.  Called from FastAPI's lifespan on shutdown.
        """
        global _http_client

        self._should_run = False
        self._started = False

        if self._client is not None:
            try:
                self._client.disconnect()
                self._client.loop_stop()
            except Exception as exc:  # noqa: BLE001
                logger.warning("[MQTT] Error during MQTT shutdown: %s", exc)
            logger.info("[MQTT] MQTT bridge stopped.")
            self._client = None

        self._connected = False
        self._loop = None

        if _http_client is not None:
            await _http_client.aclose()
            _http_client = None


# ---------------------------------------------------------------------------
# Module-level singleton — imported by main.py
# ---------------------------------------------------------------------------

mqtt_bridge = MQTTBridge()
