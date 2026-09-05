
"""
GoRakshak SIH 2026
Synthetic-vs-Source Statistical Validation V1

Purpose:
- Validate the PASSED V2.2 synthetic longitudinal development dataset
  against the same REAL/PUBLIC numeric calibration sources.
- This is NOT a clinical validation and does NOT establish epidemiological accuracy.
- No mastitis labels/diagnostic columns are used for feature distribution comparison.

Run from D:\GoRakshak:
    python ai-ml\src\validate_synthetic_v1.py
"""

from pathlib import Path
import json
import re
import numpy as np
import pandas as pd
from scipy.stats import ks_2samp, wasserstein_distance

ROOT = Path(r"D:\GoRakshak")
REAL_ROOT = ROOT / "ai-ml" / "data" / "real"
PUBLIC_ROOT = ROOT / "ai-ml" / "data" / "public"
SYNTH_PATH = ROOT / "ai-ml" / "data" / "synthetic" / "gorakshak_synthetic_longitudinal_v2.csv"
OUT_ROOT = ROOT / "ai-ml" / "data" / "processed"
OUT_ROOT.mkdir(parents=True, exist_ok=True)

FEATURES = [
    "age_years", "parity", "days_in_milk", "milk_yield_kg",
    "milk_temperature", "milk_pH", "milk_conductivity", "scc",
    "body_temperature", "rumination_min", "activity_index",
    "feed_intake", "ambient_temperature", "humidity", "thi"
]

ALIASES = {
    "age_years": ["age_years", "age", "age_year"],
    "parity": ["parity", "lactation_number"],
    "days_in_milk": ["days_in_milk", "dim", "days after calving", "days_after_calving"],
    "milk_yield_kg": ["milk_yield_kg", "milk_yield", "yield_kg", "milk"],
    "milk_temperature": ["milk_temperature", "temperature_milk", "milk_temp"],
    "milk_pH": ["milk_ph", "ph", "milk_p_h"],
    "milk_conductivity": ["milk_conductivity", "conductivity_avg", "conductivity"],
    "scc": ["scc", "somatic_cell_count", "somaticcellcount"],
    "body_temperature": ["body_temperature", "body_temp", "temperature_body"],
    "rumination_min": ["rumination_min", "rumination", "rumination_minutes"],
    "activity_index": ["activity_index", "activity", "activity_score"],
    "feed_intake": ["feed_intake", "feed_intake_robot", "feed_intake_kg"],
    "ambient_temperature": ["ambient_temperature", "ambient_temp", "air_temperature", "air_temp"],
    "humidity": ["humidity", "relative_humidity", "rh"],
    "thi": ["thi", "temperature_humidity_index", "heat_stress_index"],
}

# Only sources that are appropriate as feature-distribution anchors.
PUBLIC_FILES = [
    PUBLIC_ROOT / "new dataset" / "milking_robot_dataset_combined.csv",
    PUBLIC_ROOT / "new dataset 2 cow -20260902T091649Z-1-001" /
        "new dataset 2 cow" / "archive (1)" / "cattle_milk_yield_1000.csv",
    PUBLIC_ROOT / "SIH26109_harmonized_public_staging" / "cow_milk_mastitis_harmonized.csv",
    PUBLIC_ROOT / "SIH26109_harmonized_public_staging" / "cow_clinical_mastitis_harmonized.csv",
    PUBLIC_ROOT / "SIH26109_harmonized_public_staging" / "buffalo_scm_core_harmonized.csv",
]

REAL_FILES = (
    list(REAL_ROOT.rglob("milk_records.csv"))
    + list(REAL_ROOT.rglob("environment_records.csv"))
)

def norm(x):
    return re.sub(r"[^a-z0-9]+", "_", str(x).strip().lower()).strip("_")

def find_col(df, aliases):
    normed = {norm(c): c for c in df.columns}
    for a in aliases:
        if norm(a) in normed:
            return normed[norm(a)]
    for c in df.columns:
        nc = norm(c)
        for a in aliases:
            na = norm(a)
            if na and (na in nc or nc in na):
                return c
    return None

