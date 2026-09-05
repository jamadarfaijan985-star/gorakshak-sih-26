from pathlib import Path
import json
import warnings

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
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
from sklearn.model_selection import train_test_split, GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")


# ============================================================
# GoRakshak AI Baseline V2
# Leakage-aware training
# ============================================================

ROOT = Path(r"D:\GoRakshak")

STAGING = (
    ROOT
    / "ai-ml"
    / "data"
    / "public"
    / "SIH26109_harmonized_public_staging"
)

MODEL_DIR = ROOT / "ai-ml" / "models"
PROCESSED_DIR = ROOT / "ai-ml" / "data" / "processed"

MODEL_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


COW_MILK = STAGING / "cow_milk_mastitis_harmonized.csv"
COW_CLINICAL = STAGING / "cow_clinical_mastitis_harmonized.csv"
BUFFALO = STAGING / "buffalo_scm_core_harmonized.csv"


# ============================================================
# Helpers
# ============================================================

def clean_binary_label(series):

    s = (
        series
        .astype(str)
        .str.strip()
        .str.lower()
    )

    mapping = {
        "0": 0,
        "1": 1,
        "0.0": 0,
        "1.0": 1,
        "no": 0,
        "yes": 1,
        "false": 0,
        "true": 1,
        "negative": 0,
        "positive": 1,
    }

    return s.map(mapping)


def build_preprocessor(X):

    numeric_cols = X.select_dtypes(
        include=["number"]
    ).columns.tolist()

    categorical_cols = X.select_dtypes(
        exclude=["number"]
    ).columns.tolist()

    numeric_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(
                    strategy="median"
                ),
            )
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(
                    strategy="most_frequent"
                ),
            ),
            (
                "onehot",
                OneHotEncoder(
                    handle_unknown="ignore"
                ),
            ),
        ]
    )

    return ColumnTransformer(
        transformers=[
            (
                "numeric",
                numeric_pipeline,
                numeric_cols,
            ),
            (
                "categorical",
                categorical_pipeline,
                categorical_cols,
            ),
        ],
        remainder="drop",
    )


def train_xgb(X_train, y_train):

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
    )

    pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                build_preprocessor(X_train),
            ),
            (
                "model",
                model,
            ),
        ]
    )

    print("\nTraining XGBoost on GPU...")
    pipeline.fit(X_train, y_train)
    print("Training complete.")

    return pipeline


def evaluate_model(
    model,
    X_test,
    y_test,
    model_name,
):

    probabilities = model.predict_proba(
        X_test
    )[:, 1]

    predictions = (
        probabilities >= 0.5
    ).astype(int)

    accuracy = accuracy_score(
        y_test,
        predictions,
    )

    precision = precision_score(
        y_test,
        predictions,
        zero_division=0,
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0,
    )

    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0,
    )

    roc_auc = roc_auc_score(
        y_test,
        probabilities,
    )

    pr_auc = average_precision_score(
        y_test,
        probabilities,
    )

    cm = confusion_matrix(
        y_test,
        predictions,
    )

    print("\nRESULTS")
    print("-" * 60)

    print("model:", model_name)
    print("test_samples:", len(y_test))
    print("accuracy:", round(accuracy, 6))
    print("precision:", round(precision, 6))
    print("recall:", round(recall, 6))
    print("f1:", round(f1, 6))
    print("roc_auc:", round(roc_auc, 6))
    print("pr_auc:", round(pr_auc, 6))
    print("confusion_matrix:", cm.tolist())

    print("\nClassification report:")
    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0,
        )
    )

    return {
        "model": model_name,
        "test_samples": int(len(y_test)),
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "roc_auc": float(roc_auc),
        "pr_auc": float(pr_auc),
        "confusion_matrix": cm.tolist(),
    }


# ============================================================
# COW MILK
# ============================================================

