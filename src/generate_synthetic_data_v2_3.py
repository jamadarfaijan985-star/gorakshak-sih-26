
"""
GoRakshak SIH 2026
Synthetic Longitudinal Dataset Generator V2.3

Purpose:
- Build development-only 90-day longitudinal data for mastitis forecasting.
- Calibrate feature distributions from available REAL farm and PUBLIC datasets.
- Never use mastitis labels/diagnostic outcome columns to calibrate predictors.
- Clearly record calibration source: REAL / PUBLIC / ASSUMPTION.
- Generate 7-day and 14-day FUTURE mastitis development targets.
- Targets are synthetic development labels, NOT real epidemiological incidence.

Run from D:\GoRakshak:
    .\.venv\Scripts\activate
    python ai-ml\src\generate_synthetic_data_v2.py
"""

from pathlib import Path
import json
import math
import re
import warnings
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

SEED = 26109
rng = np.random.default_rng(SEED)

ROOT = Path(r"D:\GoRakshak")
REAL_ROOT = ROOT / "ai-ml" / "data" / "real"
PUBLIC_ROOT = ROOT / "ai-ml" / "data" / "public"
OUT_ROOT = ROOT / "ai-ml" / "data" / "synthetic"
OUT_ROOT.mkdir(parents=True, exist_ok=True)

N_ANIMALS = 300
N_DAYS = 90

# Actual audited real-farm species/farm structure:
# 41 cows, 53 buffaloes; F01=44, F02=27, F03=6, F04=11, F05=6.
FARM_COUNTS = {"F01": 44, "F02": 27, "F03": 6, "F04": 11, "F05": 6}
SPECIES_COUNTS = {"Cow": 41, "Buffalo": 53}

# This is a DEVELOPMENT assumption because real longitudinal onset labels do not exist.
# It is deliberately stored in the report and must not be described as observed incidence.
SYNTHETIC_EVENT_ANIMAL_RATE = 0.30

# Source weighting is only used when both real and public empirical observations exist.
# This is a development calibration choice, not a biological constant.
REAL_WEIGHT_WHEN_AVAILABLE = 0.60

FEATURES = [
    "age_years",
    "parity",
    "days_in_milk",
    "milk_yield_kg",
    "milk_temperature",
    "milk_pH",
    "milk_conductivity",
    "scc",
    "body_temperature",
    "rumination_min",
    "activity_index",
    "feed_intake",
    "ambient_temperature",
    "humidity",
    "thi",
]

ALIASES = {
    "animal_id": ["animal_id", "animalid", "cow_id", "cowid", "id"],
    "farm_id": ["farm_id", "farmid", "farm"],
    "species": ["species", "animal_species", "type"],
    "age_years": ["age_years", "age", "age_year"],
    "parity": ["parity", "lactation_number"],
    "days_in_milk": ["days_in_milk", "dim", "days after calving", "days_after_calving"],
    "milk_yield_kg": ["milk_yield_kg", "milk_yield", "yield_kg", "milk"],
    "milk_temperature": ["milk_temperature", "temperature_milk", "milk_temp"],
    "milk_pH": ["milk_ph", "ph", "milk_p_h"],
    "milk_conductivity": ["milk_conductivity", "conductivity_avg", "conductivity"],
    "scc": ["scc", "somatic_cell_count", "somaticcellcount"],
    "body_temperature": ["body_temperature", "body_temp", "temperature_body", "temperature"],
    "rumination_min": ["rumination_min", "rumination", "rumination_minutes"],
    "activity_index": ["activity_index", "activity", "activity_level", "activity_score"],
    "feed_intake": ["feed_intake", "feed_intake_robot", "feed_intake_kg"],
    "ambient_temperature": ["ambient_temperature", "ambient_temp", "air_temperature", "air_temp"],
    "humidity": ["humidity", "relative_humidity", "rh"],
    "thi": ["thi", "temperature_humidity_index", "heat_stress_index"],
}

def norm(x):
    return re.sub(r"[^a-z0-9]+", "_", str(x).strip().lower()).strip("_")

def find_col(df, aliases):
    normed = {norm(c): c for c in df.columns}
    for a in aliases:
        na = norm(a)
        if na in normed:
            return normed[na]
    # relaxed contains matching
    for c in df.columns:
        nc = norm(c)
        for a in aliases:
            na = norm(a)
            if na and (na in nc or nc in na):
                return c
    return None

def numeric_series(df, feature):
    c = find_col(df, ALIASES.get(feature, [feature]))
    if c is None:
        return pd.Series(dtype=float), None
    s = pd.to_numeric(df[c], errors="coerce").replace([np.inf, -np.inf], np.nan).dropna()
    return s, c

