# Bovine Mastitis Prediction Backend

**SIH26109: AI-Based Predictive Modelling for Early Forecasting of Bovine Mastitis in Indian Dairy Farms**

A FastAPI-based backend system for early detection and risk forecasting of bovine mastitis using sensor data, manual lab data, and AI/ML models.

## Overview

This backend system implements the core loop: **SENSE → SCREEN → PRIORITIZE → CONFIRM → ACT**

- **SENSE**: Ingests sensor data from wearable collars (MPU6050, DS18B20, MAX9814, SHT31-D)
- **SCREEN**: Computes derived features (THI, baselines, deviations) and risk scoring
- **PRIORITIZE**: Generates alerts and herd-level aggregation
- **CONFIRM**: Accepts manual lab data (CMT, SCC, pH, EC, milk yield, udder images)
- **ACT**: Provides decision-support recommendations for farmers/vets

## Features

- ✅ Real-time sensor data ingestion (batched, resilient to intermittent connectivity)
- ✅ Feature engineering (THI, rolling baselines, z-score deviations)
- ✅ Rule-based risk engine (swappable for ML model later)
- ✅ Alert generation on risk escalation
- ✅ Manual lab data entry (CMT, SCC, pH, EC, milk yield, milk temp)
- ✅ Udder image upload (CV analysis stub)
- ✅ JWT authentication
- ✅ Multi-animal, multi-farm support
- ✅ Herd-level aggregation and summary
- ✅ RESTful API with auto-generated Swagger/ReDoc docs

## Technology Stack

- **Framework**: Python 3.10+ with FastAPI
- **ORM**: SQLAlchemy 2.x
- **Database**: PostgreSQL with AsyncPG
- **Auth**: JWT (python-jose, passlib/bcrypt)
- **Validation**: Pydantic v2
- **Async**: asyncio, async SQLAlchemy
- **File Storage**: Local disk (swappable to S3)
- **Background Jobs**: APScheduler (in-process)

## Project Structure

```
app/
  core/
    config.py              # Settings via pydantic-settings
    security.py            # JWT and password utilities
  db/
    base.py               # SQLAlchemy declarative base
    session.py            # Async engine and session management
  models/
    models.py             # SQLAlchemy ORM models (§7 of PRD)
  schemas/
    schemas.py            # Pydantic request/response schemas
  services/
    feature_engineering.py  # THI, baselines, deviations (§8)
    risk_engine.py         # Rule-based risk engine (§9)
    alerting.py            # Alert generation logic
  api/
    v1/
      routes_auth.py      # Authentication (login, register, /me)
      routes_farms.py     # Farm CRUD
      routes_animals.py   # Animal CRUD + history queries
      routes_ingest.py    # Sensor/lab/image ingestion
      routes_risk.py      # Risk computation & alerts
      routes_alerts.py    # Alert queries & herd summary
  main.py                 # FastAPI app entry point

scripts/
  import_farm01.py        # Import Farm 01 (Vaishanavi Dairy) data
  simulate_sensor_feed.py # Demo sensor data generator (TODO)

alembic/                  # Database migrations
tests/                    # Pytest integration tests (TODO)

pyproject.toml            # Project metadata and dependencies
requirements.txt          # Pip dependencies
.env.example              # Environment configuration template
README.md                 # This file
```

## Installation

### Prerequisites

- Python 3.10+
- PostgreSQL 13+ (or PostgreSQL+TimescaleDB for better time-series support)
- Git

### Setup

1. **Clone/setup the repository**:
   ```bash
   cd sih-backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and secret key
   ```

5. **Initialize database**:
   ```bash
   python scripts/import_farm01.py
   ```
   This creates the schema and imports Farm 01 demo animals (14 cows + 30 buffaloes).

6. **Run the server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   API docs will be available at:
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login (email, password)
- `POST /api/v1/auth/register` - Register new user
- `GET /api/v1/auth/me` - Get current user info

