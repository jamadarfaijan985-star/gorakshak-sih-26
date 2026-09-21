"""Full end-to-end verification after the farm_id fix."""
import urllib.request, json

BASE      = "http://localhost:8000"
ANIMAL_ID = "e75e377e-a6a9-4290-819f-09200c60a5a3"

def post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(BASE+path, data=data,
        headers={"Content-Type":"application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=5) as r:
        return r.status, json.loads(r.read())

def get(path, token=None):
    import urllib.error
    h = {"Authorization": f"Bearer {token}"} if token else {}
    req = urllib.request.Request(BASE+path, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, {}

results = {}

s, d = post("/api/v1/auth/login", {"email":"admin@godrishti.dev","password":"godrishti2026"})
token = d["access_token"]
user  = d["user"]
FARM_ID = user["farm_id"]

print(f"Login            : HTTP {s}")
print(f"User farm_id     : {FARM_ID}")

results["login"] = "PASS" if s == 200 else "FAIL"
results["user_has_farm"] = "PASS" if FARM_ID else "FAIL"

s, d = get(f"/api/v1/animals?farm_id={FARM_ID}&limit=10", token)
animals = d.get("data", [])
print(f"\nAnimals in farm  : {len(animals)}")
for a in animals:
    print(f"  {a.get('tag_id')}  id={a.get('id')}  status={a.get('status')}")
results["animals_in_farm"] = "PASS" if len(animals) > 0 else "FAIL"

s, d = get(f"/api/v1/animals/{ANIMAL_ID}/sensor-history?skip=0&limit=5", token)
readings = d.get("data", [])
total = d.get("meta", {}).get("total", 0)
print(f"\nSensor readings  : total={total}  fetched={len(readings)}")
if readings:
    r = readings[0]
    af = r.get("audio_features") or {}
    print(f"  surface_temp_c    : {r.get('surface_temp_c')}")
    print(f"  ambient_temp_c    : {r.get('ambient_temp_c')}")
    print(f"  relative_humidity : {r.get('relative_humidity')}")
    print(f"  activity_raw      : {r.get('activity_raw')}")
    print(f"  mic_average       : {af.get('mic_average')}")
    print(f"  rumination_min    : {r.get('rumination_inferred_min')}")
    print(f"  thi               : {r.get('thi')}")
    print(f"  recorded_at       : {r.get('recorded_at')}")
results["sensor_history"] = "PASS" if total > 0 else "FAIL"
results["latest_has_data"] = "PASS" if readings and readings[0].get("surface_temp_c") is not None else "FAIL"

s, d = get(f"/api/v1/animals/{ANIMAL_ID}/risk", token)
print(f"\nRisk             : HTTP {s}  level={d.get('risk_level')}  model={d.get('model_version')}")
results["risk_api"] = "PASS" if s == 200 else "FAIL"

s, d = get(f"/api/v1/farms/{FARM_ID}/summary", token)
print(f"\nHerd summary     : HTTP {s}  total={d.get('total_animals')}  dist={d.get('risk_distribution')}")
results["herd_summary"] = "PASS" if s == 200 else "FAIL"

print("\n" + "=" * 50)
print("RESULTS")
print("=" * 50)
for k, v in results.items():
    icon = "[PASS]" if v == "PASS" else "[FAIL]"
    print(f"  {icon}  {k}")

print(f"\nFarm ID for frontend localStorage: {FARM_ID}")
print(f"Animal ID: {ANIMAL_ID}")
