# GoRakshak — Complete Judges' Q&A Document
## SIH26109 · Team InnovX · Smart India Hackathon 2026
### AI-Based Predictive Modelling for Early Forecasting of Bovine Mastitis in Indian Dairy Farms

---

## SECTION 1 — Problem & Motivation

---

**Q1. What problem are you solving and why is it important for India?**

Bovine mastitis is the single most economically damaging disease in dairy farming worldwide, and India — home to the world's largest dairy herd — bears a disproportionate share of the burden. It causes a 20–35% loss in milk yield per affected quarter, permanent reduction in productive life of the animal, and significantly increases veterinary costs.

The core gap in Indian dairy, especially small and marginal farms, is that mastitis is detected only after clinical signs appear — visible swelling, clotting in milk, fever — at which point irreversible damage has already occurred. There is no affordable, continuous, AI-assisted early-warning system designed for Indian conditions that handles both *Bos taurus* cows and Murrah buffaloes simultaneously.

GoRakshak addresses this by putting a low-cost wearable collar on each animal that continuously streams 4 types of physiological/behavioral/environmental signals to an AI backend. The backend predicts mastitis risk up to 14 days before clinical onset, allowing the farmer to intervene early with targeted CMT testing, milk sampling, or veterinary consultation — rather than emergency treatment.

---

**Q2. Why mastitis specifically, and not another cattle disease?**

Three reasons: (1) Mastitis has the highest economic impact per incidence compared to any other dairy cattle disease. (2) Its early indicators — changes in rumination, activity, surface temperature, and milk quality — are measurable with low-cost sensors that already have commodity-grade hardware readily available. (3) The disease progression from subclinical to clinical follows a predictable temporal trajectory (typically 5–14 days), making it suitable for a forecasting model with a defined prediction horizon.

---

**Q3. What is the 5-step operational loop your system supports?**

**SENSE → SCREEN → PRIORITIZE → CONFIRM → ACT**

- **SENSE:** The collar (MPU6050 + DS18B20 + MAX9814 + SHT31-D) streams data via ESP8266/ESP32 gateway to the cloud backend every few minutes.
- **SCREEN:** On each data ingest the backend computes THI, updates 7-day rolling baselines, runs the ML risk engine, and assigns a risk level (No Risk / Low / Moderate / High).
- **PRIORITIZE:** The alerting engine escalates alerts when risk level increases; the herd dashboard surfaces which animals need attention first.
- **CONFIRM:** The farmer or vet performs targeted CMT testing, SCC measurement, milk pH/EC analysis, and udder photo upload. These feed back into the next risk cycle.
- **ACT:** The system generates actionable text recommendations ("Immediate veterinary examination", "Schedule udder assessment within 24 hours", etc.) so the farmer knows exactly what to do.

---

**Q4. Who is the target user?**

Primary: Small and marginal dairy farmers in India (2–30 animals) who cannot afford dedicated veterinarians on-call. Secondary: Veterinarians doing herd visits who need prioritized examination lists. Tertiary: Dairy cooperative field officers monitoring multiple farms.

---

## SECTION 2 — Hardware / Sensors

---

**Q5. What sensors are on the collar and what does each measure?**

| Sensor | Chip | What it measures | Internal field |
|--------|------|-----------------|----------------|
| Accelerometer/Gyroscope | MPU6050 | Animal movement/activity index — a proxy for restlessness and reduced mobility, both early mastitis markers | `activity_raw` |
| Temperature probe | DS18B20 | **Surface/skin temperature** at the collar contact point — NOT core body temperature. Elevated skin temp >0.8°C above the animal's own baseline indicates local vascular dilation from inflammation | `surface_temp_c` |
| Microphone amplifier | MAX9814 | Acoustic signals from jaw movement; an AI model infers rumination time (min/day) from chewing sound patterns. Rumination drop is one of the strongest early behavioral markers of systemic discomfort | `audio_features` → `rumination_inferred_min` |
| Temp + Humidity | SHT31-D | Ambient barn temperature and relative humidity — combined to compute the Temperature-Humidity Index (THI), the standard metric for heat stress in dairy cattle | `ambient_temp_c`, `relative_humidity` |

---

**Q6. Is DS18B20 measuring core body temperature?**

**No.** The DS18B20 is mounted on the collar which is around the animal's neck. It measures surface/skin temperature at the collar contact point. We explicitly never label it as core body temperature anywhere in the codebase or dashboard. It is used as a *relative deviation from that animal's own baseline* — if an individual animal's skin temperature is +1.2°C above its personal 7-day average, that deviation is the signal, not the absolute number. This is a well-established principle in wearable livestock sensing.

