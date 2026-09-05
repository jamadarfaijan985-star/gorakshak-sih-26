# Product Requirements Document — Backend System
## SIH26109: AI-Based Predictive Modelling for Early Forecasting of Bovine Mastitis in Indian Dairy Farms
### Team InnovX — Smart India Hackathon 2026

**Document owner:** Backend Lead
**Status:** MVP build spec (target: working backend by Sept 4, 2026)
**Audience:** AI coding agent / IDE building the backend service

---

## 1. Purpose of this document

This PRD defines **only the backend system** for our mastitis early-risk forecasting product. It is written to be handed directly to an AI IDE (e.g. Claude Code, Cursor) to scaffold and implement the service. It does not cover hardware firmware, the ML model's internal training code, or frontend/mobile UI — those are owned by other team members, but this document defines the **contracts** the backend must expose to them.

**Do not invent product claims beyond this document.** The backend must remain a faithful implementation of a *screening and decision-support* system — not a diagnostic system.

---

## 2. Product summary (context, not to be re-litigated)

A low-cost collar (MPU6050, DS18B20, MAX9814, SHT31-D) continuously streams behavioural/physiological/environmental signals per animal. The backend ingests this data, computes derived features (e.g. THI), stores time series, feeds a risk-scoring/ML component, and produces:

- Per-animal mastitis risk scores (No / Low / Moderate / High)
- Herd-level aggregated risk views
- Early-warning alerts when risk crosses thresholds
- A place to attach targeted diagnostic data when available (CMT, SCC, milk pH/EC/temp, udder images)
- Support for multiple farms, multiple animals, multiple users (farmer/vet/admin)

The core loop the backend must support end-to-end: **SENSE → SCREEN → PRIORITIZE → CONFIRM → ACT**

The backend is the system of record and the orchestration layer between: hardware/gateway → ML risk engine → mobile/dashboard clients.

---

## 3. Goals for the MVP (Sept 1–4 deadline)

Must have, in priority order:

