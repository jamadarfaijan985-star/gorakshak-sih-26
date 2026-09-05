from pathlib import Path
import json
import warnings

import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    classification_report,
)

from xgboost import XGBClassifier

warnings.filterwarnings("ignore")


# ============================================================
# GoRakshak Baseline Training
# ============================================================

ROOT = Path(__file__).resolve().parents[2]

DATA = ROOT / "ai-ml" / "data"
PUBLIC = DATA / "public"
PROCESSED = DATA / "processed"
MODELS = ROOT / "ai-ml" / "models"

PROCESSED.mkdir(parents=True, exist_ok=True)
MODELS.mkdir(parents=True, exist_ok=True)


# ------------------------------------------------------------
# Find canonical harmonized files anywhere inside public/
# ------------------------------------------------------------

def find_file(filename):
    matches = list(PUBLIC.rglob(filename))

    if not matches:
        raise FileNotFoundError(
            f"Could not find {filename} inside {PUBLIC}"
        )

    # Use first canonical copy.
    return matches[0]


# ------------------------------------------------------------
# Load
# ------------------------------------------------------------

print("=" * 70)
print("              GoRakshak AI Baseline Training")
print("=" * 70)

cow_milk_path = find_file("cow_milk_mastitis_harmonized.csv")
cow_clinical_path = find_file("cow_clinical_mastitis_harmonized.csv")
buffalo_path = find_file("buffalo_scm_core_harmonized.csv")

print("\nLoading datasets...")

cow_milk = pd.read_csv(cow_milk_path, low_memory=False)
cow_clinical = pd.read_csv(cow_clinical_path, low_memory=False)
buffalo = pd.read_csv(buffalo_path, low_memory=False)

print(f"Cow milk dataset     : {cow_milk.shape}")
print(f"Cow clinical dataset : {cow_clinical.shape}")
print(f"Buffalo SCM dataset  : {buffalo.shape}")


# ------------------------------------------------------------
# Label detection
# ------------------------------------------------------------

def find_label(df):
    candidates = [
        "source_label",
        "mastitis_label",
        "mastitis_status",
        "B_mastitis",
        "class1",
    ]

    for col in candidates:
        if col in df.columns:
            return col

    raise ValueError(
        f"No recognized label column. Columns: {list(df.columns)}"
    )


# ------------------------------------------------------------
# Clean label
# ------------------------------------------------------------

def clean_binary_label(df, label_col):
    out = df.copy()

    out["_target"] = pd.to_numeric(
        out[label_col], errors="coerce"
    )

    out = out[out["_target"].isin([0, 1])].copy()

    out["_target"] = out["_target"].astype(int)

    return out


# ------------------------------------------------------------
# Remove obvious identifiers / leakage / metadata
# ------------------------------------------------------------

def remove_bad_features(df):
    drop_cols = {
        "_target",

        # IDs
        "animal_id",
        "cow_id",
        "Cow_ID",
        "AID",
        "ID",
        "id",

        # Source/provenance
        "source_dataset",
        "source_label",
        "source_type",
        "source_reference",

        # Direct target variants
        "mastitis_label",
        "mastitis_status",
        "B_mastitis",
        "class1",

        # Diagnostic labels / direct outcome fields
        "diagnosis",
        "diagnostic_id",
        "event_type",
        "outcome",
    }

    keep = [
        c for c in df.columns
        if c not in drop_cols
    ]

    return df[keep].copy()


# ------------------------------------------------------------
# Normalize columns
# ------------------------------------------------------------

def normalize_columns(df):
    out = df.copy()

    # Convert obvious empty strings to NaN.
    out = out.replace(
        ["", " ", "NA", "N/A", "NULL", "null",
         "NOT_AVAILABLE", "Not Available"],
        np.nan
    )

    # Convert boolean-like text.
    for col in out.columns:
        if out[col].dtype == object:
            values = (
                out[col]
                .dropna()
                .astype(str)
                .str.strip()
                .str.lower()
                .unique()
            )

            if set(values).issubset(
                {"yes", "no", "true", "false", "0", "1"}
            ):
                out[col] = (
                    out[col]
                    .astype(str)
                    .str.strip()
                    .str.lower()
                    .map({
                        "yes": 1,
                        "true": 1,
                        "1": 1,
                        "no": 0,
                        "false": 0,
                        "0": 0,
                    })
                )

    return out


# ------------------------------------------------------------
# Prepare a dataset
# ------------------------------------------------------------

def prepare_dataset(df, label_name):
    label_col = find_label(df)

    df = clean_binary_label(df, label_col)
    y = df["_target"].copy()

    X = remove_bad_features(df)
    X = normalize_columns(X)

    # Drop columns that are completely empty.
    X = X.dropna(axis=1, how="all")

    return X, y


# ------------------------------------------------------------
# Train one model
# ------------------------------------------------------------

