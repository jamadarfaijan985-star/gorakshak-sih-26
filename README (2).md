# GoDrishti 🐄

## AI-Powered Dairy Livestock Health Intelligence

GoDrishti is a multimodal AI + IoT decision-support platform designed for Indian dairy farms.

It continuously monitors animal and environmental signals, identifies changing risk patterns, prioritizes animals that need attention, integrates available diagnostic information, and provides animal-level and herd-level health intelligence.

> **From hidden signals to early insight.**

---

## 🎯 Vision

Help farmers move from reactive livestock care to continuous, data-driven early-risk screening.

GoDrishti is designed to support:

- 🐄 Cows
- 🐃 Buffaloes
- 🌾 Smallholder dairy farms
- 🏭 Connected/organized dairy farms
- 📱 Mobile-first farm monitoring
- 🤖 AI-assisted decision support
- 📡 IoT-based continuous monitoring

---

## 🚀 Core Workflow

```text
SENSE
  ↓
SCREEN
  ↓
PRIORITIZE
  ↓
CONFIRM
  ↓
ACT
```

### 1. SENSE

Low-cost IoT sensors continuously collect animal and environmental signals.

### 2. SCREEN

AI analyzes changing patterns and animal-specific deviations.

### 3. PRIORITIZE

Animals showing elevated risk are prioritized for further attention.

### 4. CONFIRM

Targeted assessment can include:

* Udder image assessment
* CMT
* Milk observations
* Laboratory information
* Manual clinical observations

### 5. ACT

The platform provides actionable decision-support information for farmers and veterinary teams.

---

# 🧠 Key Capabilities

## Animal Health Monitoring

GoDrishti manages:

* Animal profiles
* Breed and age
* Lactation information
* Disease history
* Vaccination records
* Treatment history
* Health records
* Milk observations
* Udder observations

---

## 📡 IoT Sensor Monitoring

The system can integrate continuous sensor signals including:

### MPU6050

Used for:

* Movement
* Acceleration
* Activity patterns

### DS18B20

Used for:

* Surface/skin temperature

> DS18B20 should not be described as measuring core body temperature.

### MAX9814 Microphone

Captures chewing-related acoustic signals.

AI can use these signals to infer:

* Rumination behaviour
* Behavioural changes

### SHT31-D

Measures:

* Ambient temperature
* Relative humidity

These values can be used to derive:

* Temperature Humidity Index (THI)

---

# 🤖 Multimodal AI

GoDrishti combines multiple information sources instead of relying on a single sensor.

Possible inputs include:

```text
IoT Sensor Signals
        +
Animal History
        +
Behavioural Signals
        +
Environmental Data
        +
Milk Data
        +
CMT / Laboratory Data
        +
Udder Image Information
        ↓
Multimodal Risk Engine
        ↓
Animal Risk + Herd Risk + Risk Trend
        ↓
Recommended Action
```

---

# 🔎 Early-Risk Screening

The system looks for changing patterns such as:

* Activity deviation
* AI-inferred rumination deviation
* Surface-temperature deviation
* Environmental stress
* Historical health patterns
* Milk-related observations
* Udder visual information

A single abnormal value is not treated as a diagnosis.

The system combines multiple signals to generate an early-risk screening signal.

---

# 🩺 Udder Assessment

When an animal is prioritized, the farmer can capture an udder image using a smartphone.

Udder-image analysis is used as a **supporting multimodal feature**.

It is not intended to replace:

* Veterinarians
* Laboratory testing
* CMT
* Clinical examination

---

# 📊 Risk Intelligence

GoDrishti can organize animals into risk categories:

| Risk Level       | Meaning                                |
| ---------------- | -------------------------------------- |
| 🟢 No Risk       | No elevated screening signal           |
| 🟡 Low Risk      | Low-level signal requiring observation |
| 🟠 Moderate Risk | Increased attention recommended        |
| 🔴 High Risk     | Targeted confirmation recommended      |

Risk results can include:

* Individual animal risk
* Herd-level risk
* Risk trend
* Contributing signals
* Recommended actions

---

# 🐄 Herd Intelligence