---

**Q7. How does rumination inference work? Can the microphone actually distinguish rumination from other sounds?**

The MAX9814 captures raw ADC values (`mic_average` and `mic_peak_peak`). The characteristic chewing rhythm of bovine rumination (approximately 50–60 jaw movements/minute, 30–50 seconds per bolus) produces a distinctive acoustic pattern at 1–3 Hz that differs from vocalizations, ambient barn noise, and drinking. A separate AI inference layer processes these features to estimate `rumination_inferred_min` — the inferred minutes of rumination per day. This is always displayed and stored with the label "AI-inferred" to distinguish it from direct measurement. A significant drop in rumination (>45 min/day below baseline) is one of the highest-weighted signals in our risk engine.

---

**Q8. What is the ESP8266 payload format and how does it map to your internal data model?**

The ESP8266 firmware sends a flat JSON:

```json
{
  "cow_id": "F01_COW_001",
  "body_temperature": 38.4,
  "ambient_temperature": 29.0,
  "humidity": 68,
  "activity": 0.245,
  "mic_average": 515,
  "mic_peak_peak": 31
}
```

The backend's `POST /api/v1/ingest/esp8266` endpoint (no authentication required) maps this to:

| ESP8266 field | Internal field | Notes |
|--------------|----------------|-------|
| `cow_id` | `tag_id` → resolved to `animal_id` | Must be pre-registered |
| `body_temperature` | `surface_temp_c` | DS18B20 collar probe |
| `ambient_temperature` | `ambient_temp_c` | SHT31-D |
| `humidity` | `relative_humidity` | SHT31-D (%) |
| `activity` | `activity_raw` | MPU6050 magnitude |
| `mic_average` | `audio_features.mic_average` | MAX9814 |
| `mic_peak_peak` | `audio_features.mic_peak_peak` | MAX9814 |

THI is computed automatically on every ingest. Baselines are updated automatically. We have a standalone test script (`test_esp8266_pipeline.py`) that verifies all 4 pipeline steps work before physically connecting the hardware.

---

## SECTION 3 — AI / ML Models

---

**Q9. How many ML models do you have, and what does each do?**

Seven distinct trained models:

| Model | File | Type | Task |
|-------|------|------|------|
| Cow clinical classifier | `gorakshak_cow_clinical_v2.joblib` | XGBoost Pipeline | Current-state mastitis risk for cows (clinical features) |
| Cow milk classifier | `gorakshak_cow_milk_v2.joblib` | XGBoost Pipeline | Current-state mastitis risk for cows (milk quality features) |
| Buffalo classifier | `gorakshak_buffalo_v2.joblib` | XGBoost Pipeline | Current-state subclinical mastitis risk for buffaloes |
| 7-day forecast | `gorakshak_forecast_7d_xgb_v2.joblib` | XGBoost (temporal) | Probability of mastitis onset within 7 days |
| 14-day forecast | `gorakshak_forecast_14d_xgb_v2.joblib` | XGBoost (temporal) | Probability of mastitis onset within 14 days |
| Cow udder CV | `Cow_Udder_AI_Model/best.pt` | YOLOv8 Classify | Classifies cow udder image as healthy vs diseased |
| Buffalo udder CV | `Buffalo_udder_AI_Model/buffalo_udder_segmentation.pt` | YOLOv8 Segment | Segments mastitis lesions/swelling/discharge in buffalo udder images |

All 7 models load at backend startup and are available at `GET /api/v1/risk/model-status`.

---

**Q10. Why XGBoost and not a neural network or deep learning model?**

XGBoost is the right choice for this problem for four reasons:
1. **Tabular data:** Sensor and lab data in structured columns is exactly where XGBoost outperforms neural networks.
2. **Interpretability:** XGBoost's `feature_importances_` and SHAP `TreeExplainer` give per-prediction explanations. Farmers need to know *why* an animal is flagged high-risk, not just a number.
3. **Missing value tolerance:** XGBoost natively handles NaN in inference, which is critical because not every animal has SCC or milk EC data at every reading.
4. **Low inference latency:** XGBoost inference on a single row takes <5 ms on CPU, which is important for real-time on-premise deployment on low-cost hardware.

---

**Q11. How were the classification models trained? What datasets did you use?**

Three harmonized public datasets:

