"""
Application configuration via environment variables.
"""

import os
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings

# Resolve the repository root: bankend/sih-backend/app/core/ → repo root (4 levels up)
_HERE = Path(__file__).resolve()
_REPO_ROOT = _HERE.parents[4]  # gorakshak-sih-26/
_BACKEND_ROOT = _HERE.parents[2]  # gorakshak-sih-26/bankend/sih-backend/


class Settings(BaseSettings):
    """Application settings."""

    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Bovine Mastitis Backend"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "mongodb://admin:password@localhost:27017/bovine_mastitis?authSource=admin"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production-min-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    # File storage
    MEDIA_DIR: str = str(_BACKEND_ROOT / "media")

    # ML Model directory — absolute path to the /models folder in the repo root.
    # Override via env var MODEL_DIR if the models live elsewhere (e.g. Docker volume).
    MODEL_DIR: str = str(_REPO_ROOT / "models")

    # Udder CV model file names (relative to MODEL_DIR)
    COW_UDDER_MODEL_FILE: str = "Cow_Udder_AI_Model/best.pt"
    BUFFALO_UDDER_MODEL_FILE: str = "Buffalo_udder_AI_Model/buffalo_udder_segmentation.pt"

    # Forecasting model file names (relative to MODEL_DIR)
    FORECAST_7D_MODEL_FILE: str = "gorakshak_forecast_7d_xgb_v2.joblib"
    FORECAST_14D_MODEL_FILE: str = "gorakshak_forecast_14d_xgb_v2.joblib"

    # Classification model file names (relative to MODEL_DIR)
    COW_MILK_MODEL_FILE: str = "gorakshak_cow_milk_v2.joblib"
    COW_CLINICAL_MODEL_FILE: str = "gorakshak_cow_clinical_v2.joblib"
    BUFFALO_V2_MODEL_FILE: str = "gorakshak_buffalo_v2.joblib"

    # Whether to enable YOLO udder CV inference (requires ultralytics + GPU/CPU).
    # Set UDDER_CV_ENABLED=false in .env if you want to skip CV on low-resource hosts.
    UDDER_CV_ENABLED: bool = True

    # SMS heat-stress alerts. Twilio credentials are required when enabled.
    SMS_ENABLED: bool = False
    SMS_THI_THRESHOLD: float = 68.0
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""
    # Phone number that receives risk + heat-stress alerts (E.164 format, e.g. +919876543210)
    # Can be a comma-separated list for multiple recipients: "+91...,+91..."
    SMS_ALERT_PHONE: str = ""

    # ------------------------------------------------------------------ #
    # MQTT Bridge — ESP8266 / hardware collar integration                  #
    # ------------------------------------------------------------------ #
    # Set MQTT_ENABLED=true to launch the Mosquitto bridge at startup.
    # The bridge subscribes to  godrishti/+/sensors  and translates every
    # incoming ESP8266 payload into a POST /api/v1/ingest/esp8266 call so
    # that all existing feature-engineering and risk-engine code is reused.
    MQTT_ENABLED: bool = False
    MQTT_BROKER_HOST: str = "localhost"
    MQTT_BROKER_PORT: int = 1884
    # Optional broker credentials (leave empty for anonymous brokers)
    MQTT_USERNAME: str = ""
    MQTT_PASSWORD: str = ""
    # MQTT client identifier — must be unique per running instance
    MQTT_CLIENT_ID: str = "godrishti-backend-bridge"
    # Topic pattern the bridge subscribes to.
    # '+' is a single-level wildcard; device_id is extracted from the topic.
    MQTT_TOPIC: str = "godrishti/+/sensors"
    # How long (seconds) to wait before retrying a failed broker connection
    MQTT_RECONNECT_DELAY: int = 5

    # Development hardware fixture. Disabled in production deployments.
    DEV_FALLBACK_FARM_ENABLED: bool = True
    DEV_FALLBACK_FARM_NAME: str = "Anand Demo Dairy Cluster"
    DEV_FALLBACK_FARM_CODE: str = "ANAND-DEV"

    class Config:
        case_sensitive = True
        env_file = str(_BACKEND_ROOT / ".env")


settings = Settings()