GoDrishti is designed to move beyond individual-animal monitoring.

The herd view can provide:

* Total livestock
* Risk distribution
* High-risk animals
* Risk trends
* Farm-level risk
* Potential risk clusters
* Management recommendations

Example:

```text
Total Herd: 44

No Risk       → 30
Low Risk      → 7
Moderate Risk → 5
High Risk     → 2
```

This allows farmers to focus attention where it is most needed.

---

# 📅 7–14 Day Forecasting

The architecture is designed for temporal mastitis-risk forecasting over a 7–14 day horizon.

Conceptually:

```text
Historical Signals
       ↓
Day -14
       ↓
Day -13
       ↓
Day -12
       ↓
   ...
       ↓
Day -1
       ↓
Future Risk
```

### Important

The 7–14 day forecasting capability is an architectural target undergoing validation with longitudinal field data.

It should not be presented as clinically proven unless supported by validated field evidence.

---

# 🌾 Farm Resource Modes

GoDrishti is designed for different farm resource levels.

## Low-Resource Farm

Possible inputs:

* IoT collar
* Smartphone
* Animal history
* Manual observations
* Milk yield when available
* CMT when available

The farmer does not necessarily need:

* SCC machine
* pH meter
* EC meter
* Automated milking system

## Connected Farm

Additional integrations may include:

* SCC
* EC
* pH
* Automated milk yield
* Farm-management software
* Laboratory records
* Additional sensors

More available data can improve the system, but every data source is not mandatory for operation.

---

# 🏗️ System Architecture

```text
                 ┌──────────────────────┐
                 │     Dairy Animal     │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │    IoT / Sensors     │
                 │ MPU6050              │
                 │ DS18B20              │
                 │ MAX9814              │
                 │ SHT31-D              │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │ Communication Layer  │
                 │ Wireless / IoT Data  │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │      Backend         │
                 │ API + Data Pipeline  │
                 └──────────┬───────────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
        Sensor Data     Farm Data      Manual Data
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                 ┌──────────────────────┐
                 │    Multimodal AI     │
                 │ Risk / Forecasting   │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   GoDrishti Web App  │
                 │ Dashboard / Alerts   │
                 │ Analytics / Reports  │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │ Farmer / Veterinarian│
                 └──────────────────────┘
```

---

# 💻 Platform

GoDrishti includes a complete application workflow:

```text
Landing Page
     ↓
Login
     ↓
Dashboard
     ↓
Animals
     ↓
Live Monitoring
     ↓
Analytics
     ↓
Alerts
     ↓
Milk Data
     ↓
CMT / Lab Tests
     ↓
Health Records
     ↓
Udder Analysis
     ↓
Devices
     ↓
Reports
     ↓
Farm Map / GIS
     ↓
Settings
```

---

# 🖥️ Dashboard

The dashboard provides a centralized view of:

* Herd overview
* Animal count
* Risk status
* IoT device status
* Live sensor information
* Alerts
* Risk screening
* Quick operational actions

The frontend is designed as a real application rather than a visual-only prototype.

---

# 🔐 Authentication

GoDrishti includes authentication for secure application access.

The existing backend provides authentication functionality and should remain the source of truth for frontend integration.

---

# ⚙️ Technology Stack

## Frontend

* HTML5
* CSS3
* JavaScript
* Responsive UI
* Mobile-first design
* Data visualization

## Backend

* Python
* FastAPI
* REST APIs
* Database integration
* Authentication
* Sensor ingestion
* Risk computation

## AI / ML

* Multimodal signal processing
* Time-series analysis
* Behaviour analysis
* Risk forecasting
* Image-based udder assessment

## IoT

* ESP-based controller
* MPU6050
* DS18B20
* MAX9814
* SHT31-D
* Wireless communication

---

# 📱 Responsive Design

The application is designed for:

* Desktop
* Tablet
* Mobile phones

Mobile interfaces prioritize:

* Clear navigation
* Large touch targets
* Readable risk information
* Responsive cards
* Compact data visualization
* Low-resource usability

---

# 🌐 Existing Backend