### Farms
- `POST /api/v1/farms` - Create farm
- `GET /api/v1/farms` - List farms (paginated)
- `GET /api/v1/farms/{farm_id}` - Get farm details
- `PUT /api/v1/farms/{farm_id}` - Update farm
- `DELETE /api/v1/farms/{farm_id}` - Delete farm

### Animals
- `POST /api/v1/animals` - Create animal
- `GET /api/v1/animals` - List animals (filterable by farm, species, risk level)
- `GET /api/v1/animals/{animal_id}` - Get animal profile
- `PUT /api/v1/animals/{animal_id}` - Update animal
- `GET /api/v1/animals/{animal_id}/sensor-history` - Sensor readings time-series
- `GET /api/v1/animals/{animal_id}/risk-history` - Risk score history
- `GET /api/v1/animals/{animal_id}/risk` - Current risk assessment

### Data Ingestion
- `POST /api/v1/ingest/sensor` - Ingest batched sensor readings (gateway → backend)
- `POST /api/v1/ingest/manual-lab` - Enter manual lab data (CMT, SCC, pH, EC, milk yield)
- `POST /api/v1/ingest/udder-image` - Upload udder image (multipart)

### Risk & Alerts
- `POST /api/v1/risk/compute` - Trigger risk computation (manual or scheduled)
- `GET /api/v1/farms/{farm_id}/alerts` - List alerts (filterable by status, severity)
- `PATCH /api/v1/alerts/{alert_id}` - Acknowledge/resolve alert

### Herd Analytics
- `GET /api/v1/farms/{farm_id}/summary` - Herd-level summary (aggregated risk, animal counts)

## Data Models

### Core Entities

**Farm** (farms)
- farm_id (UUID)
- name, code, location, lat/lon
- Relationships: animals, users

**Animal** (animals)
- animal_id (UUID)
- farm_id (FK)
- tag_id (unique, e.g., "F01_COW_003")
- species ('cow' or 'buffalo')
- breed, age_months, lactation_number, pregnancy_status
- previous_mastitis (boolean)
- disease_history, vaccination_history, treatment_history (JSON)
- comorbidities (array)
- status ('active', 'culled', 'sold', 'dead')
- Relationships: sensor_readings, manual_lab_data, udder_images, risk_scores, alerts

**SensorReading** (sensor_readings)
- reading_id (UUID)
- animal_id (FK)
- recorded_at (device timestamp, supports backfill)
- received_at (server ingestion time)
- activity_raw (from MPU6050)
- surface_temp_c (from DS18B20; **not** core body temperature)
- ambient_temp_c, relative_humidity (from SHT31-D)
- audio_features (from MAX9814, pre-processed)
- rumination_inferred_min (inferred, not measured)
- thi (computed Temperature Humidity Index)
- source ('collar_v1', 'manual_stub', etc.)

**ManualLabData** (manual_lab_data)
- lab_id (UUID)
- animal_id (FK)
- recorded_at
- milk_yield_l
- milk_temp_c (**distinct** from surface_temp_c)
- udder_temp_c (if separately measured)
- cmt_result (California Mastitis Test: negative/trace/1+/2+/3+)
- scc_value, scc_unit (Somatic Cell Count)
- milk_ph, milk_ec (conductivity)
- data_source ('manual', 'lab', 'cooperative', 'vet', 'farm_equipment')
- entered_by_user_id (FK)

**UdderImage** (udder_images)
- image_id (UUID)
- animal_id (FK)
- captured_at
- image_url (storage path)
- cv_result (JSON: {swelling, asymmetry, redness, lesions, discharge, confidence})
- cv_model_version
- reviewed_by_vet (boolean)

**RiskScore** (risk_scores)
- score_id (UUID)
- animal_id (FK)
- computed_at
- window_start, window_end (feature window)
- risk_level ('no_risk', 'low', 'moderate', 'high')
- risk_score_numeric (0-1 or 0-100 depending on model)
- contributing_factors (JSON: [{factor, weight}, ...])
- recommended_action (text)
- model_version (which engine produced this)
- **is_forecast** (boolean: true if forward prediction, false if current-state screening)
- forecast_horizon_days (N if forecasting N days ahead, null otherwise)