def train_cow_milk():

    print("\n" + "=" * 70)
    print("TRAINING: cow_milk_leakage_aware")
    print("=" * 70)

    df = pd.read_csv(COW_MILK)

    print("Original shape:", df.shape)

    y = clean_binary_label(
        df["source_label"]
    )

    valid = y.notna()

    y = y.loc[valid].astype(int).reset_index(drop=True)

    # Remove target, metadata and suspicious outcome feature.
    drop_columns = [
        "source_label",
        "label_definition",
        "clotting",
        "source_type",
        "source_dataset",
        "source_animal_id",
        "animal_id",
        "species",
        "date",
        "time",
        "source_day",
    ]

    drop_columns = [
        c for c in drop_columns
        if c in df.columns
    ]

    X = (
        df.loc[valid]
        .drop(columns=drop_columns)
        .reset_index(drop=True)
    )

    print("Samples:", len(X))

    print("\nClass distribution:")
    print(y.value_counts())

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        stratify=y,
        random_state=42,
    )

    print("\nTrain:", len(X_train))
    print("Test:", len(X_test))

    model = train_xgb(
        X_train,
        y_train,
    )

    metrics = evaluate_model(
        model,
        X_test,
        y_test,
        "cow_milk_leakage_aware",
    )

    model_path = (
        MODEL_DIR
        / "gorakshak_cow_milk_v2.joblib"
    )

    metrics_path = (
        PROCESSED_DIR
        / "gorakshak_cow_milk_v2_metrics.json"
    )

    joblib.dump(model, model_path)

    with open(
        metrics_path,
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            metrics,
            f,
            indent=2,
        )

    print("\nSaved model:", model_path)
    print("Saved metrics:", metrics_path)

    return metrics


# ============================================================
# COW CLINICAL
# ============================================================

def train_cow_clinical():

    print("\n" + "=" * 70)
    print("TRAINING: cow_clinical_group_aware")
    print("=" * 70)

    df = pd.read_csv(COW_CLINICAL)

    print("Original shape:", df.shape)

    y = clean_binary_label(
        df["source_label"]
    )

    valid = y.notna()

    y = y.loc[valid].astype(int).reset_index(drop=True)

    group_col = "source_animal_id"

    if group_col not in df.columns:
        group_col = "animal_id"

    groups = (
        df.loc[valid, group_col]
        .astype(str)
        .reset_index(drop=True)
    )

    # Remove direct/post-onset clinical indicators
    # for the early-risk version.
    drop_columns = [
        "source_label",
        "label_definition",
        "pain",
        "udder_hardness",
        "milk_visibility",
        "body_or_udder_temperature_source",
        "previous_mastitis",
        "source_type",
        "source_dataset",
        "source_animal_id",
        "animal_id",
        "species",
        "date",
        "time",
        "source_day",
    ]

    drop_columns = [
        c for c in drop_columns
        if c in df.columns
    ]

    X = (
        df.loc[valid]
        .drop(columns=drop_columns)
        .reset_index(drop=True)
    )

    print("Samples:", len(X))
    print("Unique animals:", groups.nunique())

    print("\nClass distribution:")
    print(y.value_counts())

    splitter = GroupShuffleSplit(
        n_splits=1,
        test_size=0.20,
        random_state=42,
    )

    train_idx, test_idx = next(
        splitter.split(
            X,
            y,
            groups=groups,
        )
    )

    X_train = X.iloc[train_idx]
    X_test = X.iloc[test_idx]

    y_train = y.iloc[train_idx]
    y_test = y.iloc[test_idx]

    train_groups = set(
        groups.iloc[train_idx]
    )

    test_groups = set(
        groups.iloc[test_idx]
    )

    overlap = train_groups & test_groups

    print("\nTrain animals:", len(train_groups))
    print("Test animals:", len(test_groups))
    print("Animal overlap:", len(overlap))

    if overlap:
        raise RuntimeError(
            "GROUP LEAKAGE DETECTED!"
        )

    print("\nTrain rows:", len(X_train))
    print("Test rows:", len(X_test))

    print("\nTrain class distribution:")
    print(y_train.value_counts())

    print("\nTest class distribution:")
    print(y_test.value_counts())

    model = train_xgb(
        X_train,
        y_train,
    )

    metrics = evaluate_model(
        model,
        X_test,
        y_test,
        "cow_clinical_group_aware",
    )

    model_path = (
        MODEL_DIR
        / "gorakshak_cow_clinical_v2.joblib"
    )

    metrics_path = (
        PROCESSED_DIR
        / "gorakshak_cow_clinical_v2_metrics.json"
    )

    joblib.dump(model, model_path)

    with open(
        metrics_path,
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            metrics,
            f,
            indent=2,
        )

    print("\nSaved model:", model_path)
    print("Saved metrics:", metrics_path)

    return metrics