GoDrishti uses an existing FastAPI backend architecture.

Core backend concepts include:

* Authentication
* Farm isolation
* Animal management
* Sensor ingestion
* Manual laboratory data
* Risk computation
* Alerts
* Herd summaries
* Feature engineering
* Multi-animal support
* Multi-farm support

Existing backend APIs should be reused rather than duplicated.

---

# 📂 Suggested Project Structure

```text
GoDrishti/
│
├── frontend/
│   ├── index.html
│   ├── login/
│   ├── dashboard/
│   ├── animals/
│   ├── monitoring/
│   ├── analytics/
│   ├── alerts/
│   └── assets/
│
├── backend/
│   ├── app/
│   ├── core/
│   ├── db/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── api/
│
├── ai/
│   ├── models/
│   ├── preprocessing/
│   ├── inference/
│   └── forecasting/
│
├── iot/
│   ├── firmware/
│   └── sensor-integration/
│
├── docs/
│   ├── architecture/
│   ├── screenshots/
│   └── research/
│
├── README.md
├── LICENSE
└── .gitignore
```

---

# 🔄 Data Flow

```text
Animal
  ↓
Sensors
  ↓
ESP Controller
  ↓
Wireless Communication
  ↓
Backend API
  ↓
Data Processing
  ↓
AI / Risk Engine
  ↓
Database
  ↓
Dashboard
  ↓
Alert / Recommendation
  ↓
Farmer Action
```

---

# 🧪 Validation & Data Integrity

GoDrishti follows strict data-integrity principles.

The system should never fabricate:

* Dataset size
* Accuracy
* Clinical validation
* Mastitis labels
* Sensor capabilities
* Hardware performance
* AI results
* Cost
* Field-validation results

Missing information should be explicitly marked as missing.

---

# ⚠️ Scientific Disclaimer

GoDrishti is an **early-risk screening and decision-support platform**.

It does not claim to:

* Diagnose mastitis independently
* Replace veterinarians
* Replace laboratory testing
* Replace CMT
* Replace SCC testing
* Replace clinical examination

AI-generated risk information should support—not replace—professional veterinary decision-making.

---

# 🌱 Why GoDrishti?

Traditional livestock monitoring can depend heavily on periodic observation and testing.

GoDrishti focuses on:

```text
Continuous Monitoring
        +
Multimodal Data
        +
AI-Assisted Screening
        +
Targeted Confirmation
        +
Actionable Intelligence
```

The goal is to help farmers focus limited time and diagnostic resources on animals that require attention.

---

# 👥 Team InnovX

| Member   | Responsibility                            |
| -------- | ----------------------------------------- |
| Saif     | System Architecture & Integration         |
| Abubakar | Hardware / Embedded Systems / Electronics |
| Farhan   | AI / ML / Signal Processing               |
| Ayan     | Backend / Data Pipeline / Deployment      |
| Faizan   | Frontend / UI/UX / Documentation          |
| Soha     | Research / Documentation / Presentation   |

---

# 📌 Project Status

### Current Development Focus

* [x] Landing Page
* [x] Authentication
* [x] Dashboard
* [x] Responsive UI
* [x] Animal Management
* [x] Sensor Monitoring Architecture
* [x] Risk Screening Architecture
* [x] Herd Intelligence
* [x] Alert Architecture
* [ ] Complete field-data validation
* [ ] Longitudinal 7–14 day validation
* [ ] Full-scale deployment validation

---

# 🔮 Future Scope

* Larger longitudinal datasets
* More farms and animals
* Improved temporal forecasting
* Additional IoT sensors
* Advanced GIS risk mapping
* Multilingual farmer interface
* Offline-first workflows
* Veterinary collaboration
* Larger-scale herd deployment

---

# 🤝 Contribution

Contributions, suggestions, testing feedback and technical improvements are welcome.

For major changes, please discuss the proposed architecture or implementation approach before submitting changes.

---

# 📄 License

This project is currently developed as an InnovX project.

Add the final project license here before public production release.

---

## GoDrishti

### From Hidden Signals to Early Insight.

**Continuous livestock intelligence for smarter dairy health management.**