**Alert** (alerts)
- alert_id (UUID)
- animal_id (FK)
- risk_score_id (FK, nullable)
- triggered_at
- severity ('low', 'moderate', 'high')
- message (push-notification-ready text)
- status ('open', 'acknowledged', 'resolved', 'false_positive')
- acknowledged_by (user_id, FK, nullable)
- resolved_at (timestamp)

**Baseline** (baselines)
- baseline_id (UUID)
- animal_id (FK)
- metric ('activity_raw', 'rumination_inferred_min', 'surface_temp_c')
- baseline_mean, baseline_stddev
- window_days (e.g., 7)
- updated_at

**User** (users)
- user_id (UUID)
- farm_id (FK, nullable; admin may span farms)
- name, email (unique), phone
- password_hash
- role ('farmer', 'vet', 'admin')
- preferred_language (for future i18n)

## Feature Engineering (§8)

### THI (Temperature Humidity Index)
Computed from ambient temperature and relative humidity using the standard Thom formula:
```
THI = T - 0.55*(1-RH) * (T - 14.5)
```
where T = temperature in °C, RH = relative humidity (0-1).

### Rolling Baselines
For each animal, compute 7-day (default) rolling mean/stddev for:
- Activity (activity_raw)
- Inferred Rumination (rumination_inferred_min)
- Surface Temperature (surface_temp_c)

Updated incrementally as new sensor readings arrive.