def read_csv_safe(path):
    try:
        return pd.read_csv(path, low_memory=False)
    except Exception:
        return None

def discover_real_files():
    files = {
        "animals": list(REAL_ROOT.rglob("animals.csv")),
        "milk": list(REAL_ROOT.rglob("milk_records.csv")),
        "environment": list(REAL_ROOT.rglob("environment_records.csv")),
    }
    return files

def discover_public_files():
    candidates = {}
    wanted = [
        "milking_robot_dataset_combined.csv",
        "cattle_milk_yield_1000.csv",
        "cow_milk_mastitis_harmonized.csv",
        "cow_clinical_mastitis_harmonized.csv",
        "buffalo_scm_core_harmonized.csv",
    ]
    for name in wanted:
        hits = list(PUBLIC_ROOT.rglob(name))
        if hits:
            candidates[name] = hits[0]
    return candidates

def combine_numeric_from_files(paths, feature):
    pieces = []
    used = []
    for p in paths:
        df = read_csv_safe(p)
        if df is None:
            continue
        s, c = numeric_series(df, feature)
        if len(s):
            pieces.append(s)
            used.append((str(p), c, len(s)))
    if pieces:
        return pd.concat(pieces, ignore_index=True), used
    return pd.Series(dtype=float), used

def robust_bounds(s, feature):
    s = pd.to_numeric(s, errors="coerce").dropna()
    if len(s) == 0:
        return None
    lo = float(s.quantile(0.001))
    hi = float(s.quantile(0.999))
    # physical safety guards only; these are not used to invent distributions
    guards = {
        "age_years": (1.0, 25.0),
        "parity": (0.0, 15.0),
        "days_in_milk": (1.0, 500.0),
        "milk_yield_kg": (0.1, 60.0),
        "milk_temperature": (30.0, 42.0),
        "milk_pH": (5.0, 8.5),
        "milk_conductivity": (0.1, 20.0),
        "scc": (0.0, 50000.0),
        "body_temperature": (35.0, 43.0),
        "rumination_min": (0.0, 1500.0),
        "activity_index": (0.0, 1000.0),
        "feed_intake": (0.0, 100.0),
        "ambient_temperature": (-10.0, 55.0),
        "humidity": (0.0, 100.0),
        "thi": (20.0, 100.0),
    }
    if feature in guards:
        lo = max(lo, guards[feature][0])
        hi = min(hi, guards[feature][1])
    return lo, hi

def empirical_sample(s, n, lo=None, hi=None, jitter=0.0):
    s = pd.to_numeric(s, errors="coerce").dropna().to_numpy(dtype=float)
    if len(s) == 0:
        return np.full(n, np.nan)
    vals = rng.choice(s, size=n, replace=True)
    if jitter > 0 and len(s) > 5:
        scale = float(np.std(s))
        vals = vals + rng.normal(0, jitter * max(scale, 1e-9), n)
    if lo is not None and hi is not None:
        vals = np.clip(vals, lo, hi)
    return vals

def parse_age(v):
    if pd.isna(v):
        return np.nan
    m = re.search(r"(\d+(?:\.\d+)?)", str(v))
    return float(m.group(1)) if m else np.nan

def load_real_animal_profiles(real_files):
    rows = []
    for p in real_files["animals"]:
        df = read_csv_safe(p)
        if df is None or df.empty:
            continue
        for _, r in df.iterrows():
            species = str(r.get(find_col(df, ALIASES["species"]), "")).strip()
            species = "Buffalo" if "buff" in species.lower() else "Cow" if "cow" in species.lower() else species
            farm = str(r.get(find_col(df, ALIASES["farm_id"]), "")).strip()
            age_col = find_col(df, ["age"])
            parity_col = find_col(df, ["parity"])
            rows.append({
                "farm_id": farm if farm else None,
                "species": species if species in ["Cow", "Buffalo"] else None,
                "age_years": parse_age(r.get(age_col)) if age_col else np.nan,
                "parity": pd.to_numeric(r.get(parity_col), errors="coerce") if parity_col else np.nan,
            })
    out = pd.DataFrame(rows)
    if out.empty:
        return out
    return out

