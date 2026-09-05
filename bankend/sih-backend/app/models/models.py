"""
MongoDB models for the Bovine Mastitis Backend.
Based on PRD section 7.
Uses Pydantic for schema validation and MongoDB for storage.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
import enum
import uuid

from pydantic import BaseModel, Field, EmailStr


# ============================================================================
# Enumerations
# ============================================================================

class SpeciesEnum(str, enum.Enum):
    """Species enumeration."""
    cow = "cow"
    buffalo = "buffalo"


class AnimalStatusEnum(str, enum.Enum):
    """Animal status enumeration."""
    active = "active"
    culled = "culled"
    sold = "sold"
    dead = "dead"


class RiskLevelEnum(str, enum.Enum):
    """Risk level enumeration."""
    no_risk = "no_risk"
    low = "low"
    moderate = "moderate"
    high = "high"


class AlertSeverityEnum(str, enum.Enum):
    """Alert severity enumeration."""
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class AlertStatusEnum(str, enum.Enum):
    """Alert status enumeration."""
    open = "open"
    acknowledged = "acknowledged"
    resolved = "resolved"
    false_positive = "false_positive"


class ManualLabDataSourceEnum(str, enum.Enum):
    """Manual lab data source enumeration."""
    field_kit = "field_kit"
    lab_submission = "lab_submission"
    farmer_observation = "farmer_observation"
    veterinary_clinic = "veterinary_clinic"


class UserRoleEnum(str, enum.Enum):
    """User role enumeration."""
    farmer = "farmer"
    vet = "vet"
    admin = "admin"


# ============================================================================
# Base Models with MongoDB ObjectId support
# ============================================================================

class MongoDBModel(BaseModel):
    """Base model for MongoDB documents."""
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True


# ============================================================================
# Farm Model
# ============================================================================

class Farm(MongoDBModel):
    """Farm collection document."""
    name: str
    code: str  # unique identifier, e.g., "F01"
    location_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# User Model
# ============================================================================

class User(MongoDBModel):
    """User collection document."""
    farm_id: Optional[str] = None  # Reference to Farm._id
    name: str
    email: str  # unique
    phone: Optional[str] = None
    password_hash: str
    role: UserRoleEnum = UserRoleEnum.farmer
    preferred_language: str = "en"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Animal Model
# ============================================================================

class Animal(MongoDBModel):
    """Animal collection document."""
    farm_id: str  # Reference to Farm._id
    tag_id: str  # unique identifier, e.g., "F01_COW_003"
    species: SpeciesEnum
    breed: Optional[str] = None
    age_months: Optional[int] = None
    lactation_number: Optional[int] = None
    pregnancy_status: Optional[str] = None  # "not_pregnant", "pregnant", "lactating", etc.
    previous_mastitis: Optional[bool] = None
    disease_history: Optional[List[Dict[str, Any]]] = None  # Array of past diseases
    vaccination_history: Optional[List[Dict[str, Any]]] = None  # Array of vaccinations
    treatment_history: Optional[List[Dict[str, Any]]] = None  # Array of treatments
    comorbidities: Optional[List[str]] = None  # Array of comorbidity strings
    status: AnimalStatusEnum = AnimalStatusEnum.active
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# SensorReading Model
# ============================================================================

class SensorReading(MongoDBModel):
    """SensorReading collection document."""
    animal_id: str  # Reference to Animal._id
    recorded_at: datetime  # Device timestamp
    received_at: datetime = Field(default_factory=datetime.utcnow)  # Server timestamp
    activity_raw: Optional[float] = None
    surface_temp_c: Optional[float] = None
    ambient_temp_c: Optional[float] = None
    relative_humidity: Optional[float] = None
    audio_features: Optional[Dict[str, Any]] = None  # JSON object
    rumination_inferred_min: Optional[float] = None
    thi: Optional[float] = None  # Temperature-Humidity Index (computed)
    source: str = "sensor"  # "sensor", "simulated_demo", etc.


# ============================================================================
# ManualLabData Model
# ============================================================================

class ManualLabData(MongoDBModel):
    """ManualLabData collection document."""
    animal_id: str  # Reference to Animal._id
    recorded_at: datetime
    milk_yield_l: Optional[float] = None
    milk_temp_c: Optional[float] = None
    udder_temp_c: Optional[float] = None
    cmt_result: Optional[str] = None  # California Mastitis Test result: "0", "1+", "2+", "3+"
    scc_value: Optional[float] = None  # Somatic Cell Count
    scc_unit: Optional[str] = None  # "cells/ml", "10^3/ml", etc.
    milk_ph: Optional[float] = None
    milk_ec: Optional[float] = None  # Electrical conductivity
    data_source: ManualLabDataSourceEnum = ManualLabDataSourceEnum.field_kit
    entered_by_user_id: Optional[str] = None  # Reference to User._id
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# UdderImage Model
# ============================================================================

class UdderImage(MongoDBModel):
    """UdderImage collection document."""
    animal_id: str  # Reference to Animal._id
    captured_at: datetime
    image_url: Optional[str] = None  # Path or URL to stored image
    cv_result: Optional[Dict[str, Any]] = None  # CV model output (null initially)
    cv_model_version: Optional[str] = None
    reviewed_by_vet: Optional[bool] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# RiskScore Model
# ============================================================================

class RiskScore(MongoDBModel):
    """RiskScore collection document."""
    animal_id: str  # Reference to Animal._id
    computed_at: datetime = Field(default_factory=datetime.utcnow)
    window_start: datetime
    window_end: datetime
    risk_level: RiskLevelEnum
    risk_score_numeric: float
    contributing_factors: List[Dict[str, Any]] = []  # Array of {factor, weight}
    recommended_action: Optional[str] = None
    model_version: str
    forecast_horizon_days: Optional[int] = None
    is_forecast: bool = False  # Critical: False for screening, True for predictions


# ============================================================================
# Alert Model
# ============================================================================

class Alert(MongoDBModel):
    """Alert collection document."""
    animal_id: str  # Reference to Animal._id
    risk_score_id: Optional[str] = None  # Reference to RiskScore._id
    triggered_at: datetime = Field(default_factory=datetime.utcnow)
    severity: AlertSeverityEnum
    message: str
    status: AlertStatusEnum = AlertStatusEnum.open
    acknowledged_by: Optional[str] = None  # Reference to User._id
    resolved_at: Optional[datetime] = None


# ============================================================================
# Baseline Model
# ============================================================================

class Baseline(MongoDBModel):
    """Baseline collection document for per-animal rolling baselines."""
    animal_id: str  # Reference to Animal._id
    metric: str  # "activity_raw", "rumination_inferred_min", "surface_temp_c"
    baseline_mean: float
    baseline_stddev: float
    window_days: int = 7
    updated_at: datetime = Field(default_factory=datetime.utcnow)
