"""
GoRakshak SIH 2026
Synthetic Longitudinal Dataset Generator V2.1

Purpose:
    Development-only synthetic longitudinal data for mastitis forecasting.

Important:
    Synthetic targets are NOT real epidemiological incidence.
    They are only for development and temporal-pipeline testing.

Run:
    cd /d D:\GoRakshak
    .venv\Scripts\activate
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


# ================================================================
# CONFIGURATION
# ================================================================

SEED = 26109
rng = np.random.default_rng(SEED)

ROOT = Path(r"D:\GoRakshak")

REAL_ROOT = (
    ROOT
    / "ai-ml"
    / "data"
    / "real"
)

PUBLIC_ROOT = (
    ROOT
    / "ai-ml"
    / "data"
    / "public"
)

SYNTHETIC_ROOT = (
    ROOT
    / "ai-ml"
    / "data"
    / "synthetic"
)

PROCESSED_ROOT = (
    ROOT
    / "ai-ml"
    / "data"
    / "processed"
)

SYNTHETIC_ROOT.mkdir(
    parents=True,
    exist_ok=True
)

PROCESSED_ROOT.mkdir(
    parents=True,
    exist_ok=True
)

N_ANIMALS = 300
N_DAYS = 90

START_DATE = "2026-01-01"

# Audited real-farm structure
FARM_COUNTS = {
    "F01": 44,
    "F02": 27,
    "F03": 6,
    "F04": 11,
    "F05": 6,
}

SPECIES_COUNTS = {
    "COW": 41,
    "BUFFALO": 53,
}

# Development assumption ONLY.
# This is NOT observed mastitis incidence.
SYNTHETIC_EVENT_ANIMAL_RATE = 0.30

# If both real and public observations exist,
# 60% of baseline samples come from real,
# 40% from public.
REAL_WEIGHT = 0.60


# ================================================================
# FEATURE COLUMN ALIASES
# ================================================================

ALIASES = {

    "age_years": [
        "age_years",
        "age_year",
        "age",
    ],

    "parity": [
        "parity",
    ],

    "days_in_milk": [
        "days_in_milk",
        "dim",
        "days_after_calving",
        "days_after_giving_birth",
    ],

    "milk_yield_kg": [
        "milk_yield_kg",
        "milk_yield",
        "yield_kg",
        "milk",
    ],

    "milk_temperature": [
        "milk_temperature",
        "temperature_milk",
        "milk_temp",
    ],

    "milk_pH": [
        "milk_ph",
        "milk_p_h",
        "ph",
    ],

    "milk_conductivity": [
        "milk_conductivity",
        "conductivity_avg",
        "conductivity",
    ],

    "scc": [
        "scc",
        "somatic_cell_count",
        "somaticcellcount",
    ],

    "body_temperature": [
        "body_temperature",
        "body_temp",
        "temperature_body",
        "animal_temperature",
    ],

    "rumination_min": [
        "rumination_min",
        "rumination_minutes",
        "rumination",
    ],

    "activity_index": [
        "activity_index",
        "activity_score",
        "activity",
        "activity_level",
    ],

    "feed_intake": [
        "feed_intake",
        "feed_intake_robot",
        "feed_intake_kg",
    ],

    "ambient_temperature": [
        "ambient_temperature",
        "ambient_temp",
        "air_temperature",
        "air_temp",
    ],

    "humidity": [
        "humidity",
        "relative_humidity",
        "rh",
    ],
}


# ================================================================
# BASIC HELPERS
# ================================================================

def normalize_column(value):

    return re.sub(
        r"[^a-z0-9]+",
        "_",
        str(value)
        .strip()
        .lower()
    ).strip("_")


def find_column(
    dataframe,
    aliases
):

    normalized = {
        normalize_column(column): column
        for column in dataframe.columns
    }

    # Exact match
    for alias in aliases:

        alias_normalized = normalize_column(
            alias
        )

        if alias_normalized in normalized:

            return normalized[
                alias_normalized
            ]

    # Relaxed match
    for column in dataframe.columns:

        column_normalized = normalize_column(
            column
        )

        for alias in aliases:

            alias_normalized = normalize_column(
                alias
            )

            if (
                alias_normalized
                and
                (
                    alias_normalized
                    in
                    column_normalized
                    or
                    column_normalized
                    in
                    alias_normalized
                )
            ):

                return column

    return None


def read_csv_safe(path):

    try:

        return pd.read_csv(
            path,
            low_memory=False
        )

    except Exception as error:

        print(
            f"[WARNING] Could not read:"
        )

        print(
            f"          {path}"
        )

        print(
            f"          {error}"
        )

        return None


def get_numeric_values(
    dataframe,
    feature
):

    column = find_column(
        dataframe,
        ALIASES.get(
            feature,
            [feature]
        )
    )

    if column is None:

        return (
            pd.Series(
                dtype=float
            ),
            None
        )

    values = pd.to_numeric(
        dataframe[column],
        errors="coerce"
    )

    values = values.replace(
        [np.inf, -np.inf],
        np.nan
    )

    values = values.dropna()

    return values, column


# ================================================================
# DATA DISCOVERY
# ================================================================

def discover_real_files():

    return {

        "animals":
            sorted(
                REAL_ROOT.rglob(
                    "animals.csv"
                )
            ),

        "milk":
            sorted(
                REAL_ROOT.rglob(
                    "milk_records.csv"
                )
            ),

        "environment":
            sorted(
                REAL_ROOT.rglob(
                    "environment_records.csv"
                )
            ),
    }


def discover_public_files():

    filenames = [

        "milking_robot_dataset_combined.csv",

        "cattle_milk_yield_1000.csv",

        "cow_milk_mastitis_harmonized.csv",

        "cow_clinical_mastitis_harmonized.csv",

        "buffalo_scm_core_harmonized.csv",
    ]

    result = {}

    for filename in filenames:

        matches = list(
            PUBLIC_ROOT.rglob(
                filename
            )
        )

        if matches:

            result[
                filename
            ] = matches[0]

    return result


# ================================================================
# COLLECT CALIBRATION VALUES
# ================================================================

def collect_values_from_files(
    paths,
    feature
):

    pieces = []

    used_files = []

    for path in paths:

        dataframe = read_csv_safe(
            path
        )

        if dataframe is None:

            continue

        values, column = get_numeric_values(
            dataframe,
            feature
        )

        if len(values) == 0:

            continue

        pieces.append(
            values
        )

        used_files.append({

            "file":
                str(path),

            "column":
                str(column),

            "n":
                int(len(values)),
        })

    if not pieces:

        return (
            pd.Series(
                dtype=float
            ),
            used_files
        )

    return (

        pd.concat(
            pieces,
            ignore_index=True
        ),

        used_files
    )


# ================================================================
# ROBUST EMPIRICAL BOUNDS
# ================================================================

def robust_bounds(
    values,
    feature
):

    values = pd.to_numeric(
        values,
        errors="coerce"
    ).dropna()

    if len(values) == 0:

        return None

    lower = float(
        values.quantile(
            0.001
        )
    )

    upper = float(
        values.quantile(
            0.999
        )
    )

    # Conservative sanity limits.
    # These prevent impossible generated values.
    physical_limits = {

        "age_years":
            (1.0, 25.0),

        "parity":
            (0.0, 15.0),

        "days_in_milk":
            (1.0, 500.0),

        "milk_yield_kg":
            (0.1, 60.0),

        "milk_temperature":
            (30.0, 42.0),

        "milk_pH":
            (5.0, 8.5),

        "milk_conductivity":
            (0.1, 20.0),

        "scc":
            (0.0, 50000.0),

        "body_temperature":
            (35.0, 43.0),

        "rumination_min":
            (0.0, 1500.0),

        "activity_index":
            (0.0, 1000.0),

        "feed_intake":
            (0.0, 100.0),

        "ambient_temperature":
            (-10.0, 55.0),

        "humidity":
            (0.0, 100.0),
    }

    if feature in physical_limits:

        physical_low, physical_high = (
            physical_limits[
                feature
            ]
        )

        lower = max(
            lower,
            physical_low
        )

        upper = min(
            upper,
            physical_high
        )

    return (
        lower,
        upper
    )


# ================================================================
# EMPIRICAL SAMPLING
# ================================================================

def empirical_sample(
    values,
    n,
    jitter_fraction=0.01
):

    values = pd.to_numeric(
        values,
        errors="coerce"
    ).dropna()

    if len(values) == 0:

        return np.full(
            n,
            np.nan
        )

    values = values.to_numpy(
        dtype=float
    )

    sampled = rng.choice(
        values,
        size=n,
        replace=True
    )

    if (
        jitter_fraction > 0
        and
        len(values) > 5
    ):

        standard_deviation = float(
            np.std(values)
        )

        if standard_deviation > 0:

            sampled += rng.normal(
                0,
                jitter_fraction
                *
                standard_deviation,
                n
            )

    return sampled


# ================================================================
# ASSUMPTION FALLBACK
# ================================================================

def assumption_sample(
    feature,
    n
):

    # ONLY used if empirical data is insufficient.
    # These values are explicitly labelled ASSUMPTION.

    parameters = {

        "age_years":
            (7.0, 3.0, 2.0, 17.0),

        "parity":
            (3.0, 2.0, 0.0, 10.0),

        "days_in_milk":
            (150.0, 90.0, 1.0, 450.0),

        "milk_yield_kg":
            (15.0, 5.0, 0.1, 40.0),

        "milk_temperature":
            (36.0, 1.0, 32.0, 40.0),

        "milk_pH":
            (6.7, 0.2, 5.8, 7.6),

        "milk_conductivity":
            (5.0, 1.0, 2.0, 10.0),

        "scc":
            (250.0, 200.0, 1.0, 5000.0),

        "body_temperature":
            (38.5, 0.5, 36.0, 41.5),

        "rumination_min":
            (450.0, 100.0, 100.0, 700.0),

        "activity_index":
            (50.0, 15.0, 1.0, 100.0),

        "feed_intake":
            (15.0, 4.0, 2.0, 35.0),

        "ambient_temperature":
            (28.0, 5.0, 5.0, 45.0),

        "humidity":
            (75.0, 10.0, 20.0, 100.0),
    }

    mean, std, low, high = (
        parameters[
            feature
        ]
    )

    return np.clip(
        rng.normal(
            mean,
            std,
            n
        ),
        low,
        high
    )


# ================================================================
# FEATURE SAMPLER
# ================================================================

def sample_feature(
    feature,
    calibration,
    n=N_ANIMALS
):

    real_values = calibration[
        feature
    ]["real"]

    public_values = calibration[
        feature
    ]["public"]

    source = calibration[
        feature
    ]["source"]

    if source == "REAL+PUBLIC":

        real_n = int(
            round(
                n
                *
                REAL_WEIGHT
            )
        )

        public_n = (
            n
            -
            real_n
        )

        real_sample = empirical_sample(
            real_values,
            real_n
        )

        public_sample = empirical_sample(
            public_values,
            public_n
        )

        result = np.concatenate(
            [
                real_sample,
                public_sample
            ]
        )

        rng.shuffle(
            result
        )

    elif source == "REAL":

        result = empirical_sample(
            real_values,
            n
        )

    elif source == "PUBLIC":

        result = empirical_sample(
            public_values,
            n
        )

    else:

        result = assumption_sample(
            feature,
            n
        )

    combined = pd.concat(
        [
            real_values,
            public_values
        ],
        ignore_index=True
    )

    bounds = robust_bounds(
        combined,
        feature
    )

    if bounds:

        result = np.clip(
            result,
            bounds[0],
            bounds[1]
        )

    return result


# ================================================================
# REAL ANIMAL PROFILE LOADING
# ================================================================

def parse_age(value):

    if pd.isna(value):

        return np.nan

    match = re.search(
        r"(\d+(?:\.\d+)?)",
        str(value)
    )

    if match:

        return float(
            match.group(1)
        )

    return np.nan


def load_real_animal_profiles(
    real_files
):

    profiles = []

    for path in real_files[
        "animals"
    ]:

        dataframe = read_csv_safe(
            path
        )

        if (
            dataframe is None
            or
            dataframe.empty
        ):

            continue

        species_column = find_column(
            dataframe,
            [
                "species",
                "animal_species",
                "type",
            ]
        )

        farm_column = find_column(
            dataframe,
            [
                "farm_id",
                "farmid",
                "farm",
            ]
        )

        age_column = find_column(
            dataframe,
            [
                "age"
            ]
        )

        parity_column = find_column(
            dataframe,
            [
                "parity"
            ]
        )

        for _, row in dataframe.iterrows():

            if species_column:

                species_text = str(
                    row[
                        species_column
                    ]
                ).lower()

            else:

                species_text = ""

            if "buff" in species_text:

                species = "BUFFALO"

            elif "cow" in species_text:

                species = "COW"

            else:

                continue

            if farm_column:

                farm = str(
                    row[
                        farm_column
                    ]
                )

            else:

                farm = ""

            if age_column:

                age = parse_age(
                    row[
                        age_column
                    ]
                )

            else:

                age = np.nan

            if parity_column:

                parity = pd.to_numeric(
                    row[
                        parity_column
                    ],
                    errors="coerce"
                )

            else:

                parity = np.nan

            profiles.append({

                "farm_id":
                    farm,

                "species":
                    species,

                "age_years":
                    age,

                "parity":
                    parity,
            })

    return pd.DataFrame(
        profiles
    )


# ================================================================
# THI
# ================================================================

def calculate_thi(
    temperature_c,
    humidity
):

    return (

        (
            1.8
            *
            temperature_c
            +
            32
        )

        -

        (

            (
                0.55
                -
                0.0055
                *
                humidity
            )

            *

            (
                1.8
                *
                temperature_c
                -
                26.8
            )
        )
    )


# ================================================================
# BUILD ANIMAL MASTER
# ================================================================

def build_animal_master(
    real_profiles,
    calibration
):

    farm_names = list(
        FARM_COUNTS.keys()
    )

    farm_probabilities = (
        np.array(
            list(
                FARM_COUNTS.values()
            ),
            dtype=float
        )
        /
        sum(
            FARM_COUNTS.values()
        )
    )

    species_names = [
        "COW",
        "BUFFALO"
    ]

    species_probabilities = (
        np.array(
            [
                SPECIES_COUNTS[
                    "COW"
                ],
                SPECIES_COUNTS[
                    "BUFFALO"
                ],
            ],
            dtype=float
        )
        /
        sum(
            SPECIES_COUNTS.values()
        )
    )

    farms = rng.choice(
        farm_names,
        size=N_ANIMALS,
        p=farm_probabilities
    )

    species = rng.choice(
        species_names,
        size=N_ANIMALS,
        p=species_probabilities
    )

    rows = []

    for i in range(
        N_ANIMALS
    ):

        current_species = species[
            i
        ]

        if not real_profiles.empty:

            candidates = real_profiles[
                real_profiles[
                    "species"
                ]
                ==
                current_species
            ]

        else:

            candidates = pd.DataFrame()

        if not candidates.empty:

            selected = candidates.iloc[
                int(
                    rng.integers(
                        0,
                        len(candidates)
                    )
                )
            ]

            age = selected[
                "age_years"
            ]

            parity = selected[
                "parity"
            ]

            if not pd.isna(age):

                age = max(
                    1.0,
                    float(age)
                    +
                    rng.normal(
                        0,
                        0.15
                    )
                )

            if not pd.isna(parity):

                parity = max(
                    0,
                    int(
                        round(
                            float(parity)
                            +
                            rng.normal(
                                0,
                                0.10
                            )
                        )
                    )
                )

        else:

            age = np.nan
            parity = np.nan

        rows.append({

            "animal_id":
                (
                    f"SYN-"
                    f"{current_species[:2]}-"
                    f"{i + 1:04d}"
                ),

            "farm_id":
                farms[i],

            "species":
                current_species,

            "age_years":
                age,

            "parity":
                parity,
        })

    animals = pd.DataFrame(
        rows
    )

    # Fill any missing profile values
    # using empirical calibration.
    for feature in [
        "age_years",
        "parity",
    ]:

        missing = animals[
            feature
        ].isna()

        count_missing = int(
            missing.sum()
        )

        if count_missing > 0:

            replacement = sample_feature(
                feature,
                calibration,
                count_missing
            )

            animals.loc[
                missing,
                feature
            ] = replacement

    animals[
        "age_years"
    ] = animals[
        "age_years"
    ].astype(float).round(2)

    animals[
        "parity"
    ] = animals[
        "parity"
    ].astype(float).round().astype(int)

    return animals


# ================================================================
# MAIN
# ================================================================

def main():

    print()
    print("=" * 80)
    print(
        "GoRakshak Synthetic Data Generator V2.1"
    )
    print("=" * 80)

    # ------------------------------------------------------------
    # DISCOVER REAL DATA
    # ------------------------------------------------------------

    real_files = discover_real_files()

    print()
    print(
        "REAL DATA DISCOVERY"
    )
    print("-" * 80)

    for category, paths in real_files.items():

        print(
            f"{category}: {len(paths)} files"
        )

        for path in paths:

            print(
                f"  {path}"
            )

    # ------------------------------------------------------------
    # DISCOVER PUBLIC DATA
    # ------------------------------------------------------------

    public_files = discover_public_files()

    print()
    print(
        "PUBLIC DATA DISCOVERY"
    )
    print("-" * 80)

    for name, path in public_files.items():

        print(
            name
        )

        print(
            f"  {path}"
        )

    # ------------------------------------------------------------
    # CALIBRATION
    # ------------------------------------------------------------

    print()
    print(
        "CALIBRATION"
    )
    print("-" * 80)

    calibration = {}

    calibration_sources = {}

    real_measurement_files = (
        real_files["milk"]
        +
        real_files["environment"]
    )

    public_measurement_files = list(
        public_files.values()
    )

    calibration_features = [

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
    ]

    for feature in calibration_features:

        real_values, real_used = (
            collect_values_from_files(
                real_measurement_files,
                feature
            )
        )

        public_values, public_used = (
            collect_values_from_files(
                public_measurement_files,
                feature
            )
        )

        if (
            len(real_values) >= 10
            and
            len(public_values) >= 10
        ):

            source = "REAL+PUBLIC"

        elif len(real_values) >= 10:

            source = "REAL"

        elif len(public_values) >= 10:

            source = "PUBLIC"

        else:

            source = "ASSUMPTION"

        calibration[
            feature
        ] = {

            "real":
                real_values,

            "public":
                public_values,

            "source":
                source,

            "real_files":
                real_used,

            "public_files":
                public_used,
        }

        calibration_sources[
            feature
        ] = source

        print(
            f"{feature:24s}"
            f" -> {source:12s}"
            f" | real={len(real_values):6d}"
            f" | public={len(public_values):6d}"
        )

    # ------------------------------------------------------------
    # ANIMAL MASTER
    # ------------------------------------------------------------

    print()
    print(
        "BUILDING SYNTHETIC ANIMAL MASTER"
    )
    print("-" * 80)

    real_profiles = (
        load_real_animal_profiles(
            real_files
        )
    )

    animals = build_animal_master(
        real_profiles,
        calibration
    )

    print(
        f"Synthetic animals: "
        f"{len(animals)}"
    )

    print()
    print(
        "Species:"
    )

    print(
        animals[
            "species"
        ].value_counts()
    )

    print()
    print(
        "Farms:"
    )

    print(
        animals[
            "farm_id"
        ].value_counts()
    )

    # ------------------------------------------------------------
    # BASELINE FEATURE VALUES
    # ------------------------------------------------------------

    print()
    print(
        "BUILDING BASELINE FEATURES"
    )
    print("-" * 80)

    feature_names = [

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
    ]

    baseline = {}

    for feature in feature_names:

        baseline[
            feature
        ] = sample_feature(
            feature,
            calibration
        )

    # ------------------------------------------------------------
    # SYNTHETIC FUTURE EVENT SCHEDULE
    # ------------------------------------------------------------

    print()
    print(
        "BUILDING DEVELOPMENT EVENT SCHEDULE"
    )
    print("-" * 80)

    event_count = int(
        round(
            N_ANIMALS
            *
            SYNTHETIC_EVENT_ANIMAL_RATE
        )
    )

    event_animals = set(
        rng.choice(
            N_ANIMALS,
            size=event_count,
            replace=False
        )
    )

    event_days = {}

    for animal_index in event_animals:

        event_days[
            animal_index
        ] = int(
            rng.integers(
                30,
                N_DAYS - 13
            )
        )

    print(
        f"Animals with synthetic development event: "
        f"{event_count}"
    )

    print(
        f"Development event animal rate: "
        f"{SYNTHETIC_EVENT_ANIMAL_RATE:.1%}"
    )

    # ------------------------------------------------------------
    # LONGITUDINAL DATA
    # ------------------------------------------------------------

    print()
    print(
        "GENERATING LONGITUDINAL OBSERVATIONS"
    )
    print("-" * 80)

    dates = pd.date_range(
        START_DATE,
        periods=N_DAYS,
        freq="D"
    )

    records = []

    for animal_index, animal in animals.iterrows():

        # Persistent animal-level state.
        persistence = rng.uniform(
            0.70,
            0.92
        )

        current = {}

        for feature in feature_names:

            current[
                feature
            ] = float(
                baseline[
                    feature
                ][animal_index]
            )

        starting_dim = float(
            baseline[
                "days_in_milk"
            ][animal_index]
        )

        for day_number, date in enumerate(
            dates,
            start=1
        ):

            # ----------------------------------------------------
            # FUTURE EVENT DISTANCE
            # ----------------------------------------------------

            if animal_index in event_days:

                days_to_event = (
                    event_days[
                        animal_index
                    ]
                    -
                    day_number
                )

            else:

                days_to_event = 9999

            # ----------------------------------------------------
            # PRE-EVENT PROGRESSION
            # ----------------------------------------------------

            if (
                0
                <=
                days_to_event
                <=
                21
            ):

                progress = (
                    1.0
                    -
                    (
                        days_to_event
                        /
                        21.0
                    )
                )

            else:

                progress = 0.0

            # ----------------------------------------------------
            # ENVIRONMENT
            # ----------------------------------------------------

            ambient_temperature = (

                persistence
                *
                current[
                    "ambient_temperature"
                ]

                +

                (
                    1
                    -
                    persistence
                )
                *
                baseline[
                    "ambient_temperature"
                ][animal_index]

                +

                0.35
                *
                math.sin(
                    day_number / 6.0
                )

                +

                rng.normal(
                    0,
                    0.35
                )
            )

            humidity = (

                persistence
                *
                current[
                    "humidity"
                ]

                +

                (
                    1
                    -
                    persistence
                )
                *
                baseline[
                    "humidity"
                ][animal_index]

                +

                rng.normal(
                    0,
                    1.2
                )
            )

            # Development trajectory.
            ambient_temperature += (
                0.4
                *
                progress
            )

            humidity += (
                1.0
                *
                progress
            )

            humidity = float(
                np.clip(
                    humidity,
                    0,
                    100
                )
            )

            # ----------------------------------------------------
            # MILK YIELD
            # ----------------------------------------------------

            milk_yield = (

                persistence
                *
                current[
                    "milk_yield_kg"
                ]

                +

                (
                    1
                    -
                    persistence
                )
                *
                baseline[
                    "milk_yield_kg"
                ][animal_index]

                +

                rng.normal(
                    0,
                    max(
                        0.10,
                        0.018
                        *
                        baseline[
                            "milk_yield_kg"
                        ][animal_index]
                    )
                )
            )

            # Gradual decline approaching development event.
            milk_yield *= (
                1
                -
                0.08
                *
                progress
            )

            milk_yield = max(
                0.1,
                milk_yield
            )

            # ----------------------------------------------------
            # MILK TEMPERATURE
            # ----------------------------------------------------

            milk_temperature = (

                persistence
                *
                current[
                    "milk_temperature"
                ]

                +

                (
                    1
                    -
                    persistence
                )
                *
                baseline[
                    "milk_temperature"
                ][animal_index]

                +

                rng.normal(
                    0,
                    0.05
                )

                +

                0.25
                *
                progress
            )

            # ----------------------------------------------------
            # MILK PH
            # ----------------------------------------------------

            milk_pH = (

                persistence
                *
                current[
                    "milk_pH"
                ]

                +

                (
                    1
                    -
                    persistence
                )
                *
                baseline[
                    "milk_pH"
                ][animal_index]

                +

                rng.normal(
                    0,
                    0.015
                )

                -

                0.03
                *
                progress
            )

            # ----------------------------------------------------
            # CONDUCTIVITY
            # ----------------------------------------------------

            milk_conductivity = (

                persistence
                *
                current[
                    "milk_conductivity"
                ]

                +

                (
                    1
                    -
                    persistence
                )
                *
                baseline[
                    "milk_conductivity"
                ][animal_index]

                +

                rng.normal(
                    0,
                    0.035
                )

                +

                0.45
                *
                progress
            )

            # ----------------------------------------------------
            # SCC
            # ----------------------------------------------------

            scc = (

                persistence
                *
                current[
                    "scc"
                ]

                +

                (
                    1
                    -
                    persistence
                )
                *
                baseline[
                    "scc"
                ][animal_index]

                +

                rng.normal(
                    0,
                    max(
                        0.5,
                        0.04
                        *
                        max(
                            baseline[
                                "scc"
                            ][animal_index],
                            1
                        )
                    )
                )
            )

            scc *= (
                1
                +
                0.35
                *
                progress
            )

            scc = max(
                0,
                scc
            )

            # ----------------------------------------------------
            # BODY TEMPERATURE
            # ----------------------------------------------------

            body_temperature = (

                persistence
                *
                current[
                    "body_temperature"
                ]

                +

                (
                    1
                    -
                    persistence
                )
                *
                baseline[
                    "body_temperature"
                ][animal_index]

                +

                rng.normal(
                    0,
                    0.025
                )

                +

                0.20
                *
                progress
            )

            # ----------------------------------------------------
            # RUMINATION
            # ----------------------------------------------------

            rumination_min = (

                persistence
                *
                current[
                    "rumination_min"
                ]

                +

                (
                    1
                    -
                    persistence
                )
                *
                baseline[
                    "rumination_min"
                ][animal_index]

                +

                rng.normal(
                    0,
                    max(
                        1,
                        0.015
                        *
                        max(
                            baseline[
                                "rumination_min"
                            ][animal_index],
                            1
                        )
                    )
                )
            )

            rumination_min *= (
                1
                -
                0.08
                *
                progress
            )

            rumination_min = max(
                0,
                rumination_min
            )

            # ----------------------------------------------------
            # ACTIVITY
            # ----------------------------------------------------

            activity_index = (

                persistence
                *
                current[
                    "activity_index"
                ]

                +

                (
                    1
                    -
                    persistence
                )
                *
                baseline[
                    "activity_index"
                ][animal_index]

                +

                rng.normal(
                    0,
                    max(
                        0.1,
                        0.02
                        *
                        max(
                            baseline[
                                "activity_index"
                            ][animal_index],
                            1
                        )
                    )
                )
            )

            activity_index *= (
                1
                -
                0.07
                *
                progress
            )

            activity_index = max(
                0,
                activity_index
            )

            # ----------------------------------------------------
            # FEED INTAKE
            # ----------------------------------------------------

            feed_intake = (

                persistence
                *
                current[
                    "feed_intake"
                ]

                +

                (
                    1
                    -
                    persistence
                )
                *
                baseline[
                    "feed_intake"
                ][animal_index]

                +

                rng.normal(
                    0,
                    max(
                        0.05,
                        0.02
                        *
                        max(
                            baseline[
                                "feed_intake"
                            ][animal_index],
                            1
                        )
                    )
                )
            )

            feed_intake *= (
                1
                -
                0.05
                *
                progress
            )

            feed_intake = max(
                0,
                feed_intake
            )

            # ----------------------------------------------------
            # THI
            # ----------------------------------------------------

            thi = calculate_thi(
                ambient_temperature,
                humidity
            )

            # ----------------------------------------------------
            # TARGETS
            # ----------------------------------------------------

            mastitis_within_7d = int(
                1
                <=
                days_to_event
                <=
                7
            )

            mastitis_within_14d = int(
                1
                <=
                days_to_event
                <=
                14
            )

            # ----------------------------------------------------
            # RECORD
            # ----------------------------------------------------

            records.append({

                "animal_id":
                    animal[
                        "animal_id"
                    ],

                "farm_id":
                    animal[
                        "farm_id"
                    ],

                "species":
                    animal[
                        "species"
                    ],

                "date":
                    date.strftime(
                        "%Y-%m-%d"
                    ),

                "day_index":
                    day_number,

                "age_years":
                    float(
                        animal[
                            "age_years"
                        ]
                    ),

                "parity":
                    int(
                        animal[
                            "parity"
                        ]
                    ),

                "days_in_milk":
                    float(
                        np.clip(
                            starting_dim
                            +
                            day_number
                            -
                            1,
                            1,
                            500
                        )
                    ),

                "milk_yield_kg":
                    float(
                        milk_yield
                    ),

                "milk_temperature":
                    float(
                        milk_temperature
                    ),

                "milk_pH":
                    float(
                        milk_pH
                    ),

                "milk_conductivity":
                    float(
                        milk_conductivity
                    ),

                "scc":
                    float(
                        scc
                    ),

                "body_temperature":
                    float(
                        body_temperature
                    ),

                "rumination_min":
                    float(
                        rumination_min
                    ),

                "activity_index":
                    float(
                        activity_index
                    ),

                "feed_intake":
                    float(
                        feed_intake
                    ),

                "ambient_temperature":
                    float(
                        ambient_temperature
                    ),

                "humidity":
                    float(
                        humidity
                    ),

                "thi":
                    float(
                        thi
                    ),

                "mastitis_within_7d":
                    mastitis_within_7d,

                "mastitis_within_14d":
                    mastitis_within_14d,

                "data_origin":
                    "SYNTHETIC_DEVELOPMENT",
            })

            # Update temporal state.
            current.update({

                "milk_yield_kg":
                    milk_yield,

                "milk_temperature":
                    milk_temperature,

                "milk_pH":
                    milk_pH,

                "milk_conductivity":
                    milk_conductivity,

                "scc":
                    scc,

                "body_temperature":
                    body_temperature,

                "rumination_min":
                    rumination_min,

                "activity_index":
                    activity_index,

                "feed_intake":
                    feed_intake,

                "ambient_temperature":
                    ambient_temperature,

                "humidity":
                    humidity,
            })

    dataframe = pd.DataFrame(
        records
    )

    # ============================================================
    # VALIDATION
    # ============================================================

    print()
    print("=" * 80)
    print(
        "SYNTHETIC DATA QUALITY CHECK"
    )
    print("=" * 80)

    expected_rows = (
        N_ANIMALS
        *
        N_DAYS
    )

    duplicate_count = int(
        dataframe.duplicated(
            [
                "animal_id",
                "date"
            ]
        ).sum()
    )

    missing_count = int(
        dataframe.isna().sum().sum()
    )

    animal_count = int(
        dataframe[
            "animal_id"
        ].nunique()
    )

    # THI must exactly agree with temperature + humidity.
    recalculated_thi = calculate_thi(
        dataframe[
            "ambient_temperature"
        ].to_numpy(),

        dataframe[
            "humidity"
        ].to_numpy()
    )

    thi_error = float(
        np.max(
            np.abs(
                dataframe[
                    "thi"
                ].to_numpy()
                -
                recalculated_thi
            )
        )
    )

    print(
        f"Rows:                 {len(dataframe)}"
    )

    print(
        f"Expected rows:        {expected_rows}"
    )

    print(
        f"Animals:              {animal_count}"
    )

    print(
        f"Animal-date duplicates:{duplicate_count}"
    )

    print(
        f"Missing cells:        {missing_count}"
    )

    print(
        f"THI max error:        {thi_error:.12f}"
    )

    # ------------------------------------------------------------
    # RANGE CHECKS
    # ------------------------------------------------------------

    range_results = []

    print()
    print(
        "RANGE CHECKS"
    )
    print("-" * 80)

    for feature in calibration_features:

        combined = pd.concat(
            [
                calibration[
                    feature
                ]["real"],

                calibration[
                    feature
                ]["public"],
            ],
            ignore_index=True
        )

        bounds = robust_bounds(
            combined,
            feature
        )

        if bounds:

            lower, upper = bounds

            violation_mask = (

                (
                    dataframe[
                        feature
                    ]
                    <
                    lower
                )

                |

                (
                    dataframe[
                        feature
                    ]
                    >
                    upper
                )
            )

            violations = int(
                violation_mask.sum()
            )

        else:

            lower = None
            upper = None
            violations = 0

        range_results.append({

            "feature":
                feature,

            "lower_bound":
                lower,

            "upper_bound":
                upper,

            "violations":
                violations,
        })

        print(
            f"{feature:24s}"
            f" | violations={violations}"
        )

    range_dataframe = pd.DataFrame(
        range_results
    )

    total_range_violations = int(
        range_dataframe[
            "violations"
        ].sum()
    )

    # ------------------------------------------------------------
    # TARGET CHECK
    # ------------------------------------------------------------

    target_7_positive = int(
        dataframe[
            "mastitis_within_7d"
        ].sum()
    )

    target_14_positive = int(
        dataframe[
            "mastitis_within_14d"
        ].sum()
    )

    target_7_rate = float(
        dataframe[
            "mastitis_within_7d"
        ].mean()
    )

    target_14_rate = float(
        dataframe[
            "mastitis_within_14d"
        ].mean()
    )

    print()
    print(
        "TARGET DISTRIBUTION"
    )
    print("-" * 80)

    print(
        f"7-day:"
        f" {target_7_positive:,}"
        f" positive rows"
        f" ({target_7_rate:.4%})"
    )

    print(
        f"14-day:"
        f" {target_14_positive:,}"
        f" positive rows"
        f" ({target_14_rate:.4%})"
    )

    # ------------------------------------------------------------
    # FINAL STATUS
    # ------------------------------------------------------------

    validation_pass = (

        len(dataframe)
        ==
        expected_rows

        and

        animal_count
        ==
        N_ANIMALS

        and

        duplicate_count
        ==
        0

        and

        missing_count
        ==
        0

        and

        thi_error
        <
        1e-8

        and

        total_range_violations
        ==
        0
    )

    status = (
        "PASS"
        if validation_pass
        else
        "FAIL"
    )

    # ============================================================
    # SAVE FILES
    # ============================================================

    dataset_path = (
        SYNTHETIC_ROOT
        /
        "gorakshak_synthetic_longitudinal_v2.csv"
    )

    animal_path = (
        SYNTHETIC_ROOT
        /
        "synthetic_animal_master_v2.csv"
    )

    validation_path = (
        PROCESSED_ROOT
        /
        "gorakshak_synthetic_validation_v2.csv"
    )

    report_path = (
        PROCESSED_ROOT
        /
        "gorakshak_synthetic_calibration_report_v2.json"
    )

    dataframe.to_csv(
        dataset_path,
        index=False
    )

    animals.to_csv(
        animal_path,
        index=False
    )

    range_dataframe.to_csv(
        validation_path,
        index=False
    )

    report = {

        "project":
            "GoRakshak",

        "generator":
            "generate_synthetic_data_v2.py",

        "seed":
            SEED,

        "rows":
            int(len(dataframe)),

        "animals":
            int(animal_count),

        "days_per_animal":
            N_DAYS,

        "expected_rows":
            expected_rows,

        "duplicate_animal_date_rows":
            duplicate_count,

        "missing_cells":
            missing_count,

        "thi_max_error":
            thi_error,

        "synthetic_event_animal_rate":
            SYNTHETIC_EVENT_ANIMAL_RATE,

        "target_7_day_positive_rows":
            target_7_positive,

        "target_7_day_positive_rate":
            target_7_rate,

        "target_14_day_positive_rows":
            target_14_positive,

        "target_14_day_positive_rate":
            target_14_rate,

        "calibration_sources":
            calibration_sources,

        "real_files":
            {
                key: [
                    str(path)
                    for path in paths
                ]
                for key, paths
                in real_files.items()
            },

        "public_files":
            {
                name:
                    str(path)

                for name, path
                in public_files.items()
            },

        "range_validation":
            range_results,

        "status":
            status,

        "scientific_note":
            (
                "This synthetic dataset is for model "
                "development and temporal pipeline testing. "
                "Synthetic mastitis targets are development "
                "labels, not observed real-world incidence, "
                "and must not be reported as real-world "
                "validation."
            ),
    }

    report_path.write_text(
        json.dumps(
            report,
            indent=2
        ),
        encoding="utf-8"
    )

    # ============================================================
    # OUTPUT
    # ============================================================

    print()
    print("=" * 80)
    print(
        "GENERATION COMPLETE"
    )
    print("=" * 80)

    print()
    print(
        "Dataset:"
    )

    print(
        dataset_path
    )

    print()
    print(
        "Animal master:"
    )

    print(
        animal_path
    )

    print()
    print(
        "Validation:"
    )

    print(
        validation_path
    )

    print()
    print(
        "Calibration report:"
    )

    print(
        report_path
    )

    print()
    print(
        "=" * 80
    )

    print(
        f"FINAL STATUS: {status}"
    )

    print(
        "=" * 80
    )

    if status == "PASS":

        print()
        print(
            "NEXT STEP:"
        )

        print(
            "Build the leakage-safe "
            "7-day / 14-day forecasting dataset."
        )

    else:

        print()
        print(
            "DO NOT TRAIN THE MODEL YET."
        )

        print(
            "Review the validation report first."
        )


# ================================================================
# ENTRY POINT
# ================================================================

if __name__ == "__main__":

    main()