# ============================================================
# BUFFALO SCM
# ============================================================

def train_buffalo():

    print("\n" + "=" * 70)
    print("TRAINING: buffalo_scm_baseline_v2")
    print("=" * 70)

    df = pd.read_csv(BUFFALO)

    print("Original shape:", df.shape)

    # The audit confirmed that mastitis_status is binary:
    # 963 positive, 402 negative, 9 missing.
    y = pd.to_numeric(
        df["mastitis_status"],
        errors="coerce",
    )

    valid = y.isin([0, 1])

    y = (
        y.loc[valid]
        .astype(int)
        .reset_index(drop=True)
    )

    # --------------------------------------------------------
    # IMPORTANT:
    #
    # Do NOT use:
    # - mastitis_status
    # - source_label
    # - scm_type
    # - bacterial_growth
    # - culture_negative
    # - any_pathogen
    # - bmscc
    # - cmt_score
    #
    # These are diagnosis/outcome-related variables and can
    # leak the mastitis status.
    # --------------------------------------------------------

    leakage_columns = [
        "mastitis_status",
        "source_label",
        "label_definition",
        "scm_type",
        "bacterial_growth",
        "culture_negative",
        "any_pathogen",
        "bmscc",
        "cmt_score",
    ]

    metadata_columns = [
        "source_type",
        "source_dataset",
        "source_animal_id",
        "animal_id",
        "species",
        "farm_id",
    ]

    drop_columns = (
        leakage_columns
        + metadata_columns
    )

    drop_columns = [
        c for c in drop_columns
        if c in df.columns
    ]

    X = (
        df.loc[valid]
        .drop(columns=drop_columns)
        .reset_index(drop=True)
    )

    print("Samples:", len(X))

    print("\nClass distribution:")
    print(y.value_counts())

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        stratify=y,
        random_state=42,
    )

    print("\nTrain:", len(X_train))
    print("Test:", len(X_test))

    model = train_xgb(
        X_train,
        y_train,
    )

    metrics = evaluate_model(
        model,
        X_test,
        y_test,
        "buffalo_scm_leakage_aware",
    )

    model_path = (
        MODEL_DIR
        / "gorakshak_buffalo_v2.joblib"
    )

    metrics_path = (
        PROCESSED_DIR
        / "gorakshak_buffalo_v2_metrics.json"
    )

    joblib.dump(model, model_path)

    with open(
        metrics_path,
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            metrics,
            f,
            indent=2,
        )

    print("\nSaved model:", model_path)
    print("Saved metrics:", metrics_path)

    return metrics


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 70)
    print("             GoRakshak AI BASELINE V2")
    print("             LEAKAGE-AWARE TRAINING")
    print("=" * 70)

    print("\nChecking dataset files...")

    for path in [
        COW_MILK,
        COW_CLINICAL,
        BUFFALO,
    ]:

        print(
            f"{path.name}:",
            "FOUND" if path.exists()
            else "NOT FOUND",
        )

    results = {}

    results["cow_milk"] = train_cow_milk()

    results["cow_clinical"] = train_cow_clinical()

    results["buffalo"] = train_buffalo()

    summary_path = (
        PROCESSED_DIR
        / "gorakshak_baseline_v2_summary.json"
    )

    with open(
        summary_path,
        "w",
        encoding="utf-8",
    ) as f:

        json.dump(
            results,
            f,
            indent=2,
        )

    print("\n" + "=" * 70)
    print("          GoRakshak BASELINE V2 COMPLETE")
    print("=" * 70)

    print("\nModels saved in:")
    print(MODEL_DIR)

    print("\nSummary saved:")
    print(summary_path)

    print("\nThese are leakage-aware classification baselines.")
    print("They are NOT yet 7-14 day forecasting results.")


if __name__ == "__main__":
    main()