### Deviation Scoring
For each metric, compute z-score (standard deviations from animal's own baseline):
```
z = (value - mean) / stddev
```
Used as input features for risk engine.

## Risk Engine Interface (§9)

### Input Schema
```python
RiskEngineInput {
  animal_id: UUID
  window_start: datetime
  window_end: datetime
  features: {
    activity_deviation: float | null
    rumination_inferred_deviation: float | null
    surface_temp_deviation: float | null
    thi_avg: float | null
    thi_max: float | null
    manual_lab_data: {
      milk_yield_l, milk_temp_c, udder_temp_c,
      cmt_result, scc_value, scc_unit, milk_ph, milk_ec
    } | null
    udder_cv_result: {...} | null
    animal_meta: {
      species, breed, age_months, lactation_number, previous_mastitis
    }
  }
}
```

### Output Schema
```python
RiskEngineOutput {
  risk_level: 'no_risk' | 'low' | 'moderate' | 'high'
  risk_score_numeric: float
  contributing_factors: [{factor: string, weight: float}]
  recommended_action: string
  model_version: string
  is_forecast: boolean
  forecast_horizon_days: int | null
}
```

### MVP Implementation
Rule-based engine (`RuleBasedRiskEngine`) in `app/services/risk_engine.py`:
- Activity drop (z-score < -1.5) → weight 0.3
- Rumination drop (z-score < -1.0) → weight 0.2
- Temperature elevation (z-score > +1.0) → weight 0.2
- THI elevation (>68 = moderate, >72 = high) → weight 0.2
- CMT positive result (1+/2+/3+) → weight 0.1

**Later**: ML team implements `MLRiskEngine` with identical interface; backend remains agnostic.

## Alerting Logic (§11)

- Alert generated when risk_level transitions to a **higher** level (e.g., low → moderate)
- **No re-alerting** for the same standing risk level
- Alert payload includes: title, body, animal tag, recommended action (push-ready)
- Exposed via API for polling by mobile clients
- Can be acknowledged or resolved by users

## Data Import (§12)

### Farm 01 - Vaishanavi Dairy

Import 14 cows (F01_COW_001 to F01_COW_014) and 30 buffaloes (F01_BUF_001 to F01_BUF_030):

```bash
python scripts/import_farm01.py
```

For custom CSV:
```bash
python scripts/import_farm01.py --csv-file data/farm01_animals.csv
```

**CSV Format** (optional; if not provided, demo animals are created):
```
tag_id,species,breed,age_months,lactation_number,pregnancy_status,previous_mastitis
F01_COW_001,cow,,,,
F01_BUF_001,buffalo,,,,
...
```

**Per PRD §12**: Script is idempotent (upsert on tag_id). Any missing field is NULL, never auto-filled.

## Non-Functional Requirements

### Low-cost / Scalable
- PostgreSQL on small VM or free-tier cloud
- No heavyweight enterprise DB
- Async handlers for responsive ingestion under load

### Resilient to Intermittent Connectivity
- Ingestion endpoint accepts batched readings with client-provided timestamps
- Gateway can buffer data offline and upload later

### Extensible
- Flexible schema (e.g., comorbidities as array, disease_history as JSON)
- Adding new sensor types doesn't require schema rewrites
- Risk engine is pluggable (interface-based)

### Auditable
- Never silently overwrite/discard health data
- Corrections are new records, not destructive updates
- Risk scores store model_version and contributing_factors for transparency

### Honest by Design
- No field computed as fabricated placeholder
- Derived features return NULL/"insufficient_data" if not computable, never guessed
- is_forecast flag distinguishes current-state screening from forward predictions

### Multi-species Aware
- Schema supports cow and buffalo without hacks
- No "assume Murrah breed" defaults unless explicitly confirmed

## Out of Scope for MVP

- GIS hotspot mapping (schema designed for it; not built)
- Multilingual translation (backend i18n-ready via string keys; no translated content)
- Production-grade offline sync / edge computing
- Payment, billing, multi-tenant SaaS infra

## Configuration

Edit `.env` to customize:

```env
# Database
DATABASE_URL=mongodb://admin:password@localhost:27017/bovine_mastitis?authSource=admin

# Security (change in production!)
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
CORS_ORIGINS=["*"]

# File storage
MEDIA_DIR=./media

# Optional heat-stress SMS alerts (Twilio)
SMS_ENABLED=false
SMS_THI_THRESHOLD=68
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+15550000000
```

When `SMS_ENABLED=true`, a sensor batch containing a THI at or above
`SMS_THI_THRESHOLD` sends one SMS to the authenticated user's `phone` number.
SMS delivery failures do not reject the sensor ingestion request.

## Testing

### Unit Tests (Feature Engineering)
```bash
pytest tests/test_feature_engineering.py -v
```

### Integration Tests (API Endpoints)
```bash
pytest tests/test_api.py -v
```

### Run All Tests
```bash
pytest tests/ -v --cov=app
```

## Development Workflow

1. Create feature branch: `git checkout -b feature/xyz`
2. Make changes, write tests
3. Run tests and linting: `pytest`, `black`, `ruff`
4. Commit and push: `git push origin feature/xyz`
5. Open PR for review

## Deployment

For production:
1. Set `DEBUG=False` in `.env`
2. Generate a strong `SECRET_KEY`
3. Use HTTPS (reverse proxy with SSL)
4. Use a production WSGI server (e.g., Gunicorn + Uvicorn)
5. Run database migrations: `alembic upgrade head`
6. Use managed PostgreSQL (AWS RDS, GCP Cloud SQL, etc.)
7. Store images in S3 or equivalent (update storage interface)

Example Gunicorn command:
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Known Limitations & TODOs

- [ ] GIS mapping for herd hotspots
- [ ] Multilingual UI support
- [ ] Full offline sync / edge computing
- [ ] Celery/RQ for distributed background jobs (APScheduler in-process only)
- [ ] S3 image storage integration
- [ ] CV model integration (currently stub)
- [ ] Email/SMS alerting (API-ready; push logic stubbed)
- [ ] Integration tests for all endpoints
- [ ] Performance profiling for large herds (1000+ animals)

## License

© 2026 Team InnovX - Smart India Hackathon 26109. All rights reserved.

## Support

For questions, issues, or feedback:
- Internal: Contact Backend Lead
- External: Via hackathon support channels

---

**Last Updated**: Sept 2026  
**Status**: MVP (v0.1.0)
