"""Fix the admin user's farm_id to match the farm that owns F01_COW_001."""
import pymongo

CORRECT_FARM_ID = "001fa3fd-8730-4779-a534-d6c9315d7381"
ANIMAL_ID       = "e75e377e-a6a9-4290-819f-09200c60a5a3"

c = pymongo.MongoClient("mongodb://localhost:27017/bovine_mastitis", serverSelectionTimeoutMS=5000)
db = c["bovine_mastitis"]

# Show all users
print("All users:")
for u in db["users"].find({}, {"_id":1,"email":1,"farm_id":1,"role":1}):
    print(f"  {u['_id']}  {u['email']}  farm_id={u.get('farm_id')}  role={u.get('role')}")

# Show the farm
farm = db["farms"].find_one({"_id": CORRECT_FARM_ID})
print(f"\nFarm: {farm}")

# Show the animal
animal = db["animals"].find_one({"_id": ANIMAL_ID})
print(f"Animal farm_id: {animal.get('farm_id') if animal else 'NOT FOUND'}")

# Fix: set ALL admin users to the correct farm_id
result = db["users"].update_many(
    {},
    {"$set": {"farm_id": CORRECT_FARM_ID}}
)
print(f"\nUpdated {result.modified_count} user(s) to farm_id={CORRECT_FARM_ID}")

# Verify
for u in db["users"].find({}, {"_id":1,"email":1,"farm_id":1}):
    print(f"  After fix: {u['email']}  farm_id={u.get('farm_id')}")

c.close()
