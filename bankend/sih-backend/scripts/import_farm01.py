"""
Farm 01 Data Import Script - MongoDB Version

Per PRD §12: Reads the cleaned Farm 01 dataset (14 cows + 30 buffaloes) and imports into MongoDB.
Script must be idempotent (safe to re-run without duplicating records).

Usage:
    python scripts/import_farm01.py --csv-file data/farm01_animals.csv

For MVP demo: generates demo animals if no CSV is provided.
"""

import asyncio
import csv
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional
import uuid
import argparse

from motor.motor_asyncio import AsyncIOMotorClient

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings


async def import_animals_from_csv(db, farm: dict, csv_file: Path):
    """Import animals from CSV file."""
    imported_count = 0
    skipped_count = 0
    updated_count = 0
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            tag_id = row.get("tag_id", "").strip()
            if not tag_id:
                print(f"Skipping row with no tag_id: {row}")
                skipped_count += 1
                continue
            
            # Check if animal already exists (upsert logic)
            existing = await db.animals.find_one({"tag_id": tag_id})
            
            animal_data = {
                "farm_id": farm["_id"],
                "tag_id": tag_id,
                "species": row.get("species", "").strip() or None,
                "breed": row.get("breed", "").strip() or None,
                "age_months": _parse_int(row.get("age_months")),
                "lactation_number": _parse_int(row.get("lactation_number")),
                "pregnancy_status": row.get("pregnancy_status", "").strip() or None,
                "previous_mastitis": _parse_bool(row.get("previous_mastitis")),
                "disease_history": [],
                "vaccination_history": [],
                "treatment_history": [],
                "comorbidities": [],
                "status": "active",
                "updated_at": datetime.utcnow(),
            }
            
            if existing:
                # Update existing animal
                await db.animals.update_one(
                    {"_id": existing["_id"]},
                    {"$set": animal_data}
                )
                updated_count += 1
                print(f"✓ Updated: {tag_id}")
            else:
                # Create new animal
                animal_data["_id"] = str(uuid.uuid4())
                animal_data["created_at"] = datetime.utcnow()
                await db.animals.insert_one(animal_data)
                imported_count += 1
                print(f"✓ Imported: {tag_id}")

    print(f"\n📊 Summary:")
    print(f"   Imported: {imported_count}")
    print(f"   Updated: {updated_count}")
    print(f"   Skipped: {skipped_count}")
    return imported_count, updated_count


async def create_demo_animals(db, farm: dict):
    """Create demo animals for MVP (14 cows + 30 buffaloes)."""
    imported_count = 0
    
    # Cows: F01_COW_001 to F01_COW_014
    for i in range(1, 15):
        tag_id = f"F01_COW_{i:03d}"
        existing = await db.animals.find_one({"tag_id": tag_id})
        
        if not existing:
            animal_data = {
                "_id": str(uuid.uuid4()),
                "farm_id": farm["_id"],
                "tag_id": tag_id,
                "species": "cow",
                "breed": None,  # No assumed breed per PRD §14
                "age_months": None,
                "lactation_number": None,
                "pregnancy_status": None,
                "previous_mastitis": None,
                "disease_history": [],
                "vaccination_history": [],
                "treatment_history": [],
                "comorbidities": [],
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
            await db.animals.insert_one(animal_data)
            imported_count += 1
            print(f"✓ Created demo cow: {tag_id}")
    
    # Buffaloes: F01_BUF_001 to F01_BUF_030
    for i in range(1, 31):
        tag_id = f"F01_BUF_{i:03d}"
        existing = await db.animals.find_one({"tag_id": tag_id})
        
        if not existing:
            animal_data = {
                "_id": str(uuid.uuid4()),
                "farm_id": farm["_id"],
                "tag_id": tag_id,
                "species": "buffalo",
                "breed": None,  # No assumed breed per PRD §14
                "age_months": None,
                "lactation_number": None,
                "pregnancy_status": None,
                "previous_mastitis": None,
                "disease_history": [],
                "vaccination_history": [],
                "treatment_history": [],
                "comorbidities": [],
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
            await db.animals.insert_one(animal_data)
            imported_count += 1
            print(f"✓ Created demo buffalo: {tag_id}")
    
    print(f"\n📊 Summary: Created {imported_count} demo animals")
    return imported_count


def _parse_int(value: Optional[str]) -> Optional[int]:
    """Safely parse integer or return None."""
    if not value or not value.strip():
        return None
    try:
        return int(value.strip())
    except ValueError:
        return None


def _parse_bool(value: Optional[str]) -> Optional[bool]:
    """Safely parse boolean or return None."""
    if not value or not value.strip():
        return None
    return value.strip().lower() in ("true", "yes", "1", "y")


async def main():
    """Main import function."""
    parser = argparse.ArgumentParser(description="Import Farm 01 animals")
    parser.add_argument("--csv-file", type=Path, help="Path to CSV file")
    args = parser.parse_args()
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    db = client.get_database()
    
    try:
        # Verify connection
        await db.command("ping")
        print("✓ Connected to MongoDB")
        
        # Create or get Farm 01
        farm = await db.farms.find_one({"code": "F01"})
        if not farm:
            farm = {
                "_id": str(uuid.uuid4()),
                "name": "Vaishanavi Dairy",
                "code": "F01",
                "location_text": None,
                "latitude": None,
                "longitude": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
            await db.farms.insert_one(farm)
            print(f"✓ Created farm: {farm['name']} ({farm['code']})")
        else:
            print(f"✓ Farm exists: {farm['name']} ({farm['code']})")
        
        # Import animals
        if args.csv_file:
            if not args.csv_file.exists():
                print(f"❌ CSV file not found: {args.csv_file}")
                return
            imported, updated = await import_animals_from_csv(db, farm, args.csv_file)
        else:
            print("No CSV file provided - creating demo animals...")
            imported = await create_demo_animals(db, farm)
        
        print(f"\n✓ Import complete!")
        
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