def safe_read(path):
    try:
        return pd.read_csv(path, low_memory=False)
    except Exception:
        return None

def get_series(df, feature):
    c = find_col(df, ALIASES[feature])
    if c is None:
        return pd.Series(dtype=float)
    s = pd.to_numeric(df[c], errors="coerce").replace([np.inf, -np.inf], np.nan).dropna()
    return s

def pooled_sources(paths, feature):
    pieces = []
    used = []
    for p in paths:
        df = safe_read(p)
        if df is None:
            continue
        s = get_series(df, feature)
        if len(s):
            pieces.append(s)
            used.append((str(p), int(len(s))))
    if pieces:
        return pd.concat(pieces, ignore_index=True), used
    return pd.Series(dtype=float), used

def summary(s):
    if len(s) == 0:
        return {}
    q = s.quantile([0.01, 0.25, 0.5, 0.75, 0.99])
    return {
        "n": int(len(s)),
        "mean": float(s.mean()),
        "std": float(s.std(ddof=1)) if len(s) > 1 else 0.0,
        "min": float(s.min()),
        "p01": float(q.loc[0.01]),
        "p25": float(q.loc[0.25]),
        "median": float(q.loc[0.50]),
        "p75": float(q.loc[0.75]),
        "p99": float(q.loc[0.99]),
        "max": float(s.max()),
    }

def rel_diff(a, b):
    den = max(abs(a), abs(b), 1e-9)
    return abs(a - b) / den

