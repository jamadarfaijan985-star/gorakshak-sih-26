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
    MEDIA_DIR: str = "/media"

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

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