def collect_calibration(real_files, public_files):
    cal = {}
    sources = {}
    file_map = {}

    real_all = real_files["milk"] + real_files["environment"]
    public_all = list(public_files.values())

    for f in FEATURES:
        real_s, real_used = combine_numeric_from_files(real_all, f)
        public_s, public_used = combine_numeric_from_files(public_all, f)

        if len(real_s) >= 10 and len(public_s) >= 10:
            cal[f] = {
                "real": real_s,
                "public": public_s,
                "source": "REAL+PUBLIC",
                "real_n": len(real_s),
                "public_n": len(public_s),
            }
        elif len(real_s) >= 10:
            cal[f] = {
                "real": real_s,
                "public": pd.Series(dtype=float),
                "source": "REAL",
                "real_n": len(real_s),
                "public_n": 0,
            }
        elif len(public_s) >= 10:
            cal[f] = {
                "real": pd.Series(dtype=float),
                "public": public_s,
                "source": "PUBLIC",
                "real_n": 0,
                "public_n": len(public_s),
            }
        else:
            cal[f] = {
                "real": real_s,
                "public": public_s,
                "source": "ASSUMPTION",
                "real_n": len(real_s),
                "public_n": len(public_s),
            }
        file_map[f] = {"real": real_used, "public": public_used}
        sources[f] = cal[f]["source"]

    return cal, sources, file_map


def source_series_for_feature(feature, public_files):
    """
    Build a defensible source pool for each feature.
    Important: generic 'temperature' is NOT accepted as body temperature.
    THI is derived from ambient temperature + humidity and is not sampled here.
    """
    preferred = {
        "age_years": [
            "cow_clinical_mastitis_harmonized.csv",
            "buffalo_scm_core_harmonized.csv",
        ],
        "parity": [
            "cow_clinical_mastitis_harmonized.csv",
            "buffalo_scm_core_harmonized.csv",
        ],
        "days_in_milk": [
            "milking_robot_dataset_combined.csv",
        ],
        "milk_yield_kg": [
            "milking_robot_dataset_combined.csv",
            "cow_milk_mastitis_harmonized.csv",
            "cattle_milk_yield_1000.csv",
        ],
        "milk_temperature": [
            "milking_robot_dataset_combined.csv",
            "cow_milk_mastitis_harmonized.csv",
        ],
        "milk_pH": [
            "cow_milk_mastitis_harmonized.csv",
        ],
        "milk_conductivity": [
            "milking_robot_dataset_combined.csv",
            "cow_milk_mastitis_harmonized.csv",
        ],
        "scc": [
            "cow_milk_mastitis_harmonized.csv",
            "milking_robot_dataset_combined.csv",
            "buffalo_scm_core_harmonized.csv",
        ],
        "body_temperature": [
            "cattle_milk_yield_1000.csv",
        ],
        "rumination_min": [
            "milking_robot_dataset_combined.csv",
            "cattle_milk_yield_1000.csv",
        ],
        "activity_index": [
            "milking_robot_dataset_combined.csv",
            "cattle_milk_yield_1000.csv",
        ],
        "feed_intake": [
            "milking_robot_dataset_combined.csv",
            "cattle_milk_yield_1000.csv",
        ],
        "ambient_temperature": [
            "cattle_milk_yield_1000.csv",
        ],
        "humidity": [
            "cattle_milk_yield_1000.csv",
        ],
    }

    paths = []
    for name in preferred.get(feature, []):
        p = public_files.get(name)
        if p is not None:
            paths.append(p)

    # Real farm environment records are valid for humidity, but their
    # temperature field is missing in the audited data. Real milk records
    # are valid for milk yield, but not for generic body temperature.
    if feature == "milk_yield_kg":
        paths = list(paths) + [p for p in list(REAL_ROOT.rglob("milk_records.csv"))]
    elif feature == "humidity":
        paths = list(paths) + [p for p in list(REAL_ROOT.rglob("environment_records.csv"))]

    return paths


