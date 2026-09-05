import os
from pathlib import Path
import pandas as pd

# ============================================================
# GoRakshak Dataset Scanner
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_ROOT = PROJECT_ROOT / "ai-ml" / "data"

PUBLIC_DIR = DATA_ROOT / "public"
REAL_DIR = DATA_ROOT / "real"

print("=" * 70)
print("              GoRakshak Dataset Scanner")
print("=" * 70)

print(f"\nProject: {PROJECT_ROOT}")
print(f"Data:    {DATA_ROOT}")

if not DATA_ROOT.exists():
    print("\nERROR: Data folder not found.")
    raise SystemExit(1)


def scan_folder(folder, category):
    print("\n" + "-" * 70)
    print(f"{category.upper()} DATA")
    print("-" * 70)

    if not folder.exists():
        print(f"Folder not found: {folder}")
        return []

    files = []

    for path in folder.rglob("*"):
        if path.is_file():
            files.append(path)

    print(f"Files found: {len(files)}")

    results = []

    for path in files:
        suffix = path.suffix.lower()

        if suffix not in [".csv", ".xlsx", ".xls"]:
            continue

        try:
            if suffix == ".csv":
                df = pd.read_csv(path, low_memory=False)
            else:
                df = pd.read_excel(path)

            rows, cols = df.shape

            results.append({
                "category": category,
                "file": path.name,
                "path": str(path.relative_to(PROJECT_ROOT)),
                "type": suffix,
                "rows": rows,
                "columns": cols,
            })

            print(
                f"[OK] {category:<8} | "
                f"{path.name:<55} | "
                f"{rows:>10,} rows | {cols:>3} cols"
            )

        except Exception as e:
            print(
                f"[ERROR] {category:<8} | "
                f"{path.name:<55} | {str(e)[:100]}"
            )

    return results


public_results = scan_folder(PUBLIC_DIR, "public")
real_results = scan_folder(REAL_DIR, "real")

all_results = public_results + real_results

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)

print(f"Public datasets read successfully : {len(public_results)}")
print(f"Real datasets read successfully   : {len(real_results)}")
print(f"Total datasets read               : {len(all_results)}")

if all_results:
    report = pd.DataFrame(all_results)

    output_dir = DATA_ROOT / "processed"
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / "dataset_inventory.csv"
    report.to_csv(output_file, index=False)

    print(f"\nInventory saved to:")
    print(output_file)

    print("\nDataset inventory:")
    print(
        report[
            ["category", "file", "rows", "columns"]
        ].to_string(index=False)
    )

print("\n" + "=" * 70)
print("Scan complete.")
print("=" * 70)
