"""
GoRakshak Model 3 - Rumination Dataset Audit & Feature Extraction V1

Purpose:
- Audit the raw annotated rumination recordings in:
  D:\GoRakshak\ai-ml\data\public\rumination\
- Keep source CSVs untouched.
- Convert Start/Finish/Label intervals into recording-level behavioral features.
- Produce a transparent audit report; DO NOT train a mastitis model.

Outputs:
  D:\GoRakshak\ai-ml\data\processed\rumination\
    rumination_recording_features_v1.csv
    rumination_interval_audit_v1.csv
    rumination_dataset_report_v1.json
"""

from pathlib import Path
import json
import pandas as pd
import numpy as np

RAW_ROOT = Path(r"D:\GoRakshak\ai-ml\data\public\rumination")
OUT = Path(r"D:\GoRakshak\ai-ml\data\processed\rumination")
OUT.mkdir(parents=True, exist_ok=True)

EXPECTED = {"Start", "Finish", "Label"}

def clean_label(x):
    return " ".join(str(x).strip().split())

def safe_seconds(x):
    return pd.to_numeric(x, errors="coerce")

rows = []
interval_rows = []
errors = []

csv_files = sorted(RAW_ROOT.rglob("*.csv"))

for fp in csv_files:
    try:
        df = pd.read_csv(fp)
        missing = EXPECTED - set(df.columns)
        if missing:
            errors.append({"file": str(fp), "error": f"Missing columns: {sorted(missing)}"})
            continue

        df = df.copy()
        df["Start"] = safe_seconds(df["Start"])
        df["Finish"] = safe_seconds(df["Finish"])
        df["Label"] = df["Label"].map(clean_label)

        df = df.dropna(subset=["Start", "Finish", "Label"])
        df["duration_sec"] = df["Finish"] - df["Start"]
        df["valid_interval"] = df["duration_sec"] >= 0

        if not df["valid_interval"].all():
            errors.append({
                "file": str(fp),
                "error": "One or more intervals have Finish < Start"
            })

        df = df[df["valid_interval"]].copy()

        # Recording/session identity is deliberately NOT called animal_id.
        # The filename alone does not prove animal identity.
        session_id = fp.stem
        day = fp.parent.parent.name if fp.parent.parent.name in {"Day 1", "Day 2"} else fp.parent.name

        total_duration = float(df["Finish"].max()) if len(df) else 0.0
        label_duration = df.groupby("Label")["duration_sec"].sum().to_dict()

        feat = {
            "session_id": session_id,
            "day": day,
            "source_file": str(fp),
            "interval_count": int(len(df)),
            "recording_duration_sec": total_duration,
            "recording_duration_min": total_duration / 60,
            "recording_duration_hr": total_duration / 3600,
            "label_count": int(df["Label"].nunique()),
            "labels": "|".join(sorted(df["Label"].unique())),
        }

        # One feature block per observed label.
        for label, dur in label_duration.items():
            key = (
                label.lower()
                .replace(" ", "_")
                .replace("/", "_")
                .replace("-", "_")
            )
            feat[f"{key}_duration_sec"] = float(dur)
            feat[f"{key}_percentage"] = (
                float(dur / total_duration * 100) if total_duration > 0 else np.nan
            )
            feat[f"{key}_episode_count"] = int((df["Label"] == label).sum())

        rum = df[df["Label"].str.lower().eq("rumination")]["duration_sec"]
        feat["rumination_duration_sec"] = float(rum.sum())
        feat["rumination_duration_min"] = float(rum.sum() / 60)
        feat["rumination_percentage"] = (
            float(rum.sum() / total_duration * 100) if total_duration > 0 else np.nan
        )
        feat["rumination_episode_count"] = int(len(rum))
        feat["rumination_mean_episode_sec"] = float(rum.mean()) if len(rum) else 0.0
        feat["rumination_max_episode_sec"] = float(rum.max()) if len(rum) else 0.0

        # Count label transitions in the annotated sequence.
        feat["behavior_transition_count"] = int((df["Label"].ne(df["Label"].shift())).sum() - 1)

        rows.append(feat)

        for _, r in df.iterrows():
            interval_rows.append({
                "session_id": session_id,
                "day": day,
                "source_file": str(fp),
                "start_sec": float(r["Start"]),
                "finish_sec": float(r["Finish"]),
                "duration_sec": float(r["duration_sec"]),
                "label": r["Label"],
            })

    except Exception as e:
        errors.append({"file": str(fp), "error": repr(e)})

features = pd.DataFrame(rows)
intervals = pd.DataFrame(interval_rows)

features.to_csv(OUT / "rumination_recording_features_v1.csv", index=False)
intervals.to_csv(OUT / "rumination_interval_audit_v1.csv", index=False)

report = {
    "dataset": "GoRakshak Model 3 Rumination/Behavior Annotated Recordings",
    "raw_root": str(RAW_ROOT),
    "csv_files_found": len(csv_files),
    "sessions_processed": int(len(features)),
    "intervals_processed": int(len(intervals)),
    "days": sorted(features["day"].dropna().unique().tolist()) if len(features) else [],
    "unique_session_ids": int(features["session_id"].nunique()) if len(features) else 0,
    "unique_labels": sorted(intervals["label"].dropna().unique().tolist()) if len(intervals) else [],
    "label_interval_counts": (
        intervals["label"].value_counts().to_dict() if len(intervals) else {}
    ),
    "label_duration_seconds": (
        intervals.groupby("label")["duration_sec"].sum().sort_values(ascending=False).to_dict()
        if len(intervals) else {}
    ),
    "errors": errors,
    "mastitis_ground_truth_present": False,
    "training_status": "AUDIT_ONLY_NO_MASTITIS_TRAINING",
    "important_note": (
        "These recordings contain annotated behavior intervals, not mastitis outcomes. "
        "They can support behavioral feature extraction, but cannot by themselves justify "
        "a rumination-to-mastitis classifier."
    ),
}

with open(OUT / "rumination_dataset_report_v1.json", "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2, default=str)

print("\n=== GoRakshak Model 3 Rumination Audit V1 ===")
print(f"CSV files found: {len(csv_files)}")
print(f"Sessions processed: {len(features)}")
print(f"Intervals processed: {len(intervals)}")
print(f"Unique labels: {report['unique_labels']}")
print("\nRecording-level features:")
if len(features):
    cols = [
        "session_id", "day", "recording_duration_hr",
        "rumination_duration_min", "rumination_percentage",
        "rumination_episode_count", "rumination_mean_episode_sec",
        "rumination_max_episode_sec", "behavior_transition_count"
    ]
    print(features[[c for c in cols if c in features.columns]].to_string(index=False))

print("\nLabel duration (hours):")
if report["label_duration_seconds"]:
    for k, v in report["label_duration_seconds"].items():
        print(f"  {k}: {v/3600:.3f}")

print("\nOutputs:")
print(OUT / "rumination_recording_features_v1.csv")
print(OUT / "rumination_interval_audit_v1.csv")
print(OUT / "rumination_dataset_report_v1.json")
print("\nSTATUS: AUDIT COMPLETE — NO MASTITIS MODEL TRAINED.")
