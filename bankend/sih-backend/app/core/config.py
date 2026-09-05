"""
Application configuration via environment variables.
"""

from typing import List

from pydantic_settings import BaseSettings


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

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