1. Ingest sensor data from the collar/gateway (via HTTP; MQTT as stretch goal).
2. Store animal, farm, and sensor time-series data reliably.
3. Compute derived features (THI, rolling baselines, deviation from baseline).
4. Expose an interface for the ML/risk-scoring component to consume features and return a risk score + contributing factors (this can initially be a rule-based stub that the ML team's model later replaces — same contract).
5. Persist risk scores and generate alerts when risk crosses thresholds.
6. Expose REST APIs for: animal CRUD, farm CRUD, sensor data query, risk score query, alerts, herd summary.
7. Allow manual/lab data entry (milk yield, milk temp, CMT, SCC, pH, EC) attached to an animal + timestamp.
8. Support udder image upload + storage (CV analysis result stored as a field; CV model integration can be a stub initially).
9. Basic auth (farm-level login; simple JWT).
10. Seed / import the Farm 01 (Vaishanavi Dairy) dataset — 14 cows + 30 buffaloes — using real provided data only, with explicit `null`/`"missing"` for unknown fields. **Never auto-fill fabricated values.**

Explicitly out of scope for MVP (do not build unless asked):
- GIS hotspot mapping (design the schema to allow it later; don't build the map layer now)
- Multilingual content (backend should be i18n-ready via string keys, not translated content itself)
- Production-grade offline sync / edge computing (design for it, don't fully implement)
- Payment, billing, multi-tenant SaaS infra

---

## 4. Non-functional requirements

- **Low-cost/scalable**: prefer free/open-source infra usable on a small VM or free-tier cloud (Postgres, not a heavyweight enterprise DB).
- **Resilient to intermittent connectivity**: ingestion endpoint should accept batched/backfilled sensor readings with client-provided timestamps (gateway may buffer data offline and upload later).
- **Extensible**: adding a new sensor type or a new manual diagnostic field should not require schema rewrites — use a flexible but still queryable schema (see §7).
- **Auditable**: never silently overwrite or discard data; corrections should be new records, not destructive updates, for animal health data.
- **Honest by design**: no field should be computed as a fabricated placeholder. If a derived feature can't be computed (insufficient data), the API must return it as `null`/`"insufficient_data"`, never a guessed number.
- **Multi-species aware**: schema must support both cow and buffalo without hacks (e.g. no "assume Murrah breed" defaults unless explicitly confirmed for that farm/animal).

---

## 5. Users / consumers of this backend

| Consumer | Needs from backend |
|---|---|
| Collar → Gateway (ESP8266/ESP32) | POST raw sensor readings |
| ML/Risk Engine (Farhan's team) | GET feature windows per animal; POST risk score results |
| Mobile app (Faizan's team) | Animal list, risk alerts, herd summary, manual data entry, image upload |
| Dashboard (web) | Herd analytics, trends, farm management |
| Vet/Farmer (end user, via app) | View risk, log observations, trigger targeted assessment |
| Admin (Team InnovX, judges/demo) | Farm/animal management, data import, demo reset |

---

## 6. High-level architecture

```
[Collar: MPU6050, DS18B20, MAX9814, SHT31-D]
        |
        v
[Gateway / ESP8266-ESP32] --(HTTP POST, batched JSON)--> [Ingestion API]
        |
        v
[Backend Service]
   ├─ Ingestion Layer (validate, store raw readings)
   ├─ Feature Engineering (THI calc, rolling baselines, deviation scores)
   ├─ Risk Engine Adapter (calls ML model service OR rule-based fallback)
   ├─ Alerting Engine (threshold + trend based)
   ├─ Manual/Lab Data Module (CMT, SCC, pH, EC, milk yield/temp)
   ├─ Image Module (udder photo upload -> CV service adapter -> stored result)
   ├─ Herd Aggregation Module
   └─ Auth & Farm/User Management
        |
        v
[PostgreSQL (+ optional TimescaleDB extension for time series)]
        |
        v
[REST API layer] <--- consumed by Mobile App, Dashboard
```

The ML model and CV model are treated as **pluggable services** behind an internal interface (function call if same process, or HTTP call if separate microservice). The backend must not assume the ML model is finished — build against a stub that implements the same contract (see §9).

---

## 7. Data model

Use PostgreSQL. Suggested core tables (adapt naming to your ORM conventions, e.g. Prisma/SQLAlchemy):

### 7.1 `farms`
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| name | text | e.g. "Vaishanavi Dairy" |
| code | text unique | e.g. "F01" |
| location_text | text | free text; lat/lon optional for future GIS |
| latitude | float, nullable | |
| longitude | float, nullable | |
| created_at | timestamptz | |

### 7.2 `animals`
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| farm_id | FK → farms | |
| tag_id | text unique | e.g. "F01_BUF_012", "F01_COW_003" |
| species | enum('cow','buffalo') | |
| breed | text, nullable | do NOT default to "Murrah" unless confirmed for that farm/animal |
| age_months | int, nullable | |
| lactation_number | int, nullable | |
| pregnancy_status | text, nullable | |
| previous_mastitis | boolean, nullable | |
| disease_history | jsonb, nullable | array of {condition, date, notes} |
| vaccination_history | jsonb, nullable | |
| treatment_history | jsonb, nullable | |
| comorbidities | text[], nullable | |
| status | enum('active','culled','sold','dead'), default active | |
| created_at, updated_at | timestamptz | |

**Rule:** any field with unknown value at import time = `NULL`, never a guessed default.

### 7.3 `sensor_readings` (high volume, time-series)
| field | type | notes |
|---|---|---|
| id | bigserial / uuid PK | |
| animal_id | FK → animals | |
| recorded_at | timestamptz | device timestamp, not server receipt time |
| received_at | timestamptz | server ingestion time |
| activity_raw | jsonb / float | from MPU6050 — accelerometer-derived activity index |
| surface_temp_c | float, nullable | from DS18B20 — **label explicitly as surface/skin temperature** |
| ambient_temp_c | float, nullable | from SHT31-D |
| relative_humidity | float, nullable | from SHT31-D |
| audio_features | jsonb, nullable | pre-processed acoustic features from MAX9814 (not raw audio necessarily) |
| rumination_inferred_min | float, nullable | AI-inferred rumination time; must be flagged as `inferred`, never `measured` |
| thi | float, nullable | computed field, see §8 |
| source | text | e.g. "collar_v1", "manual_stub" |

Index on `(animal_id, recorded_at)`.

### 7.4 `manual_lab_data`
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| animal_id | FK → animals | |
| recorded_at | timestamptz | |
| milk_yield_l | float, nullable | |
| milk_temp_c | float, nullable | **keep distinct from surface_temp_c and udder_temp_c** |
| udder_temp_c | float, nullable | if separately measured |
| cmt_result | text/enum, nullable | e.g. negative/trace/1+/2+/3+ |
| scc_value | float, nullable | cells/mL or SCC score, record unit explicitly |
| scc_unit | text, nullable | |
| milk_ph | float, nullable | |
| milk_ec | float, nullable | conductivity |
| data_source | enum('manual','lab','cooperative','vet','farm_equipment') | |
| entered_by_user_id | FK → users, nullable | |

### 7.5 `udder_images`
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| animal_id | FK → animals | |
| captured_at | timestamptz | |
| image_url | text | storage path/URL |
| cv_result | jsonb, nullable | e.g. {swelling: bool/score, asymmetry, redness, lesions, discharge, confidence} |
| cv_model_version | text, nullable | |
| reviewed_by_vet | boolean, default false | |

### 7.6 `risk_scores`
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| animal_id | FK → animals | |
| computed_at | timestamptz | |
| window_start / window_end | timestamptz | feature window used |
| risk_level | enum('no_risk','low','moderate','high') | |
| risk_score_numeric | float, nullable | 0-1 or 0-100, model-dependent |
| contributing_factors | jsonb | e.g. [{factor: "activity_deviation", weight: 0.4}, ...] |
| recommended_action | text | e.g. "Targeted udder/milk assessment" |
| model_version | text | which model/rule-set produced this |
| forecast_horizon_days | int, nullable | e.g. 7 or 14 — only populate once a genuine forecast model is used, not the screening rule-engine |
| is_forecast | boolean | true only if this is a forward-looking prediction, false if current-state screening |

**Important distinction to encode in schema:** "current elevated risk" (screening) vs "N-day-ahead forecast" (forecasting) are conceptually different outputs. Do not conflate — keep `is_forecast` and `forecast_horizon_days` so the frontend/PPT can honestly label which is which.

### 7.7 `alerts`
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| animal_id | FK → animals | |
| risk_score_id | FK → risk_scores | |
| triggered_at | timestamptz | |
| severity | enum('low','moderate','high') | |
| message | text | |
| status | enum('open','acknowledged','resolved','false_positive') | |
| acknowledged_by | FK → users, nullable | |
| resolved_at | timestamptz, nullable | |

### 7.8 `users`
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| farm_id | FK → farms, nullable (admin may span farms) | |
| name | text | |
| phone/email | text | |
| password_hash | text | |
| role | enum('farmer','vet','admin') | |
| preferred_language | text, nullable | for future multilingual support (store key, not translated text) |

### 7.9 `baselines` (per-animal rolling statistics, used for deviation detection)
| field | type | notes |
|---|---|---|
| animal_id | FK → animals | |
| metric | text | e.g. "activity", "rumination_inferred_min", "surface_temp_c" |
| baseline_mean | float | |
| baseline_stddev | float | |
| window_days | int | e.g. 7-day rolling baseline |
| updated_at | timestamptz | |

---

## 8. Derived feature computation (backend responsibility)

The backend (not the ML model) is responsible for basic feature engineering so the ML/rule engine gets clean inputs:

1. **THI (Temperature Humidity Index)** — compute from `ambient_temp_c` and `relative_humidity` using a standard published THI formula (implement as a pure function, unit-tested; do not fabricate a custom formula without citing the standard one used).
2. **Rolling baseline per animal per metric** — compute mean/stddev over a trailing window (e.g. 7 days) for activity, inferred rumination, surface temp. Store in `baselines`.
3. **Deviation score** — for each new reading, compute z-score or % deviation from that animal's own baseline (not a population-wide baseline — mastitis risk detection here is animal-relative).
4. These engineered features are what get passed to the risk engine (§9), not raw sensor values alone.

---

## 9. Risk Engine interface contract (critical — build to this contract even before ML model is ready)

Define an internal interface, e.g.:

```
RiskEngineInput {
  animal_id: string
  window_start: datetime
  window_end: datetime
  features: {
    activity_deviation: float | null
    rumination_inferred_deviation: float | null
    surface_temp_deviation: float | null
    thi_avg: float | null
    thi_max: float | null
    manual_lab_data: object | null   // most recent CMT/SCC/pH/EC/milk temp if any
    udder_cv_result: object | null
    animal_meta: { species, breed, age_months, lactation_number, previous_mastitis, ... }
  }
}

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

**MVP implementation:** build a rule-based version of this engine first (simple weighted-threshold logic on deviations, e.g. per §4 of context doc: activity↓ + rumination↓ + surface_temp deviation↑ + THI↑ → escalate risk). This lets the whole pipeline work end-to-end for the demo. The ML team's model, once ready, should be swappable behind the **same interface** — do not hardcode assumptions that only the rule engine can satisfy.

Store `model_version` on every risk score so we can always tell which logic produced a given score (important for judge questions on validation).

---

## 10. API surface (REST, JSON, JWT-auth except ingestion endpoint which uses a device API key)

### Ingestion
- `POST /api/v1/ingest/sensor` — batched sensor readings from gateway. Body: `{device_id, animal_id or tag_id, readings: [{recorded_at, activity_raw, surface_temp_c, ambient_temp_c, relative_humidity, audio_features}]}`. Auth: device API key.
- `POST /api/v1/ingest/manual-lab` — manual/lab data entry.
- `POST /api/v1/ingest/udder-image` — multipart upload; returns image record; triggers async CV job.

### Animals & Farms
- `GET /api/v1/farms/:farmId/animals` — list, paginated, filterable by risk_level, species.
- `GET /api/v1/animals/:id` — full profile including latest risk score.
- `POST /api/v1/animals` / `PUT /api/v1/animals/:id` — CRUD (admin/vet).
- `GET /api/v1/animals/:id/sensor-history?from=&to=&metric=`
- `GET /api/v1/animals/:id/risk-history`

### Risk & Alerts
- `GET /api/v1/animals/:id/risk` — current risk.
- `POST /api/v1/risk/compute` — trigger risk computation for one/all animals (internal/cron use, also useful for demo).
- `GET /api/v1/farms/:farmId/alerts?status=open`
- `PATCH /api/v1/alerts/:id` — acknowledge/resolve.

### Herd analytics
- `GET /api/v1/farms/:farmId/summary` — counts by risk level, trend over last N days.

### Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register` (admin-created accounts for MVP; no public self-signup needed)

All list endpoints: pagination (`limit`, `offset` or cursor), and consistent envelope:
```json
{ "data": [...], "meta": { "total": 0, "limit": 50, "offset": 0 } }
```

---

## 11. Alerting logic (MVP)

- Alert generated when `risk_level` transitions from a lower to `moderate` or `high` for an animal (avoid re-alerting every computation cycle for the same standing risk — only alert on level increase or every N hours while still elevated).
- Alert payload should be push-notification-ready (title + body + animal tag + recommended action) even if actual push delivery (FCM/etc.) is stubbed for MVP — expose the alert via API/poll for the mobile team to consume.

---

## 12. Data import task (Farm 01 — Vaishanavi Dairy)

Build a one-time import script/CLI that:
- Reads the cleaned Farm 01 dataset (14 cows: `F01_COW_001`–`F01_COW_014`; 30 buffaloes: `F01_BUF_001`–`F01_BUF_030`).
- Inserts into `animals` with `farm_id` for Vaishanavi Dairy.
- Any field not present in the source data is inserted as `NULL` — the script must log which fields were missing per animal, not silently skip or fabricate.
- Idempotent (safe to re-run without duplicating records — upsert on `tag_id`).

---

## 13. Tech stack — LOCKED

- **Language/framework:** **Python + FastAPI**. This is now fixed for the project — do not substitute Node/Express or another framework. Chosen because it integrates cleanly with the ML team's likely Python-based model code (can even be imported in-process instead of over HTTP if convenient later).
- **ORM/DB layer:** **SQLAlchemy 2.x** (or **SQLModel**, which pairs SQLAlchemy with Pydantic and reduces boilerplate — preferred if the IDE supports it well) with **Alembic** for migrations. Migrations are mandatory from day one — do not hand-edit schema.
- **Validation/schemas:** Pydantic v2 models for every request/response body, mirroring the tables in §7 and the Risk Engine contract in §9. Reuse Pydantic schemas as the source of truth for the OpenAPI docs.
- **DB:** PostgreSQL (add TimescaleDB extension if easily available for `sensor_readings`; otherwise plain Postgres with good indexing on `(animal_id, recorded_at)` is fine for MVP scale).
- **Auth:** JWT (e.g. `python-jose` or `fastapi-users`), `passlib[bcrypt]` for password hashing. Use FastAPI's `OAuth2PasswordBearer`/dependency-injection pattern for protected routes.
- **Async:** Use `async def` route handlers with an async DB driver (`asyncpg` via SQLAlchemy async engine) so the ingestion endpoints stay responsive under sensor load. Sync is acceptable only if the team is short on time and async setup becomes a blocker.
- **File/image storage:** local disk under a clearly separated `/media` path behind a small storage-interface module (swap to S3-compatible bucket later without touching route code).
- **Background jobs / scheduled risk computation:** APScheduler (in-process, simplest for MVP) for the periodic risk-computation job; a full queue (Celery/RQ) only if time permits post-MVP.
- **API docs:** FastAPI's built-in OpenAPI/Swagger UI (`/docs`) and ReDoc (`/redoc`) — no extra tooling needed; keep it enabled for the whole hackathon (useful for both the mobile team and judges).
- **Project layout (suggested):**
  ```
  app/
    main.py                 # FastAPI app instantiation, router includes
    core/
      config.py              # settings via pydantic-settings
      security.py             # JWT/password utils
    db/
      session.py               # async engine/session
      base.py                   # declarative base
    models/                     # SQLAlchemy/SQLModel ORM models (per §7 tables)
    schemas/                    # Pydantic request/response models
    api/
      v1/
        routes_animals.py
        routes_farms.py
        routes_ingest.py
        routes_risk.py
        routes_alerts.py
        routes_auth.py
    services/
      feature_engineering.py    # THI, baselines, deviations (§8)
      risk_engine.py             # interface + rule-based implementation (§9)
      alerting.py
    scripts/
      import_farm01.py           # §12 import script
      simulate_sensor_feed.py     # demo data generator
    tests/
  alembic/
  ```

---

## 14. Explicit "do not" list for the backend build

- Do NOT default missing breed to "Murrah" unless the source data confirms it for that farm/animal.
- Do NOT label `surface_temp_c` as core body temperature anywhere (field names, API docs, comments).
- Do NOT label `rumination_inferred_min` as a direct measurement — always "inferred."
- Do NOT merge `milk_temp_c`, `surface_temp_c`, and `udder_temp_c` into one field.
- Do NOT hardcode a "14-day forecast" claim into any response unless `is_forecast=true` and a genuine forecasting model produced it — the MVP rule engine should set `is_forecast=false`.
- Do NOT fabricate SCC/CMT/pH/EC values — these fields must be nullable and left null until real data is entered.
- Do NOT build GIS mapping, multilingual translation, or full offline-first sync for the MVP — schema/interfaces should allow them later, but don't spend MVP time implementing them.

---

## 15. Suggested build order for the AI IDE

1. Scaffold FastAPI project per the layout in §13; set up `pydantic-settings` config, async Postgres connection, and Alembic with an initial migration for the schema in §7.
2. Implement Auth (JWT) + Farm/User/Animal CRUD routes with Pydantic schemas.
3. Implement Farm 01 data import script (`scripts/import_farm01.py`).
4. Implement ingestion endpoints (`sensor`, `manual-lab`, `udder-image` stub) under `api/v1/routes_ingest.py`.
5. Implement THI + baseline + deviation feature computation in `services/feature_engineering.py` (pure, unit-testable functions).
6. Implement rule-based Risk Engine behind the interface in §9, in `services/risk_engine.py` — keep it swappable so the ML team's model can later implement the same interface.
7. Implement risk computation trigger (APScheduler job + manual `POST /api/v1/risk/compute` endpoint) → writes to `risk_scores`.
8. Implement alerting on risk-level transitions in `services/alerting.py`.
9. Implement herd summary + risk/sensor history query endpoints.
10. Confirm `/docs` (Swagger) renders cleanly for every route; add basic `pytest` integration tests for each endpoint.
11. Seed demo data / provide `scripts/simulate_sensor_feed.py` to simulate incoming sensor readings for demo purposes (clearly marked as `source: "simulated_demo"` — never mixed with real farm data).

---

## 16. Open questions for the team (flag, don't guess)

- Exact THI formula/coefficients to standardize on (confirm with Farhan/ML team or cite the specific published formula used).
- Final format the ML model will accept/return (confirm against §9 contract; adjust if ML team has already fixed a format).
- Whether gateway will use HTTP polling or MQTT for real deployment (MVP: HTTP is sufficient).
- Image storage target for MVP (local vs cloud bucket) — depends on demo environment.
- Which of the 5 farms' datasets are clean enough to import by Sept 4; Farm 01 is the confirmed priority.

---

*End of PRD. This document should be pasted in full into the AI IDE as the build specification for the backend service.*
