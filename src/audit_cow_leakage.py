from pathlib import Path
import pandas as pd
import numpy as np

# ============================================================
# GoRakshak Cow Dataset Leakage Audit
# ============================================================

ROOT = Path(r"D:\GoRakshak\ai-ml\data\public")

# Harmonized datasets are inside this folder
STAGING = ROOT / "SIH26109_harmonized_public_staging"

FILES = {
    "milk_mastitis": STAGING / "cow_milk_mastitis_harmonized.csv",
    "clinical_mastitis": STAGING / "cow_clinical_mastitis_harmonized.csv",
}


# ============================================================
# Helper: convert common binary labels to 0/1
# ============================================================

def clean_label(series):

    s = series.astype(str).str.strip().str.lower()

    mapping = {
        "0": 0,
        "1": 1,
        "no": 0,
        "yes": 1,
        "false": 0,
        "true": 1,
        "negative": 0,
        "positive": 1,
    }

    return s.map(mapping)


# ============================================================
# Find likely label columns
# ============================================================

def find_label_columns(df):

    candidates = []

    for col in df.columns:

        name = col.lower()

        if any(keyword in name for keyword in [
            "mastitis",
            "class",
            "label",
            "target",
            "scm"
        ]):

            candidates.append(col)

    return candidates


# ============================================================
# Main audit
# ============================================================

print("=" * 80)
print("              GoRakshak Cow Dataset Leakage Audit")
print("=" * 80)