1. **`cow_milk_mastitis_harmonized.csv`** — harmonized from multiple open-source cow mastitis milk quality datasets. Used for `gorakshak_cow_milk_v2`.
2. **`cow_clinical_mastitis_harmonized.csv`** — harmonized clinical mastitis records. Used for `gorakshak_cow_clinical_v2`.
3. **`buffalo_scm_core_harmonized.csv`** — subclinical mastitis records for Indian buffaloes. 963 positive cases, 402 negative (1,365 total after dropping 9 missing labels).

The models are sklearn Pipelines: `ColumnTransformer(SimpleImputer + OneHotEncoder) → XGBClassifier`. This handles mixed numeric/categorical features, missing values, and unseen categories gracefully.

---

**Q12. How did you prevent data leakage in training?**

We applied three distinct leakage prevention strategies:

1. **Clinical leakage removal:** For `cow_clinical_v2`, we explicitly drop post-onset clinical indicators before training — `pain`, `udder_hardness`, `milk_visibility`, `body_or_udder_temperature_source`, `previous_mastitis`. These variables are only observable *after* mastitis has already manifested; including them would inflate performance metrics without being useful for early detection.

2. **Animal-level leakage prevention (GroupShuffleSplit):** For `cow_clinical_v2`, we use `GroupShuffleSplit(n_splits=1, test_size=0.20, groups=source_animal_id)`. If the same animal appears in both train and test sets, any animal-specific patterns become a data leak. The script raises `RuntimeError("GROUP LEAKAGE DETECTED!")` if any overlap is found.

3. **Temporal leakage for forecasting models:** The forecasting dataset uses a strict chronological split — train: days 1–63, validation: days 64–76, test: days 77–90. No date appears in more than one split. Rolling features use `shift(1)` before rolling, meaning the model only ever sees *yesterday's* data when predicting today — no same-day lookahead.

4. **Forbidden-term scanning:** All training scripts scan feature column names for tokens like "mastitis", "target", "label", "event", "diagnostic", "clotting", "pain", "milk_visibility" and raise an error if any are present.

---

**Q13. What are the 72 features used by your forecasting models?**

The forecasting models require exactly 72 features, verified at load time (`assert len(feature_columns) == 72`). They are derived from 15 base signals:

**Base signals:** `age_years`, `parity`, `days_in_milk`, `milk_yield_kg`, `milk_temperature`, `milk_pH`, `milk_conductivity`, `scc`, `body_temperature`, `rumination_min`, `activity_index`, `feed_intake`, `ambient_temperature`, `humidity`, `thi`

**How 72 is reached:**
- 15 base features as-is
- 12 signals × 4 rolling stats (3d-mean, 3d-std, 7d-mean, 7d-std) = **48 rolling features**
- 7 key signals × delta vs 7-day mean = **7 delta features**
- 2 temporal features: `dim_phase` (DIM binned into 6 lactation phases) + `thi_stress_flag` (binary, THI ≥ 72)

15 + 48 + 7 + 2 = **72 features**

At live inference time, the backend maps ESP8266 sensor readings and MongoDB time-series to this schema. Missing values are handled by XGBoost's native NaN support.

---

**Q14. Why do you have both a 7-day and 14-day forecast?**

They serve different use cases. The 7-day forecast is operationally precise — it's used to trigger immediate preparation steps like scheduling a veterinarian, pre-positioning CMT kits, isolating the milking sequence. The 14-day forecast is a lookahead signal used for herd-level planning — adjusting feeding protocols, scheduling prophylactic herd assessments, and allocating veterinary visits. Using both together provides a temporal gradient: if an animal is HIGH on 7d but LOW on 14d it suggests an acute, fast-developing situation; HIGH on both suggests persistent systemic stress.

---

**Q15. How do you explain predictions to a farmer who doesn't understand probability?**

We use three layers of explanation:

1. **Qualitative labels:** Risk is always expressed as No Risk / Low / Moderate / High — never as a raw probability shown to the end user.