def collect_calibration_v23(real_files, public_files):
    """
    V2.3 calibration policy:
    - feature-specific source selection avoids mixing incompatible scales;
    - real milk yield and real humidity are used when available;
    - body temperature is sourced only from an explicit body-temperature field;
    - THI is derived, never sampled independently.
    """
    cal = {}
    sources = {}
    file_map = {}

    for f in FEATURES:
        if f == "thi":
            # THI is calculated from generated ambient temperature and humidity.
            cal[f] = {
                "real": pd.Series(dtype=float),
                "public": pd.Series(dtype=float),
                "source": "DERIVED",
                "real_n": 0,
                "public_n": 0,
            }
            sources[f] = "DERIVED"
            file_map[f] = {"real": [], "public": []}
            continue

        paths = source_series_for_feature(f, public_files)

        # Split real/public so provenance remains explicit.
        real_paths = [p for p in paths if str(p).lower().startswith(str(REAL_ROOT).lower())]
        public_paths = [p for p in paths if str(p).lower().startswith(str(PUBLIC_ROOT).lower())]

        real_s, real_used = combine_numeric_from_files(real_paths, f)
        public_s, public_used = combine_numeric_from_files(public_paths, f)

        # For features with heterogeneous source scales, prefer the explicitly
        # selected feature-specific public pool. Real is combined only where
        # audited real observations exist and are semantically compatible.
        if len(real_s) >= 10 and len(public_s) >= 10:
            source = "REAL+PUBLIC"
        elif len(real_s) >= 10:
            source = "REAL"
        elif len(public_s) >= 10:
            source = "PUBLIC"
        else:
            source = "ASSUMPTION"

        cal[f] = {
            "real": real_s,
            "public": public_s,
            "source": source,
            "real_n": len(real_s),
            "public_n": len(public_s),
        }
        sources[f] = source
        file_map[f] = {"real": real_used, "public": public_used}

    return cal, sources, file_map


def v23_bounds(feature, cal_entry):
    """
    Use the selected feature-specific calibration pool.
    0.5%-99.5% bounds are less sensitive to extreme tails than V2.3's 0.1%-99.9%.
    """
    combined = pd.concat(
        [cal_entry["real"], cal_entry["public"]],
        ignore_index=True
    ).dropna()

    if len(combined) == 0:
        return None

    lo = float(combined.quantile(0.005))
    hi = float(combined.quantile(0.995))

    # Keep conservative physical guards.
    guards = {
        "age_years": (2.0, 20.0),
        "parity": (1.0, 8.0),
        "days_in_milk": (1.0, 300.0),
        "milk_yield_kg": (0.1, 45.8),
        "milk_temperature": (34.82, 38.92),
        "milk_pH": (6.0, 7.6),
        "milk_conductivity": (3.5, 8.0),
        "scc": (1.0, 500000.0),
        "body_temperature": (35.0, 43.0),
        "rumination_min": (0.0, 1000.0),
        "activity_index": (0.0, 300.0),
        "feed_intake": (0.0, 10.0),
        "ambient_temperature": (15.0, 40.0),
        "humidity": (30.0, 90.0),
    }
    if feature in guards:
        lo = max(lo, guards[feature][0])
        hi = min(hi, guards[feature][1])

    return lo, hi


def sample_feature_v23(feature, n, cal_entry):
    if feature == "thi":
        raise ValueError("THI must be derived, not sampled.")

    real_s = cal_entry["real"]
    public_s = cal_entry["public"]
    source = cal_entry["source"]

    if source == "REAL+PUBLIC":
        # Use real observations as the anchor, with public observations
        # supplying additional coverage rather than imposing equal weighting.
        n_real = int(round(n * 0.70))
        n_pub = n - n_real
        vals = np.concatenate([
            empirical_sample(real_s, n_real, jitter=0.005),
            empirical_sample(public_s, n_pub, jitter=0.005)
        ])
        rng.shuffle(vals)
    elif source == "REAL":
        vals = empirical_sample(real_s, n, jitter=0.005)
    elif source == "PUBLIC":
        vals = empirical_sample(public_s, n, jitter=0.005)
    else:
        vals = assumption_distribution(feature, n)

    b = v23_bounds(feature, cal_entry)
    if b:
        vals = np.clip(vals, b[0], b[1])

    return vals

def assumption_distribution(feature, n):
    # These are deliberately marked ASSUMPTION in the calibration report.
    # They are fallback development ranges only when empirical data is insufficient.
    params = {
        "age_years": (7.0, 3.0, 2.0, 17.0),
        "parity": (3.0, 2.0, 1.0, 10.0),
        "days_in_milk": (150.0, 90.0, 1.0, 450.0),
        "milk_yield_kg": (15.0, 5.0, 0.1, 40.0),
        "milk_temperature": (36.0, 1.0, 32.0, 40.0),
        "milk_pH": (6.7, 0.2, 5.8, 7.6),
        "milk_conductivity": (5.0, 1.0, 2.0, 10.0),
        "scc": (250.0, 200.0, 1.0, 5000.0),
        "body_temperature": (38.5, 0.5, 36.0, 41.5),
        "rumination_min": (450.0, 100.0, 100.0, 700.0),
        "activity_index": (50.0, 15.0, 1.0, 100.0),
        "feed_intake": (15.0, 4.0, 2.0, 35.0),
        "ambient_temperature": (28.0, 5.0, 5.0, 45.0),
        "humidity": (75.0, 10.0, 20.0, 100.0),
    }
    mu, sd, lo, hi = params[feature]
    return np.clip(rng.normal(mu, sd, n), lo, hi)