def train_model(X, y, model_name):

    print("\n" + "=" * 70)
    print(f"TRAINING: {model_name}")
    print("=" * 70)

    print("\nSamples:", len(X))
    print("Features:", len(X.columns))
    print("\nClass distribution:")
    print(y.value_counts().sort_index())

    # Stratified split.
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    categorical_cols = X_train.select_dtypes(
        include=["object", "category", "bool"]
    ).columns.tolist()

    numeric_cols = [
        c for c in X_train.columns
        if c not in categorical_cols
    ]

    numeric_pipeline = Pipeline([
        (
            "imputer",
            SimpleImputer(strategy="median")
        )
    ])

    categorical_pipeline = Pipeline([
        (
            "imputer",
            SimpleImputer(strategy="most_frequent")
        ),
        (
            "encoder",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=True
            )
        )
    ])

    transformers = []

    if numeric_cols:
        transformers.append(
            ("numeric", numeric_pipeline, numeric_cols)
        )

    if categorical_cols:
        transformers.append(
            ("categorical", categorical_pipeline, categorical_cols)
        )

    preprocessor = ColumnTransformer(
        transformers=transformers,
        remainder="drop",
    )

    # --------------------------------------------------------
    # XGBoost
    # --------------------------------------------------------

    model = XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="binary:logistic",
        eval_metric="logloss",
        tree_method="hist",
        device="cuda",
        random_state=42,
        n_jobs=4,
    )

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", model),
    ])

    print("\nTraining XGBoost on GPU...")
    pipeline.fit(X_train, y_train)

    print("Training complete.")

    # --------------------------------------------------------
    # Evaluation
    # --------------------------------------------------------

    probabilities = pipeline.predict_proba(X_test)[:, 1]

    predictions = (
        probabilities >= 0.50
    ).astype(int)

    metrics = {
        "model": model_name,
        "samples": int(len(X)),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "features_before_encoding": int(len(X.columns)),
        "accuracy": float(
            accuracy_score(y_test, predictions)
        ),
        "precision": float(
            precision_score(
                y_test,
                predictions,
                zero_division=0
            )
        ),
        "recall": float(
            recall_score(
                y_test,
                predictions,
                zero_division=0
            )
        ),
        "f1": float(
            f1_score(
                y_test,
                predictions,
                zero_division=0
            )
        ),
        "roc_auc": float(
            roc_auc_score(
                y_test,
                probabilities
            )
        ),
        "pr_auc": float(
            average_precision_score(
                y_test,
                probabilities
            )
        ),
        "confusion_matrix": confusion_matrix(
            y_test,
            predictions
        ).tolist(),
    }

    print("\nRESULTS")
    print("-" * 50)

    for key, value in metrics.items():
        print(f"{key}: {value}")

    print("\nClassification report:")
    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0
        )
    )

    # --------------------------------------------------------
    # Save model
    # --------------------------------------------------------

    model_path = MODELS / f"{model_name}.joblib"
    metrics_path = PROCESSED / f"{model_name}_metrics.json"

    joblib.dump(
        pipeline,
        model_path
    )

    with open(metrics_path, "w") as f:
        json.dump(
            metrics,
            f,
            indent=4
        )

    print("\nSaved model:")
    print(model_path)

    print("\nSaved metrics:")
    print(metrics_path)

    return metrics


# ============================================================
# COW
# ============================================================

cow_milk_X, cow_milk_y = prepare_dataset(
    cow_milk,
    "cow_milk"
)

cow_clinical_X, cow_clinical_y = prepare_dataset(
    cow_clinical,
    "cow_clinical"
)

# Align the two cow datasets to a common feature space.
common_features = sorted(
    set(cow_milk_X.columns)
    | set(cow_clinical_X.columns)
)

cow_milk_X = cow_milk_X.reindex(
    columns=common_features
)

cow_clinical_X = cow_clinical_X.reindex(
    columns=common_features
)

cow_X = pd.concat(
    [cow_milk_X, cow_clinical_X],
    ignore_index=True
)

cow_y = pd.concat(
    [cow_milk_y, cow_clinical_y],
    ignore_index=True
)

cow_metrics = train_model(
    cow_X,
    cow_y,
    "gorakshak_cow_baseline"
)


# ============================================================
# BUFFALO
# ============================================================

buffalo_X, buffalo_y = prepare_dataset(
    buffalo,
    "buffalo"
)

buffalo_metrics = train_model(
    buffalo_X,
    buffalo_y,
    "gorakshak_buffalo_baseline"
)


# ============================================================
# FINAL SUMMARY
# ============================================================

summary = {
    "cow": cow_metrics,
    "buffalo": buffalo_metrics,
}

summary_path = PROCESSED / "baseline_training_summary.json"

with open(summary_path, "w") as f:
    json.dump(
        summary,
        f,
        indent=4
    )

print("\n" + "=" * 70)
print("              GoRakshak BASELINE COMPLETE")
print("=" * 70)

print("\nModels saved in:")
print(MODELS)

print("\nTraining summary:")
print(summary_path)