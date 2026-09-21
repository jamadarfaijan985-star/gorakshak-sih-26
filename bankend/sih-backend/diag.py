"""Full diagnostic: DB state, API responses, device mapping."""
import pymongo, json, urllib.request, urllib.error, sys

ANIMAL_ID = "e75e377e-a6a9-4290-819f-09200c60a5a3"
FARM_ID   = "001fa3fd-8730-4779-a534-d6c9315d7381"
BASE      = "http://localhost:8000"

# ── 1. MongoDB direct ─────────────────────────────────────────────────────────
print("=" * 60)
print("1. MONGODB DIRECT CHECK")
print("=" * 60)
c = pymongo.MongoClient("mongodb://localhost:27017/bovine_mastitis", serverSelectionTimeoutMS=5000)
db = c["bovine_mastitis"]

user    = db["users"].find_one({"email": "admin@godrishti.dev"})
animal  = db["animals"].find_one({"_id": ANIMAL_ID})
device  = db["device_mappings"].find_one({"_id": "ESP8266-COW-001"})
total   = db["sensor_readings"].count_documents({"animal_id": ANIMAL_ID})
latest  = db["sensor_readings"].find_one({"animal_id": ANIMAL_ID}, sort=[("received_at", -1)])
risks   = db["risk_scores"].count_documents({"animal_id": ANIMAL_ID})

print(f"User farm_id      : {user.get('farm_id') if user else 'USER NOT FOUND'}")
print(f"Animal tag_id     : {animal.get('tag_id') if animal else 'ANIMAL NOT FOUND'}")
print(f"Device mapping    : {device.get('tag_id') if device else 'NO MAPPING'}")
print(f"Total readings    : {total}")
print(f"Risk scores       : {risks}")
if latest:
    af = latest.get("audio_features") or {}
    print(f"\nLatest sensor reading:")
    print(f"  surface_temp_c    : {latest.get('surface_temp_c')}")
    print(f"  ambient_temp_c    : {latest.get('ambient_temp_c')}")
    print(f"  relative_humidity : {latest.get('relative_humidity')}")
    print(f"  activity_raw      : {latest.get('activity_raw')}")
    print(f"  audio_features    : {latest.get('audio_features')}")
    print(f"  mic_average       : {af.get('mic_average')}")
    print(f"  rumination_min    : {latest.get('rumination_inferred_min')}")
    print(f"  thi               : {latest.get('thi')}")
    print(f"  recorded_at       : {latest.get('recorded_at')}")
    print(f"  source            : {latest.get('source')}")
else:
    print("NO READINGS FOUND")
c.close()

# ── 2. Backend API ────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("2. BACKEND API CHECK")
print("=" * 60)

def post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(BASE+path, data=data,
        headers={"Content-Type":"application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=5) as r:
        return r.status, json.loads(r.read())

def get(path, token=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    req = urllib.request.Request(BASE+path, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, {}

try:
    s, d = post("/api/v1/auth/login", {"email":"admin@godrishti.dev","password":"godrishti2026"})
    token = d.get("access_token","")
    farm_id_from_token = d.get("user",{}).get("farm_id")
    print(f"Login               : HTTP {s}")
    print(f"User farm_id        : {farm_id_from_token}")
except Exception as e:
    print(f"Login FAILED: {e}"); sys.exit(1)

s, d = get(f"/api/v1/animals/{ANIMAL_ID}/sensor-history?skip=0&limit=10", token)
print(f"\nSensor history API  : HTTP {s}")
if s == 200:
    readings = d.get("data", [])
    total_api = d.get("meta", {}).get("total", 0)
    print(f"Total readings(API) : {total_api}")
    print(f"Fetched in response : {len(readings)}")
    if readings:
        r = readings[0]
        af = r.get("audio_features") or {}
        print(f"\n  Latest via API:")
        print(f"    surface_temp_c    : {r.get('surface_temp_c')}")
        print(f"    ambient_temp_c    : {r.get('ambient_temp_c')}")
        print(f"    relative_humidity : {r.get('relative_humidity')}")
        print(f"    activity_raw      : {r.get('activity_raw')}")
        print(f"    audio_features    : {r.get('audio_features')}")
        print(f"    mic_average       : {af.get('mic_average')}")
        print(f"    rumination_min    : {r.get('rumination_inferred_min')}")
        print(f"    thi               : {r.get('thi')}")
        print(f"    recorded_at       : {r.get('recorded_at')}")
else:
    print(f"  ERROR: {d}")

s, d = get(f"/api/v1/animals/{ANIMAL_ID}/risk", token)
print(f"\nRisk API            : HTTP {s}")
if s == 200:
    print(f"  risk_level        : {d.get('risk_level')}")
    print(f"  risk_score_numeric: {d.get('risk_score_numeric')}")
    print(f"  model_version     : {d.get('model_version')}")

s, d = get(f"/api/v1/animals?farm_id={FARM_ID}&limit=10", token)
print(f"\nAnimals list API    : HTTP {s}, count={len(d.get('data',[]))}")

s, d = get(f"/api/v1/devices/ESP8266-COW-001", token)
print(f"Device API          : HTTP {s}, tag_id={d.get('tag_id')}, animal_id={d.get('animal_id')}")

# ── 3. MQTT broker reachability ───────────────────────────────────────────────
print("\n" + "=" * 60)
print("3. MQTT BROKER CHECK")
print("=" * 60)
import socket
for ip in ["10.250.43.53", "localhost", "127.0.0.1"]:
    try:
        s2 = socket.socket()
        s2.settimeout(2)
        s2.connect((ip, 1884))
        s2.close()
        print(f"  MQTT {ip}:1884  REACHABLE")
    except Exception as ex:
        print(f"  MQTT {ip}:1884  UNREACHABLE ({ex})")

print("\n" + "=" * 60)
print("DIAGNOSTIC COMPLETE")
print("=" * 60)