def sample_feature(feature, n, cal_entry):
    real_s = cal_entry["real"]
    public_s = cal_entry["public"]
    source = cal_entry["source"]

    if source == "REAL+PUBLIC":
        n_real = int(round(n * REAL_WEIGHT_WHEN_AVAILABLE))
        n_pub = n - n_real
        a = empirical_sample(real_s, n_real, jitter=0.015)
        b = empirical_sample(public_s, n_pub, jitter=0.015)
        vals = np.concatenate([a, b])
        rng.shuffle(vals)
    elif source == "REAL":
        vals = empirical_sample(real_s, n, jitter=0.015)
    elif source == "PUBLIC":
        vals = empirical_sample(public_s, n, jitter=0.015)
    else:
        vals = assumption_distribution(feature, n)

    bounds = robust_bounds(pd.concat([real_s, public_s], ignore_index=True), feature) if len(real_s) + len(public_s) else None
    if bounds:
        vals = np.clip(vals, bounds[0], bounds[1])
    return vals

def thi_from_temp_rh(temp_c, rh):
    # Standard simplified THI formulation commonly used for cattle heat-stress screening.
    return (1.8 * temp_c + 32) - ((0.55 - 0.0055 * rh) * (1.8 * temp_c - 26.8))

def build_animals(real_profiles):
    # Preserve audited real-farm structure while assigning synthetic IDs.
    farms = rng.choice(
        list(FARM_COUNTS.keys()),
        size=N_ANIMALS,
        p=np.array(list(FARM_COUNTS.values()), dtype=float) / sum(FARM_COUNTS.values())
    )
    species = rng.choice(
        ["Cow", "Buffalo"],
        size=N_ANIMALS,
        p=np.array([SPECIES_COUNTS["Cow"], SPECIES_COUNTS["Buffalo"]], dtype=float) /
          sum(SPECIES_COUNTS.values())
    )

    # Bootstrap real animal profiles when available.
    if not real_profiles.empty:
        profiles = real_profiles.dropna(subset=["species"]).copy()
    else:
        profiles = pd.DataFrame()

    animals = []
    for i in range(N_ANIMALS):
        sp = species[i]
        farm = farms[i]
        subset = profiles[profiles["species"] == sp] if not profiles.empty else pd.DataFrame()

        if not subset.empty:
            base = subset.iloc[int(rng.integers(0, len(subset)))]
            age = base["age_years"]
            parity = base["parity"]
            if pd.isna(age):
                age = np.nan
            else:
                age = max(1.0, float(age) + rng.normal(0, 0.15))
            if pd.isna(parity):
                parity = np.nan
            else:
                parity = max(0, round(float(parity) + rng.normal(0, 0.10)))
        else:
            age = np.nan
            parity = np.nan

        animals.append({
            "animal_id": f"SYN-{sp[:2].upper()}-{i+1:04d}",
            "farm_id": farm,
            "species": sp,
            "age_years": age,
            "parity": parity,
        })

    df = pd.DataFrame(animals)

    # Fill age/parity only from empirical calibration where real profile data is sparse.
    for f in ["age_years", "parity"]:
        miss = df[f].isna()
        if miss.any():
            df.loc[miss, f] = sample_feature_v23(f, int(miss.sum()), calibration[f])
        df[f] = np.round(df[f], 2 if f == "age_years" else 0)

    return df