2. **Contributing factor list:** The backend extracts top-N feature importances (using XGBoost's `feature_importances_`) and strips ColumnTransformer prefixes to produce clean names. Example: `"SCC is contributing upward pressure to the predicted risk."`, `"Rumination has changed relative to the recent 7-day baseline."`

3. **SHAP TreeExplainer (for forecasting models):** For the 7d/14d models, we use SHAP values to identify which temporal features drove the prediction. Each feature maps to a human-readable sentence (defined in `_EXPLANATION_MAP` and `_PREFIX_MAP` in `forecast_engine.py`). Up to 8 explanation strings are returned per forecast.

4. **Actionable recommendation:** Every risk response includes a `recommended_action` field with concrete instructions — no jargon, specific steps, specific time windows.

---

**Q16. How does the udder image analysis work?**

Two different YOLO models depending on species:

- **Cow:** YOLOv8 **classify** model (`best.pt`, `imgsz=224`). Returns `result.probs.top1` (class ID), `result.probs.top1conf` (confidence), `result.names[class_id]` (label). Disease class labels (mastitis, infected, swollen, etc.) map to `swelling` and `redness` scores in the CVResultSchema; healthy maps to near-zero indicators.

- **Buffalo:** YOLOv8 **segment** model (`buffalo_udder_segmentation.pt`, `imgsz=640`, `conf=0.25`). Returns segmentation masks + bounding boxes. Each detected segment's `class_name` maps to a specific indicator (swelling, redness, lesions, discharge). Overall confidence = maximum detected segment confidence.

YOLO inference runs **synchronously** before the upload response is returned — so the farmer receives a populated `cv_result` immediately (not a delayed async result). This takes 0.5–2 seconds on CPU, which is acceptable for a manual upload action.

The output is stored as a `CVResultSchema` with 6 fields: `swelling`, `asymmetry`, `redness`, `lesions`, `discharge`, `confidence` — each as a float 0.0–1.0. Values ≥ 50% are highlighted in amber on the frontend.

---

**Q17. What is the rule-based fallback and why does it exist?**

The `RuleBasedRiskEngine` is a fully independent scoring engine that runs if the ML models are unavailable (model files missing, xgboost not installed, inference failure). It applies 5 weighted rules:

| Rule | Trigger | Weight |
|------|---------|--------|
| Activity drop | z-score < −1.5 (7-day baseline) | 0.30 |
| Rumination drop | z-score < −1.0 | 0.20 |
| Surface temp elevation | z-score > +1.0 | 0.20 |
| THI elevation | ≥ 68°C (partial), ≥ 72°C (full) | 0.20 |
| CMT positive | 1+=0.4, 2+=0.7, 3+=1.0 | 0.10 |

This ensures the system works end-to-end for demonstration even without trained models installed. Every stored risk score records `model_version` — either `"gorakshak_cow_clinical_v2"` (real ML) or `"rule_based_v1"` (fallback) — so anyone reviewing the data always knows which engine produced each prediction.

---

**Q18. What is the THI formula you use, and why?**

THI (Temperature-Humidity Index) is the standard metric for heat stress in dairy cattle. We use the NRC livestock formula:

```
THI = 1.8 × T + 32 − (0.55 − 0.0055 × RH%) × (1.8 × T − 26.8)
```

where T = ambient temperature (°C) and RH% = relative humidity (0–100).

This formula — unlike the Thom comfort index — is calibrated to the thermoregulatory physiology of dairy cattle and produces values on the 60–90 scale used in global dairy research. At T=29°C, RH=68% it produces THI ≈ 79.7, which falls in the "mild heat stress" zone. Thresholds:
- THI ≥ 68 → Elevated heat stress (elevated susceptibility to mastitis)
- THI ≥ 72 → Critical heat stress (immune suppression, maximum mastitis risk amplification)
- THI ≥ 68 → Triggers Twilio SMS alert to the farmer

---

## SECTION 4 — System Architecture & Engineering

---

**Q19. What is the overall system architecture?**

```
[Collar: MPU6050 + DS18B20 + MAX9814 + SHT31-D]
        ↓
[ESP8266/ESP32 gateway]
        ↓ (HTTP POST, JSON)
[FastAPI Backend — port 8000]
   ├── Ingest Layer    → POST /api/v1/ingest/esp8266 (no auth)
   │                  → POST /api/v1/ingest/sensor   (JWT auth)
   ├── Feature Eng.   → THI computation, 7-day rolling baselines, z-score deviations
   ├── ML Risk Engine → MLRiskEngine (XGBoost) → RuleBasedRiskEngine (fallback)
   ├── Forecast Engine → 7d/14d XGBoost + SHAP explanations
   ├── CV Service     → YOLO classify (cow) / segment (buffalo) on udder images
   ├── Alert Engine   → Escalation + 6-hour timeout re-alert + auto-resolution
   └── REST API Layer → consumed by React dashboard + mobile app
        ↓
[MongoDB — sensor_readings, risk_scores, alerts, baselines, animals, farms, udder_images]
        ↓
[React/TypeScript Frontend — port 3000/3002]
```

---

**Q20. What tech stack did you use?**

**Backend:** Python 3.10+, FastAPI (async), Motor (async MongoDB driver), Pydantic v2, python-jose (JWT), passlib[bcrypt], APScheduler, Twilio via httpx

**ML/AI:** XGBoost ≥ 2.0, scikit-learn ≥ 1.4.0, joblib, ultralytics ≥ 8.2.0 (YOLOv8), SHAP ≥ 0.45.0, NumPy, Pandas

**Database:** MongoDB (Motor async driver). Collections: `users`, `farms`, `animals`, `sensor_readings`, `manual_lab_data`, `udder_images`, `risk_scores`, `alerts`, `baselines`

**Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS v4, react-router-dom v7, recharts (charts), lucide-react (icons), motion (animations), @google/genai (Gemini integration)

**Infrastructure:** Docker (MongoDB), uvicorn ASGI server, Vite dev server

---

**Q21. What are all the API endpoints your backend exposes?**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/health` | Health check + ML model load status | None |
| POST | `/api/v1/auth/login` | Login → JWT | None |
| POST | `/api/v1/auth/register` | Register user | None |
| GET | `/api/v1/auth/me` | Current user profile | JWT |
| POST | `/api/v1/farms` | Create farm | JWT Admin |
| GET | `/api/v1/farms` | List farms | JWT |
| GET | `/api/v1/farms/{id}` | Get farm | JWT |
| PUT | `/api/v1/farms/{id}` | Update farm | JWT |
| DELETE | `/api/v1/farms/{id}` | Delete farm | JWT Admin |
| GET | `/api/v1/farms/{id}/summary` | Herd summary by risk level | JWT |
| POST | `/api/v1/animals` | Create animal | JWT |
| GET | `/api/v1/animals` | List animals (filter by species/risk) | JWT |
| GET | `/api/v1/animals/{id}` | Get animal profile | JWT |
| PUT | `/api/v1/animals/{id}` | Update animal | JWT |
| GET | `/api/v1/animals/{id}/sensor-history` | Sensor reading time-series | JWT |
| GET | `/api/v1/animals/{id}/risk-history` | Risk score history | JWT |
| GET | `/api/v1/animals/{id}/risk` | Current risk assessment | JWT |
| **POST** | **`/api/v1/ingest/esp8266`** | **ESP8266 direct device ingest** | **None** |
| POST | `/api/v1/ingest/sensor` | Batch sensor ingest (gateway) | JWT |
| POST | `/api/v1/ingest/manual-lab` | CMT/SCC/pH/EC/milk data entry | JWT |
| POST | `/api/v1/ingest/udder-image` | Udder photo + YOLO inference | JWT |
| GET | `/api/v1/ingest/udder-image/{id}` | Fetch stored udder image record | JWT |
| POST | `/api/v1/risk/compute` | Run ML risk engine (single/all animals) | JWT |
| POST | `/api/v1/risk/forecast/{animal_id}` | 7d/14d XGBoost forecast + SHAP | JWT |
| GET | `/api/v1/risk/model-status` | ML model load status all 7 models | JWT |
| GET | `/api/v1/risk/farms/{id}/alerts` | List alerts (filter status/severity) | JWT |
| PATCH | `/api/v1/risk/alerts/{id}` | Acknowledge / resolve / false-positive | JWT |

---

**Q22. How does your alert system work?**

An alert is generated when:
1. An animal has no previous alerts AND new risk level is not "no_risk"
2. Risk **escalates** to a higher level (no_risk < low < moderate < high)
3. An existing alert has been open for **≥ 6 hours** AND risk is still elevated (prevents missed re-alerts)

An alert is NOT generated for the same standing risk level — prevents notification spam for chronic cases.

Alert **auto-resolves** when an animal's risk drops to "no_risk" — all open alerts get `status=resolved`, `resolved_at=now`.

Alert statuses: `open` → `acknowledged` / `resolved` / `false_positive`

Severity mapping: high→critical, moderate→medium, no_risk/low→low.

A separate **SMS alert** fires on any sensor ingest where THI ≥ 68 (configurable), sending the farmer a Twilio SMS with the animal tag, THI, temperature, and humidity.

---

**Q23. How does your system handle multiple farms and multiple users?**

The system is multi-tenant with three user roles:

- **Admin:** Can create/delete farms, see all farms, create users
- **Vet:** Can access their assigned farm, enter lab data, view/acknowledge alerts
- **Farmer:** Can access their assigned farm, view animals and risks

Every API endpoint verifies farm access: a JWT token includes the user's `farm_id` and `role`; `require_farm_access()` and `require_animal_farm_access()` middleware functions enforce that users can only access data within their assigned farm (or all farms for admins). There is zero cross-farm data leakage by design.

---

**Q24. Does your system work offline or with intermittent connectivity?**

The ingest endpoint accepts **client-provided timestamps** (`recorded_at` in the sensor payload or `timestamp` in the ESP8266 payload). If the ESP8266 loses connectivity, it can buffer readings locally and batch-upload when connectivity resumes. Each reading is stored with both `recorded_at` (device time) and `received_at` (server time). The gateway can batch up to N readings per POST request using the `/api/v1/ingest/sensor` endpoint. The ESP8266 endpoint accepts single readings for simplicity.

---

**Q25. How do you ensure the system doesn't fabricate data?**

This is a first-class design principle called "Honest by Design" across the entire codebase:

1. **Surface temp is never called body temp** — `surface_temp_c` vs `body_temp_c` are distinct fields; the collar probe is always labeled as surface temperature.
2. **Rumination is always "AI-inferred"** — the label `rumination_inferred_min` never appears without the "inferred" qualifier.
3. **Insufficient data returns null, never a guess** — `extract_features_for_risk_engine()` returns `None` if there are no sensor readings in the window; the API returns `status: "no_data"` rather than a fabricated score.
4. **Model version is stored on every risk score** — you can always audit which model or rule version produced a given prediction.
5. **Forecasting disclaimers are hard-coded into every forecast response** — `"data_disclaimer": "Forecasting models were trained on synthetic development data and are not clinically validated."` is returned in every forecast API response.
6. **`is_forecast` flag** — the rule-based engine always sets `is_forecast=False`, `forecast_horizon_days=None`. Only a genuine forecasting model can set these to `True` and a non-null horizon.

---

## SECTION 5 — Frontend & User Experience

---

**Q26. How does the frontend work, and what does a farmer see?**

The frontend is a React 19 + TypeScript web application. It has two modes:

- **Demo Mode** (`VITE_DEMO_MODE=true`): Uses locally stored mock data to demonstrate UI flows without a running backend. Suitable for offline presentations.
- **Live Mode** (`VITE_DEMO_MODE=false`): Connects to the FastAPI backend at `VITE_API_BASE_URL`. Every data point comes from real sensor readings and real ML model outputs.

Key pages a farmer uses:
- **Dashboard:** Herd overview — all animals sorted by risk level, open alert count, species distribution, "Refresh Signals" button triggering ML recomputation for all animals
- **Animal Details:** Individual animal profile with 5 tabs: AI Health Signals, Live Sensor Data, Milk Records, CMT/Health, Risk History
- **AI Health Signals tab:** Shows three independent AI model signals (Model 1: current screening + 7d/14d forecast, Model 2: udder image CV result, Model 3: behavioral signal) — **never merged, never averaged**
- **Udder Analysis:** Upload a photo, YOLO model runs synchronously, result shown immediately with amber highlights for indicators ≥ 50%
- **Alerts:** Filterable list of all open/acknowledged/resolved alerts

---

**Q27. How is the AI result shown to the farmer without confusing them?**

Five design choices:
1. **Qualitative labels only** — "No Risk", "Low Signal", "Elevated Signal", "Strong Signal" — farmers never see raw probability values
2. **Color coding** — green/blue/amber/red for risk levels, consistent throughout the app
3. **Plain-language recommendations** — "Perform a 4-quarter CMT paddle test within 24 hours", not "The posterior beta-d-galactosidase concentration suggests..."
4. **Separate signals clearly labeled** — the three AI models (sensor risk, udder image, behavior) are shown in separate expandable sections, explicitly labeled as "independent, non-merged signals"
5. **Persistent disclaimer** — a fixed `ScientificDisclaimer` component is shown on all AI-related screens, stating that the system is screening/decision support, not diagnosis

---

**Q28. What languages does the app support?**

The frontend has a complete i18n (internationalization) layer with translations in three languages:
- **English** (default)
- **Hindi** (हिन्दी)
- **Marathi** (मराठी)

All UI strings are defined in `src/i18n/translations.ts` and accessed via a `useApp()` context hook that returns the `t` translation object. No hardcoded strings appear in UI components. Language can be switched from the user profile settings.

---

## SECTION 6 — Data, Validation & Ethics

---

**Q29. Is your ML model clinically validated?**

**No, and we are transparent about this.** All forecasting models carry hard-coded disclaimers in the API response, training scripts, and PRD:

> "Forecasting models were trained on synthetic development data and are not clinically validated. Output is decision support only, not diagnosis."

The `joblib` model packages store `"clinical_validation": False`. This is intentional — we are a student hackathon team building a proof-of-concept screening tool. The appropriate next step before any production deployment would be a prospective clinical trial at an actual dairy farm (like Farm 01, Vaishanavi Dairy) to measure sensitivity, specificity, and net benefit at the proposed treatment thresholds.

---

**Q30. What dataset is your reference farm based on?**

**Farm 01 — Vaishanavi Dairy:** 14 cows + 30 buffaloes, 44 animals total. Tag IDs: `F01_COW_001` through `F01_COW_014` and `F01_BUF_001` through `F01_BUF_030`. A one-time import script inserts this as the seed dataset. Any field not present in source data is stored as `NULL` — never guessed or defaulted. This applies to breed, age, lactation number, previous mastitis history, and all other metadata fields.

---

**Q31. How do you handle the class imbalance problem in training?**

The mastitis event rate in real-world data is typically 15–25%. We use `scale_pos_weight = negative_count / positive_count` in XGBoost, which is the recommended approach for binary imbalanced classification. For the forecasting models, this ratio is computed separately for the 7d and 14d targets and printed at training time. The optimization metric is `eval_metric="aucpr"` (Precision-Recall AUC) rather than accuracy or log-loss, which is more appropriate for imbalanced classes.

---

**Q32. Could a farmer misuse this system and rely on it instead of a veterinarian?**

This is why every risk output includes `is_forecast=False/True` and the `data_disclaimer` field, and why the frontend prominently displays the `ScientificDisclaimer` component. The system is explicitly framed as a **screening and triage tool** — it tells the farmer *which animal to look at first*, not whether that animal has mastitis. All "high risk" recommendations say "Immediate veterinary examination recommended" — they direct the user toward veterinary confirmation, not away from it. The CMT test and udder photo features in the CONFIRM step are explicitly designed to integrate human expert judgment into the workflow.

---

## SECTION 7 — Testing & Reliability

---

**Q33. How did you test the end-to-end pipeline?**

Three levels:

1. **Unit/Integration tests** (`tests/test_full_system.py`): 91 tests covering all import checks, configuration, model loading, ML engine routing, forecast feature construction, udder CV service, feature engineering (THI, baselines, deviations), and all API endpoints via FastAPI TestClient with live MongoDB. 91/91 pass.

2. **ESP8266 pipeline test** (`test_esp8266_pipeline.py`): Standalone 4-step validation that runs against the live backend without any test framework dependency. Step 1: API accepts payload, Step 2: Data stored in DB, Step 3: ML engine receives data, Step 4: Prediction returned. Run live and all 4 passed (ML engine: `gorakshak_cow_clinical_v2`, risk_level: `no_risk`, score: 0.0003).

3. **Live `/health` endpoint** permanently reports ML model load status for all 7 models. If any model fails to load, it's immediately visible.

---

**Q34. What happens if MongoDB is down?**

The backend fails to start (the `init_db()` call in the FastAPI lifespan does a `db.command("ping")` to verify connection before accepting requests). This is a deliberate design choice — a backend that accepts sensor data without a working DB would silently lose data. The gateway-side ESP8266 can buffer readings locally and retry the HTTP POST.

---

**Q35. What happens if the ML models fail to load?**

The `model_loader.py` uses a graceful degradation approach: failures are logged as warnings, not exceptions. The backend **continues to start and serve requests**. Any call to `POST /api/v1/risk/compute` automatically falls back to `RuleBasedRiskEngine` and stores `model_version = "rule_based_v1"` so the fallback is always auditable. The `/health` endpoint shows which models loaded successfully and which failed with the exact error message.

---

## SECTION 8 — Scalability & Roadmap

---

**Q36. Can this scale beyond one farm?**

The data model is fully multi-farm from day one. Every animal, sensor reading, risk score, and alert is associated with a `farm_id`. Access control is farm-scoped. Adding a new farm is a single `POST /api/v1/farms` call; adding animals is an animal CRUD operation. The current MVP targets small farms of 30–100 animals on a single VM; the same architecture can be deployed on a cloud instance (MongoDB Atlas + managed hosting) to serve hundreds of farms.

---

**Q37. What future enhancements are planned?**

1. **MQTT support** — instead of HTTP polling from the gateway, use MQTT pub/sub for lower latency and better edge connectivity
2. **Mobile app** — React Native app for farmers in the field (API layer already built)
3. **GIS hotspot mapping** — geographic clustering of high-risk animals across multiple farms (schema supports lat/lon already)
4. **Model 3 (behavior) live API** — currently the behavior signal is computed offline; adapting `behavior_inference_v1.py` to query MongoDB live is the next ML integration task
5. **On-device edge inference** — run a quantized version of the risk model on the ESP32 itself for zero-latency local alerts
6. **Clinical validation study** — prospective trial at Vaishanavi Dairy to compute real sensitivity/specificity metrics

---

**Q38. What is the estimated cost of one collar unit?**

| Component | Approx. Cost (INR) |
|-----------|-------------------|
| MPU6050 (accelerometer) | ₹30 |
| DS18B20 (temperature) | ₹40 |
| MAX9814 (microphone) | ₹80 |
| SHT31-D (temp + humidity) | ₹150 |
| ESP8266 microcontroller | ₹120 |
| PCB, housing, battery, strap | ~₹300 |
| **Total per collar** | **~₹720 (≈ US$9)** |

This is approximately 15–20× cheaper than commercial livestock monitoring collars currently available in India (₹10,000–15,000 per unit).

---

## SECTION 9 — Quick-Fire Questions

---

**Q. What is your project name and problem ID?**
GoRakshak — गो रक्षक (Cow Guardian). SIH Problem ID: **SIH26109**. Team: **Team InnovX**.

**Q. What does "GoRakshak" mean?**
In Sanskrit/Hindi: *Go* (गो) means cow, *Rakshak* (रक्षक) means guardian or protector. "Cow Guardian."

**Q. What port does the backend run on?**
`8000`. Frontend: `3000` (or next available port). MongoDB: `27017`.

**Q. What is the base URL for the API?**
`http://localhost:8000` locally. All API routes are under `/api/v1/`.

**Q. What makes your model "multi-species aware"?**
Species routing in the ML engine: `species == "buffalo"` → `gorakshak_buffalo_v2` pipeline; `species == "cow"` → `gorakshak_cow_clinical_v2` (preferred) or `gorakshak_cow_milk_v2` (fallback). YOLO routing: cow → YOLOv8 classify, buffalo → YOLOv8 segment. Buffalo receive a species-specific epidermal adjustment in the rule engine (buffaloes have higher skin pigmentation and thicker epidermis, so the same surface temp elevation is clinically more significant than in cows).

**Q. What does "SHAP" stand for and how do you use it?**
SHapley Additive exPlanations. For the forecasting models, we use `shap.TreeExplainer` (optimized for XGBoost trees) to compute per-feature SHAP values on each prediction. The top-5 features by absolute SHAP value are mapped to human-readable explanation strings. If a feature's SHAP value is positive (pushing risk higher), its explanation text is included in the response. Up to 8 explanation strings are returned per forecast.

**Q. What is CMT?**
California Mastitis Test — a simple on-farm biochemical test where milk from each quarter is mixed with a surfactant reagent. Negative = no reaction (normal). Positive grades: Trace, 1+, 2+, 3+ based on gel formation strength. It detects elevated somatic cell count (SCC) — the hallmark of mastitis-related inflammation. Our system treats 2+ and 3+ as confirmatory evidence of subclinical mastitis.

**Q. What is SCC?**
Somatic Cell Count — the number of white blood cells per milliliter of milk. Normal: <200,000 cells/mL. Subclinical mastitis: >200,000. Clinical mastitis: often >1,000,000. Our backend stores `scc_value` and `scc_unit` and uses it as a high-weight feature in the ML classification models.

**Q. What is THI and what range indicates danger?**
Temperature-Humidity Index — a single number combining ambient temperature and humidity into a heat stress index for dairy cattle. Scale: <68 = no stress, 68–72 = mild stress, 72–80 = moderate, >80 = severe. Heat stress suppresses the immune system, directly increasing mastitis susceptibility. We compute it on every sensor reading using the NRC livestock formula and store it alongside the reading.

**Q. What is the difference between "screening" and "forecasting"?**
**Screening** (current-state): The ML classification models look at the current sensor window (last 7 days) and classify whether the animal has elevated risk *right now*. `is_forecast=False`. **Forecasting** (forward-looking): The 7d/14d XGBoost models look at the rolling temporal trajectory and estimate the probability of mastitis *occurring in the next N days*. `is_forecast=True`, `forecast_horizon_days=7 or 14`. Both are provided, clearly labeled, and never conflated.

---

*Document generated from live codebase. All technical claims are directly traceable to source files.*