for dataset_name, path in FILES.items():

    print("\n\n" + "#" * 80)
    print(f"DATASET: {dataset_name}")
    print(f"FILE: {path}")
    print("#" * 80)

    # --------------------------------------------------------
    # Check file
    # --------------------------------------------------------

    if not path.exists():

        print("\nERROR: FILE NOT FOUND")
        print("Expected path:")
        print(path)

        continue

    # --------------------------------------------------------
    # Load
    # --------------------------------------------------------

    try:

        df = pd.read_csv(path)

    except Exception as e:

        print("\nERROR READING FILE:")
        print(e)

        continue


    print(f"\nShape: {df.shape}")

    # --------------------------------------------------------
    # Columns
    # --------------------------------------------------------

    print("\nColumns:")

    for col in df.columns:

        print(" -", col)


    # ========================================================
    # LABEL ANALYSIS
    # ========================================================

    label_candidates = find_label_columns(df)

    print("\nPossible label columns:")

    if label_candidates:

        for col in label_candidates:

            print(" -", col)

    else:

        print(" - None detected")


    for label_col in label_candidates:

        labels = clean_label(df[label_col])

        valid = labels.notna()

        if valid.sum() == 0:

            continue


        print("\n" + "-" * 70)
        print(f"LABEL ANALYSIS: {label_col}")
        print("-" * 70)

        print("Valid labels:", valid.sum())

        print("\nClass distribution:")

        print(
            labels.value_counts(
                dropna=False
            )
        )


        # ====================================================
        # FEATURE LEAKAGE CHECK
        # ====================================================

        print("\nPotentially suspicious features:")

        suspicious = []


        for col in df.columns:

            if col == label_col:

                continue


            s = df.loc[valid, col]

            nunique = s.nunique(
                dropna=False
            )

            missing_rate = s.isna().mean()


            # ------------------------------------------------
            # Low-cardinality categorical feature check
            # ------------------------------------------------

            if nunique <= 20:

                try:

                    table = pd.crosstab(
                        s.astype(str),
                        labels[valid],
                        normalize="index"
                    )


                    if table.shape[1] >= 2:

                        max_class_purity = (
                            table.max(axis=1).max()
                        )


                        if max_class_purity >= 0.98:

                            suspicious.append(
                                (
                                    col,
                                    nunique,
                                    missing_rate,
                                    max_class_purity
                                )
                            )

                except Exception:

                    pass


        if suspicious:

            suspicious.sort(
                key=lambda x: x[3],
                reverse=True
            )


            for (
                col,
                nunique,
                missing_rate,
                purity
            ) in suspicious:

                print(
                    f"  {col}: "
                    f"unique={nunique}, "
                    f"missing={missing_rate:.2%}, "
                    f"max_class_purity={purity:.2%}"
                )

        else:

            print(
                "  No obvious categorical leakage found."
            )


    # ========================================================
    # ANIMAL / GROUP LEAKAGE CHECK
    # ========================================================

    animal_candidates = [

        c for c in df.columns

        if any(
            keyword in c.lower()
            for keyword in [
                "animal_id",
                "cow_id",
                "source_animal",
                "animalid"
            ]
        )

    ]


    print("\nAnimal ID candidates:")

    if animal_candidates:

        for col in animal_candidates:

            print(" -", col)

    else:

        print(" - None detected")


    for animal_col in animal_candidates:

        print("\n" + "-" * 70)
        print(f"GROUP LEAKAGE CHECK: {animal_col}")
        print("-" * 70)


        # Remove missing IDs for this analysis

        valid_animals = (
            df[animal_col]
            .notna()
            &
            (
                df[animal_col]
                .astype(str)
                .str.strip()
                .str.lower()
                .isin([
                    "",
                    "nan",
                    "none",
                    "null",
                    "not_available",
                    "na"
                ])
                == False
            )
        )


        animal_df = df.loc[
            valid_animals
        ].copy()


        if animal_df.empty:

            print(
                "No usable animal IDs found."
            )

            continue


        group_sizes = (
            animal_df
            .groupby(animal_col)
            .size()
        )


        print(
            "Unique animals:",
            group_sizes.size
        )


        print("\nRows per animal:")

        print(
            group_sizes.describe()
        )


        # ----------------------------------------------------
        # Check whether each animal has one constant label
        # ----------------------------------------------------

        for label_col in label_candidates:

            labels = clean_label(
                animal_df[label_col]
            )


            temp = pd.DataFrame({
                "animal": animal_df[animal_col],
                "label": labels
            }).dropna()


            if temp.empty:

                continue


            label_counts = (
                temp
                .groupby("animal")["label"]
                .nunique()
            )


            constant_animals = (
                label_counts == 1
            ).sum()


            total_animals = (
                label_counts.size
            )


            percentage = (
                constant_animals /
                total_animals
            )


            print(
                f"\nLabel '{label_col}':"
            )

            print(
                f"  Constant-label animals: "
                f"{constant_animals}/{total_animals}"
            )

            print(
                f"  Percentage: "
                f"{percentage:.2%}"
            )


            # ------------------------------------------------
            # Important warning
            # ------------------------------------------------

            if percentage >= 0.95:

                print(
                    "  WARNING: Label is nearly constant "
                    "within each animal."
                )

                print(
                    "  Random row-level train/test splitting "
                    "can cause GROUP LEAKAGE."
                )


    # ========================================================
    # DUPLICATE ROW CHECK
    # ========================================================

    print("\n" + "-" * 70)
    print("DUPLICATE CHECK")
    print("-" * 70)


    duplicate_rows = df.duplicated().sum()

    print(
        "Exact duplicate rows:",
        duplicate_rows
    )


    # ========================================================
    # IDENTIFIER-LIKE FEATURES
    # ========================================================

    print("\n" + "-" * 70)
    print("IDENTIFIER-LIKE FEATURE CHECK")
    print("-" * 70)


    for col in df.columns:

        nunique = df[col].nunique(
            dropna=True
        )

        total = df[col].notna().sum()


        if total == 0:

            continue


        unique_ratio = (
            nunique / total
        )


        if unique_ratio >= 0.95:

            print(
                f"  {col}: "
                f"{nunique} unique / "
                f"{total} non-null "
                f"({unique_ratio:.2%})"
            )


# ============================================================
# COMPLETE
# ============================================================

print("\n\n" + "=" * 80)
print("                     AUDIT COMPLETE")
print("=" * 80)

print("""
IMPORTANT INTERPRETATION:

1. A very high cow score does NOT automatically mean the model
   is genuinely predicting future mastitis.

2. If the clinical dataset contains multiple observations for
   the same animal, random row-level splitting can put the same
   animal into both training and testing.

3. If an animal has the same mastitis class across its records,
   this can produce artificially high performance.

4. Features representing direct clinical symptoms may also be
   inappropriate for EARLY forecasting if they are measurements
   taken after mastitis is already clinically apparent.

5. The next GoRakshak training step will therefore use
   animal/group-aware validation where appropriate.

Do NOT use the 99.93% cow score in the SIH presentation yet.
""")

print("=" * 80)