def generate():
    global calibration

    real_files = discover_real_files()
    public_files = discover_public_files()

    print("\n=== GoRakshak Synthetic Generator V2.3 ===\n")
    print("REAL files found:")
    for k, v in real_files.items():
        print(f"  {k}: {len(v)}")
        for p in v[:5]:
            print(f"     {p}")

    print("\nPUBLIC calibration files found:")
    for k, p in public_files.items():
        print(f"  {k}: {p}")

    calibration, source_map, file_map = collect_calibration_v23(real_files, public_files)
    real_profiles = load_real_animal_profiles(real_files)

    print("\nCalibration sources:")
    for f in FEATURES:
        e = calibration[f]
        print(f"  {f:22s} -> {e['source']:12s} (real={e['real_n']}, public={e['public_n']})")

    animals = build_animals(real_profiles)

    dates = pd.date_range("2026-01-01", periods=N_DAYS, freq="D")

    # Animal-specific latent baselines.
    base = {}
    for f in FEATURES:
        if f in ["age_years", "parity", "thi"]:
            continue
        base[f] = sample_feature_v23(f, N_ANIMALS, calibration[f])

    # Give species a small empirical-structure role without inventing a species-specific
    # disease mechanism. These are development adjustments, recorded below.
    species_multiplier = np.where(animals["species"].eq("Buffalo").to_numpy(), 0.92, 1.00)
    base["milk_yield_kg"] *= species_multiplier
    base["feed_intake"] *= np.where(animals["species"].eq("Buffalo").to_numpy(), 0.95, 1.00)

    # Ensure DIM is longitudinal and bounded by empirical/assumption bounds.
    dim_start = sample_feature_v23("days_in_milk", N_ANIMALS, calibration["days_in_milk"])
    dim_start = np.clip(dim_start, 1, 450)

    # Synthetic development event schedule.
    n_event_animals = int(round(N_ANIMALS * SYNTHETIC_EVENT_ANIMAL_RATE))
    event_animals = set(rng.choice(N_ANIMALS, n_event_animals, replace=False).tolist())
    event_day = {}
    for i in event_animals:
        event_day[i] = int(rng.integers(30, N_DAYS - 13))

    records = []
    manifest = []

    for i, animal in animals.iterrows():
        # Animal-level variability in temporal persistence.
        ar = rng.uniform(0.70, 0.92)

        prev = {f: float(base[f][i]) for f in FEATURES if f not in ["age_years", "parity", "thi"]}

        for d, date in enumerate(dates, start=1):
            days_to_event = event_day[i] - d if i in event_day else 9999

            # Early precursor window: changes grow gradually in the final 21 days.
            if 0 <= days_to_event <= 21:
                progress = 1.0 - (days_to_event / 21.0)
            else:
                progress = 0.0

            # Correlated environmental variation.
            ambient = prev["ambient_temperature"] * ar + base["ambient_temperature"][i] * (1-ar)
            ambient += 0.35 * math.sin(d / 6.0) + rng.normal(0, 0.35)

            humidity = prev["humidity"] * ar + base["humidity"][i] * (1-ar)
            humidity += rng.normal(0, 1.2)
            humidity = float(np.clip(humidity, 0, 100))

            # Mild event-associated environmental/physiological changes.
            # These are development relationships, not observed onset coefficients.
            if progress > 0:
                ambient += 0.4 * progress
                humidity += 1.0 * progress

            milk_yield = prev["milk_yield_kg"] * ar + base["milk_yield_kg"][i] * (1-ar)
            milk_yield += rng.normal(0, max(0.10, 0.018 * base["milk_yield_kg"][i]))
            # Apply trajectory changes, then constrain each longitudinal
            # variable to its empirical calibration envelope. This prevents
            # accumulated AR drift from creating impossible/out-of-calibration
            # values over 90 days.
            def bound_feature(value, feature):
                b = robust_bounds(
                    pd.concat([
                        calibration[feature]["real"],
                        calibration[feature]["public"]
                    ], ignore_index=True),
                    feature
                )
                if b:
                    return float(np.clip(value, b[0], b[1]))
                return float(value)

            milk_yield *= (1.0 - 0.08 * progress)
            milk_yield = bound_feature(milk_yield, "milk_yield_kg")

            milk_temp = prev["milk_temperature"] * ar + base["milk_temperature"][i] * (1-ar)
            milk_temp += rng.normal(0, 0.05) + 0.25 * progress
            milk_temp = bound_feature(milk_temp, "milk_temperature")

            milk_ph = prev["milk_pH"] * ar + base["milk_pH"][i] * (1-ar)
            milk_ph += rng.normal(0, 0.015) - 0.03 * progress
            milk_ph = bound_feature(milk_ph, "milk_pH")

            conductivity = prev["milk_conductivity"] * ar + base["milk_conductivity"][i] * (1-ar)
            conductivity += rng.normal(0, 0.035) + 0.45 * progress
            conductivity = bound_feature(conductivity, "milk_conductivity")

            scc = prev["scc"] * ar + base["scc"][i] * (1-ar)
            scc += rng.normal(0, max(0.5, 0.04 * max(base["scc"][i], 1)))
            scc *= (1.0 + 0.35 * progress)
            scc = bound_feature(max(0, scc), "scc")

            body_temp = prev["body_temperature"] * ar + base["body_temperature"][i] * (1-ar)
            body_temp += rng.normal(0, 0.025) + 0.20 * progress
            body_temp = bound_feature(body_temp, "body_temperature")

            rumination = prev["rumination_min"] * ar + base["rumination_min"][i] * (1-ar)
            rumination += rng.normal(0, max(1, 0.015 * max(base["rumination_min"][i], 1)))
            rumination *= (1.0 - 0.08 * progress)
            rumination = bound_feature(max(0, rumination), "rumination_min")

            activity = prev["activity_index"] * ar + base["activity_index"][i] * (1-ar)
            activity += rng.normal(0, max(0.1, 0.02 * max(base["activity_index"][i], 1)))
            activity *= (1.0 - 0.07 * progress)
            activity = bound_feature(max(0, activity), "activity_index")

            feed = prev["feed_intake"] * ar + base["feed_intake"][i] * (1-ar)
            feed += rng.normal(0, max(0.05, 0.02 * max(base["feed_intake"][i], 1)))
            feed *= (1.0 - 0.05 * progress)
            feed = bound_feature(max(0, feed), "feed_intake")

            ambient = bound_feature(ambient, "ambient_temperature")
            humidity = bound_feature(humidity, "humidity")

            # THI is derived ONLY from bounded ambient temperature and humidity.
            thi = thi_from_temp_rh(ambient, humidity)

            # Targets: event begins in the FUTURE relative to this observation.
            y7 = int(1 <= days_to_event <= 7)
            y14 = int(1 <= days_to_event <= 14)

            records.append({
                "animal_id": animal["animal_id"],
                "farm_id": animal["farm_id"],
                "species": animal["species"],
                "date": date.strftime("%Y-%m-%d"),
                "day_index": d,
                "age_years": float(animal["age_years"]),
                "parity": int(animal["parity"]),
                "days_in_milk": float(np.clip(dim_start[i] + d - 1, 1, 500)),
                "milk_yield_kg": float(milk_yield),
                "milk_temperature": float(milk_temp),
                "milk_pH": float(milk_ph),
                "milk_conductivity": float(conductivity),
                "scc": float(scc),
                "body_temperature": float(body_temp),
                "rumination_min": float(rumination),
                "activity_index": float(activity),
                "feed_intake": float(feed),
                "ambient_temperature": float(ambient),
                "humidity": float(humidity),
                "thi": float(thi),
                "mastitis_within_7d": y7,
                "mastitis_within_14d": y14,
                "data_origin": "SYNTHETIC_DEVELOPMENT",
            })

            prev.update({
                "milk_yield_kg": milk_yield,
                "milk_temperature": milk_temp,
                "milk_pH": milk_ph,
                "milk_conductivity": conductivity,
                "scc": scc,
                "body_temperature": body_temp,
                "rumination_min": rumination,
                "activity_index": activity,
                "feed_intake": feed,
                "ambient_temperature": ambient,
                "humidity": humidity,
            })

        manifest.append({
            "animal_id": animal["animal_id"],
            "farm_id": animal["farm_id"],
            "species": animal["species"],
            "synthetic_event": int(i in event_day),
            "synthetic_event_day": event_day.get(i, None),
        })

    df = pd.DataFrame(records)
    manifest_df = pd.DataFrame(manifest)

    # Final deterministic cleanup.
    # Static animal attributes must not drift across days.
    static_check = df.groupby("animal_id")[["age_years", "parity"]].nunique()
    if int((static_check > 1).any(axis=1).sum()) != 0:
        raise RuntimeError("Static animal attributes drifted across days.")

    dim_bounds = v23_bounds("days_in_milk", calibration["days_in_milk"])
    if dim_bounds:
        df["days_in_milk"] = np.clip(
            df["days_in_milk"].to_numpy(float),
            dim_bounds[0],
            dim_bounds[1]
        )

    # Recompute THI after all environmental constraints.
    df["thi"] = thi_from_temp_rh(
        df["ambient_temperature"].to_numpy(float),
        df["humidity"].to_numpy(float)
    )

    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(["animal_id", "date"]).reset_index(drop=True)

    # Bounds from empirical calibration where possible.
    violations = []
    for f in FEATURES:
        if f == "thi":
            derived_thi = thi_from_temp_rh(
                df["ambient_temperature"].to_numpy(float),
                df["humidity"].to_numpy(float)
            )
            lower = float(np.min(derived_thi))
            upper = float(np.max(derived_thi))
            bad = np.abs(df["thi"].to_numpy(float) - derived_thi) > 1e-8
        else:
            b = v23_bounds(f, calibration[f])
            if not b:
                continue
            lower, upper = b
            bad = (df[f] < lower) | (df[f] > upper)

        violations.append({
            "feature": f,
            "lower": lower,
            "upper": upper,
            "violations": int(np.sum(bad)),
        })

    validation = pd.DataFrame(violations)

    # Core quality checks.
    duplicate_count = int(df.duplicated(["animal_id", "date"]).sum())
    missing_count = int(df.isna().sum().sum())
    thi_recalc = thi_from_temp_rh(df["ambient_temperature"].to_numpy(), df["humidity"].to_numpy())
    thi_error = float(np.max(np.abs(df["thi"].to_numpy() - thi_recalc)))

    target_rows = {
        "7_day_positive_rows": int(df["mastitis_within_7d"].sum()),
        "14_day_positive_rows": int(df["mastitis_within_14d"].sum()),
        "7_day_positive_rate": float(df["mastitis_within_7d"].mean()),
        "14_day_positive_rate": float(df["mastitis_within_14d"].mean()),
    }

    report = {
        "project": "GoRakshak",
        "purpose": "Synthetic longitudinal development data for mastitis forecasting",
        "warning": "Synthetic targets are development labels and are NOT observed epidemiological incidence.",
        "seed": SEED,
        "rows": int(len(df)),
        "animals": int(df["animal_id"].nunique()),
        "days_per_animal_expected": N_DAYS,
        "duplicate_animal_date_rows": duplicate_count,
        "missing_cells": missing_count,
        "thi_max_recalculation_error": thi_error,
        "synthetic_event_animal_rate_assumption": SYNTHETIC_EVENT_ANIMAL_RATE,
        "target_summary": target_rows,
        "calibration": {},
        "validation": validation.to_dict(orient="records"),
        "validation_pass": bool(
            len(df) == N_ANIMALS * N_DAYS
            and df["animal_id"].nunique() == N_ANIMALS
            and duplicate_count == 0
            and missing_count == 0
            and thi_error < 1e-8
            and int(validation["violations"].sum()) == 0
        ),
        "development_adjustments": [
            "Real farm species/farm proportions were used as structural anchors.",
            "When both real and public empirical values were available, a 60/40 real/public bootstrap mixture was used.",
            "Temporal persistence and pre-event trajectories are development assumptions because real longitudinal mastitis-onset labels are unavailable.",
            "Species yield/feed adjustments are development assumptions, not measured species-specific effects.",
        ],
        "files_used": {
            "real": {k: [str(x) for x in v] for k, v in real_files.items()},
            "public": {k: str(v) for k, v in public_files.items()},
        },
    }

    for f in FEATURES:
        e = calibration[f]
        combined = pd.concat([e["real"], e["public"]], ignore_index=True)
        report["calibration"][f] = {
            "source": e["source"],
            "real_n": e["real_n"],
            "public_n": e["public_n"],
            "combined_n": int(len(combined)),
            "min": float(combined.min()) if len(combined) else None,
            "max": float(combined.max()) if len(combined) else None,
            "mean": float(combined.mean()) if len(combined) else None,
            "median": float(combined.median()) if len(combined) else None,
        }

    out_csv = OUT_ROOT / "gorakshak_synthetic_longitudinal_v2.csv"
    out_manifest = OUT_ROOT / "synthetic_animal_manifest_v3.csv"
    out_validation = OUT_ROOT / "synthetic_validation_report_v3.csv"
    out_report = OUT_ROOT / "synthetic_calibration_report_v3.json"

    df.to_csv(out_csv, index=False)
    manifest_df.to_csv(out_manifest, index=False)
    validation.to_csv(out_validation, index=False)
    out_report.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print("\n=== GENERATION COMPLETE ===")
    print(f"Dataset:   {out_csv}")
    print(f"Manifest:  {out_manifest}")
    print(f"Validation:{out_validation}")
    print(f"Report:    {out_report}")

    print("\nDataset shape:", df.shape)
    print("Animals:", df["animal_id"].nunique())
    print("Animal-date duplicates:", duplicate_count)
    print("Missing cells:", missing_count)
    print("THI max error:", thi_error)

    print("\nTargets:")
    for k, v in target_rows.items():
        print(f"  {k}: {v}")

    print("\nValidation:")
    print(validation.to_string(index=False))

    if not report["validation_pass"]:
        print("\nSTATUS: FAILED VALIDATION — DO NOT TRAIN ON THIS DATASET.")
        raise SystemExit(2)

    print("\nSTATUS: PASSED CORE VALIDATION — READY FOR FORECASTING-DATASET CONSTRUCTION.")
    print("IMPORTANT: This is synthetic development data, not real mastitis incidence.")

if __name__ == "__main__":
    generate()
