"""
Pydantic schemas for request/response bodies.
"""

from datetime import datetime
from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field, EmailStr
import uuid

ResponseItem = TypeVar("ResponseItem")


# ===== Farm Schemas =====
class FarmBase(BaseModel):
    """Base farm schema."""
    name: str
    code: str
    location_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class FarmCreate(FarmBase):
    """Create farm schema."""
    pass


class FarmUpdate(BaseModel):
    """Update farm schema."""
    name: Optional[str] = None
    location_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class FarmResponse(FarmBase):
    """Farm response schema."""
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ===== User Schemas =====
class UserBase(BaseModel):
    """Base user schema."""
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str  # 'farmer', 'vet', 'admin'
    preferred_language: Optional[str] = "en"


class UserCreate(UserBase):
    """Create user schema."""
    password: str
    farm_id: Optional[uuid.UUID] = None


class UserUpdate(BaseModel):
    """Update user schema."""
    name: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = None


class UserResponse(UserBase):
    """User response schema."""
    id: uuid.UUID
    farm_id: Optional[uuid.UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Animal Schemas =====
class AnimalBase(BaseModel):
    """Base animal schema."""
    tag_id: str
    species: str  # 'cow', 'buffalo'
    breed: Optional[str] = None
    age_months: Optional[int] = None
    lactation_number: Optional[int] = None
    pregnancy_status: Optional[str] = None
    previous_mastitis: Optional[bool] = None
    disease_history: Optional[List[Dict[str, Any]]] = None
    vaccination_history: Optional[List[Dict[str, Any]]] = None
    treatment_history: Optional[List[Dict[str, Any]]] = None
    comorbidities: Optional[List[str]] = None
    status: Optional[str] = "active"


class AnimalCreate(AnimalBase):
    """Create animal schema."""
    farm_id: uuid.UUID


class AnimalUpdate(BaseModel):
    """Update animal schema."""
    breed: Optional[str] = None
    age_months: Optional[int] = None
    lactation_number: Optional[int] = None
    pregnancy_status: Optional[str] = None
    previous_mastitis: Optional[bool] = None
    disease_history: Optional[List[Dict[str, Any]]] = None
    vaccination_history: Optional[List[Dict[str, Any]]] = None
    treatment_history: Optional[List[Dict[str, Any]]] = None
    comorbidities: Optional[List[str]] = None
    status: Optional[str] = None


class AnimalResponse(AnimalBase):
    """Animal response schema."""
    id: uuid.UUID
    farm_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Sensor Reading Schemas =====
class SensorReadingBase(BaseModel):
    """Base sensor reading schema."""
    recorded_at: datetime
    activity_raw: Optional[float] = None
    surface_temp_c: Optional[float] = None
    ambient_temp_c: Optional[float] = None
    relative_humidity: Optional[float] = None
    audio_features: Optional[dict] = None
    rumination_inferred_min: Optional[float] = None
    source: str = "collar_v1"


class SensorReadingCreate(SensorReadingBase):
    """Create sensor reading schema."""
    pass


class SensorReadingResponse(SensorReadingBase):
    """Sensor reading response schema."""
    id: uuid.UUID
    animal_id: uuid.UUID
    thi: Optional[float] = None
    received_at: datetime

    class Config:
        from_attributes = True


class BatchSensorReadingIngest(BaseModel):
    """Batch sensor reading ingestion schema."""
    device_id: Optional[str] = None
    animal_id: Optional[uuid.UUID] = None
    tag_id: Optional[str] = None  # Can use tag_id instead of animal_id
    source: str = "collar_v1"
    readings: List[SensorReadingCreate]


# ===== Manual Lab Data Schemas =====
class ManualLabDataBase(BaseModel):
    """Base manual lab data schema."""
    recorded_at: datetime
    milk_yield_l: Optional[float] = None
    milk_temp_c: Optional[float] = None
    udder_temp_c: Optional[float] = None
    cmt_result: Optional[str] = None
    scc_value: Optional[float] = None
    scc_unit: Optional[str] = None
    milk_ph: Optional[float] = None
    milk_ec: Optional[float] = None
    data_source: str  # 'manual', 'lab', 'cooperative', 'vet', 'farm_equipment'


class ManualLabDataCreate(ManualLabDataBase):
    """Create manual lab data schema."""
    animal_id: uuid.UUID


class ManualLabDataResponse(ManualLabDataBase):
    """Manual lab data response schema."""
    id: uuid.UUID
    animal_id: uuid.UUID
    entered_by_user_id: Optional[uuid.UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Udder Image Schemas =====
class CVResultSchema(BaseModel):
    """CV analysis result schema."""
    swelling: Optional[float] = None
    asymmetry: Optional[float] = None
    redness: Optional[float] = None
    lesions: Optional[float] = None
    discharge: Optional[float] = None
    confidence: Optional[float] = None


class UdderImageBase(BaseModel):
    """Base udder image schema."""
    captured_at: datetime
    image_url: str
    cv_result: Optional[CVResultSchema] = None
    cv_model_version: Optional[str] = None
    reviewed_by_vet: Optional[bool] = None


class UdderImageCreate(BaseModel):
    """Create udder image schema - for upload."""
    animal_id: uuid.UUID
    captured_at: datetime
    # image file handled separately in route


class UdderImageResponse(UdderImageBase):
    """Udder image response schema."""
    id: uuid.UUID
    animal_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Risk Engine Interface Schemas =====
class AnimalMetaSchema(BaseModel):
    """Animal metadata for risk engine."""
    id: uuid.UUID
    species: str
    breed: Optional[str] = None
    age_months: Optional[int] = None
    lactation_number: Optional[int] = None
    previous_mastitis: Optional[bool] = None


class RiskEngineInputSchema(BaseModel):
    """Risk engine input schema (§9)."""
    animal_id: uuid.UUID
    window_start: datetime
    window_end: datetime
    features: dict = Field(default_factory=dict)


class ContributingFactorSchema(BaseModel):
    """Contributing factor schema."""
    factor: str
    weight: float


class RiskEngineOutputSchema(BaseModel):
    """Risk engine output schema (§9)."""
    risk_level: str  # 'no_risk', 'low', 'moderate', 'high'
    risk_score_numeric: Optional[float] = None
    contributing_factors: List[ContributingFactorSchema]
    recommended_action: str
    model_version: str
    is_forecast: bool = False
    forecast_horizon_days: Optional[int] = None


# ===== Risk Score Schemas =====
class RiskScoreResponse(BaseModel):
    """Risk score response schema."""
    id: uuid.UUID
    animal_id: uuid.UUID
    computed_at: datetime
    window_start: datetime
    window_end: datetime
    risk_level: str
    risk_score_numeric: Optional[float] = None
    contributing_factors: List[dict]
    recommended_action: Optional[str] = None
    model_version: str
    is_forecast: bool = False
    forecast_horizon_days: Optional[int] = None

    class Config:
        from_attributes = True


class RiskComputeRequest(BaseModel):
    """Trigger risk computation request."""
    animal_id: Optional[uuid.UUID] = None  # None = all animals


# ===== Alert Schemas =====
class AlertResponse(BaseModel):
    """Alert response schema."""
    id: uuid.UUID
    animal_id: uuid.UUID
    risk_score_id: Optional[uuid.UUID] = None
    triggered_at: datetime
    severity: str
    message: str
    status: str
    acknowledged_by: Optional[uuid.UUID] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AlertUpdateSchema(BaseModel):
    """Alert update schema."""
    status: Optional[str] = None
    acknowledged_by: Optional[uuid.UUID] = None


# ===== Herd Summary Schemas =====
class HerdSummaryResponse(BaseModel):
    """Herd summary response."""
    farm_id: uuid.UUID
    total_animals: int
    animals_by_species: dict  # {'cow': X, 'buffalo': Y}
    risk_distribution: dict  # {'no_risk': X, 'low': Y, 'moderate': Z, 'high': W}
    open_alerts_count: int
    last_updated: datetime


# ===== Auth Schemas =====
class LoginRequest(BaseModel):
    """Login request schema."""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Login response schema."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ===== Pagination Schemas =====
class PaginationMeta(BaseModel):
    """Pagination metadata."""
    total: int
    limit: int
    offset: int = 0
    skip: int = 0


class ListResponse(BaseModel, Generic[ResponseItem]):
    """Generic list response envelope."""
    data: List[ResponseItem]
    meta: PaginationMeta


# ===== Error Response =====
class ErrorResponse(BaseModel):
    """Error response schema."""
    detail: str
    error_code: Optional[str] = None