def main():
    if not SYNTH_PATH.exists():
        raise FileNotFoundError(f"Synthetic dataset not found: {SYNTH_PATH}")

    synth = pd.read_csv(SYNTH_PATH)
    print("\n=== GoRakshak Synthetic-vs-Source Validation V1 ===\n")
    print("Synthetic:", SYNTH_PATH)
    print("Shape:", synth.shape)

    # Structural checks
    structural = {
        "rows": int(len(synth)),
        "animals": int(synth["animal_id"].nunique()),
        "animal_date_duplicates": int(synth.duplicated(["animal_id", "date"]).sum()),
        "missing_cells": int(synth.isna().sum().sum()),
        "static_age_drift_animals": int(
            (synth.groupby("animal_id")["age_years"].nunique() > 1).sum()
        ),
        "static_parity_drift_animals": int(
            (synth.groupby("animal_id")["parity"].nunique() > 1).sum()
        ),
    }

    # Build empirical source pool.
    source_paths = [p for p in REAL_FILES if p.exists()] + [p for p in PUBLIC_FILES if p.exists()]

    rows = []
    report = {
        "purpose": "Statistical distribution check of synthetic development data against source feature pools.",
        "warning": "Passing this check does not prove clinical validity, biological realism, or real-world forecasting performance.",
        "synthetic_path": str(SYNTH_PATH),
        "structural": structural,
        "features": {},
        "thresholds": {
            "ks_pvalue": 0.01,
            "median_relative_difference_warning": 0.25,
            "wasserstein_normalized_warning": 0.25
        }
    }

    for feature in FEATURES:
        ss = pd.to_numeric(synth[feature], errors="coerce").dropna()
        src, used = pooled_sources(source_paths, feature)

        if len(ss) == 0 or len(src) == 0:
            report["features"][feature] = {
                "status": "NOT_ASSESSED",
                "reason": "No usable source or synthetic values."
            }
            continue

        ks = ks_2samp(ss, src, alternative="two-sided", method="auto")
        wd = wasserstein_distance(ss.to_numpy(), src.to_numpy())
        src_iqr = float(src.quantile(.75) - src.quantile(.25))
        normalized_wd = wd / max(src_iqr, 1e-9)

        sm = summary(ss)
        rm = summary(src)

        median_rel = rel_diff(sm["median"], rm["median"])

        # This is a screening status, not a pass/fail biological criterion.
        if median_rel <= 0.25 and normalized_wd <= 0.25:
            status = "GOOD"
        elif median_rel <= 0.50 and normalized_wd <= 0.50:
            status = "REVIEW"
        else:
            status = "LARGE_DIFFERENCE"

        report["features"][feature] = {
            "status": status,
            "synthetic": sm,
            "source_pool": rm,
            "ks_statistic": float(ks.statistic),
            "ks_pvalue": float(ks.pvalue),
            "wasserstein_distance": float(wd),
            "wasserstein_normalized_by_source_iqr": float(normalized_wd),
            "median_relative_difference": float(median_rel),
            "source_files": used,
        }

        rows.append({
            "feature": feature,
            "status": status,
            "synthetic_n": len(ss),
            "source_n": len(src),
            "synthetic_mean": sm["mean"],
            "source_mean": rm["mean"],
            "synthetic_median": sm["median"],
            "source_median": rm["median"],
            "synthetic_std": sm["std"],
            "source_std": rm["std"],
            "ks_statistic": float(ks.statistic),
            "ks_pvalue": float(ks.pvalue),
            "wasserstein_distance": float(wd),
            "normalized_wasserstein": float(normalized_wd),
            "median_relative_difference": float(median_rel),
        })

    # Temporal/target checks
    target_check = {
        "7d_positive_rate_rows": float(synth["mastitis_within_7d"].mean()),
        "14d_positive_rate_rows": float(synth["mastitis_within_14d"].mean()),
        "7d_positive_rows": int(synth["mastitis_within_7d"].sum()),
        "14d_positive_rows": int(synth["mastitis_within_14d"].sum()),
        "animals_with_7d_positive": int(
            synth.groupby("animal_id")["mastitis_within_7d"].max().sum()
        ),
        "animals_with_14d_positive": int(
            synth.groupby("animal_id")["mastitis_within_14d"].max().sum()
        ),
    }

    # Target consistency: every 7d positive must also be 14d positive.
    target_check["target_nested_violations"] = int(
        ((synth["mastitis_within_7d"] == 1) &
         (synth["mastitis_within_14d"] == 0)).sum()
    )

    report["target_check"] = target_check

    result = pd.DataFrame(rows)
    result_path = OUT_ROOT / "synthetic_vs_source_statistical_validation_v1.csv"
    report_path = OUT_ROOT / "synthetic_vs_source_statistical_validation_v1.json"

    result.to_csv(result_path, index=False)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print("\nSTRUCTURAL CHECKS")
    for k, v in structural.items():
        print(f"  {k}: {v}")

    print("\nFEATURE COMPARISON")
    if len(result):
        print(result[[
            "feature", "status", "synthetic_n", "source_n",
            "synthetic_median", "source_median",
            "ks_pvalue", "normalized_wasserstein"
        ]].to_string(index=False))

    print("\nTARGET CHECK")
    for k, v in target_check.items():
        print(f"  {k}: {v}")

    good = int((result["status"] == "GOOD").sum()) if len(result) else 0
    review = int((result["status"] == "REVIEW").sum()) if len(result) else 0
    large = int((result["status"] == "LARGE_DIFFERENCE").sum()) if len(result) else 0

    print("\nSCREENING SUMMARY")
    print(f"  GOOD: {good}")
    print(f"  REVIEW: {review}")
    print(f"  LARGE_DIFFERENCE: {large}")

    print("\nSaved:")
    print(f"  {result_path}")
    print(f"  {report_path}")

    if (
        structural["rows"] == 27000
        and structural["animals"] == 300
        and structural["animal_date_duplicates"] == 0
        and structural["missing_cells"] == 0
        and structural["static_age_drift_animals"] == 0
        and structural["static_parity_drift_animals"] == 0
        and target_check["target_nested_violations"] == 0
    ):
        print("\nSTATUS: STRUCTURAL PASS — STATISTICAL REVIEW COMPLETE.")
        print("IMPORTANT: This does NOT mean clinically validated.")
    else:
        print("\nSTATUS: STRUCTURAL REVIEW REQUIRED.")

if __name__ == "__main__":
    main()
