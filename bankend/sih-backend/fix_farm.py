"""
Reconcile: animal farm_id is a1d58ef4, users are now 001fa3fd.
Option A: move animal to 001fa3fd farm.
Option B: move users to a1d58ef4 farm.

We'll use option B — users already had a1d58ef4 as their farm (it's the real
farm where F01_COW_001 lives). Reset all users back to a1d58ef4 and ensure
all farm/animal data is consistent.
"""
import pymongo

ANIMAL_ID = "e75e377e-a6a9-4290-819f-09200c60a5a3"

c = pymongo.MongoClient("mongodb://localhost:27017/bovine_mastitis", serverSelectionTimeoutMS=5000)
db = c["bovine_mastitis"]

# Show all farms
print("All farms:")
for f in db["farms"].find():
    count = db["animals"].count_documents({"farm_id": f["_id"]})
    print(f"  {f['_id']}  code={f.get('code')}  name={f.get('name')}  animals={count}")

animal = db["animals"].find_one({"_id": ANIMAL_ID})
ANIMAL_FARM_ID = animal["farm_id"]
print(f"\nAnimal F01_COW_001 is in farm: {ANIMAL_FARM_ID}")

farm = db["farms"].find_one({"_id": ANIMAL_FARM_ID})
if farm:
    print(f"Farm details: code={farm.get('code')} name={farm.get('name')}")

# Set all users to the ANIMAL's farm_id (the authoritative one)
result = db["users"].update_many(
    {},
    {"$set": {"farm_id": ANIMAL_FARM_ID}}
)
print(f"\nSet all {result.modified_count} user(s) to farm_id={ANIMAL_FARM_ID}")

# Also move the device mapping if needed
device = db["device_mappings"].find_one({"_id": "ESP8266-COW-001"})
print(f"Device mapping: {device}")

# Verify sensor_readings link
reading_count = db["sensor_readings"].count_documents({"animal_id": ANIMAL_ID})
print(f"Sensor readings for animal: {reading_count}")

# Final check
print("\nFinal user state:")
for u in db["users"].find({}, {"email":1,"farm_id":1}):
    ok = "OK" if u.get("farm_id") == ANIMAL_FARM_ID else "MISMATCH"
    print(f"  [{ok}] {u['email']}  farm_id={u.get('farm_id')}")

c.close()
print(f"\nAll users now point to farm {ANIMAL_FARM_ID} which contains F01_COW_001.")
print("Frontend activeFarmId must also equal this value.")
print(f"Clear localStorage key 'innovx_active_farm_id' and re-login, or")
print(f"set it to: {ANIMAL_FARM_ID}")
