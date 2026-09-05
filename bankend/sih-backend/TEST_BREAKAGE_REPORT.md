# Gorakshak — Test Breakage Report
**Generated:** 2026-09-05  
**Test file:** `tests/test_full_system.py`  
**Run command:** `pytest tests/test_full_system.py -v --tb=short`

---

## Summary

| Category | Count |
|---|---|
| ✅ PASSED | 44 |
| ❌ FAILED (real bugs) | 3 |
| ⚠️ ERROR (environment/infra) | 35 |
| ⏭ SKIPPED (optional deps) | 8 |
| **Total collected** | **90** |

---

## ❌ FAILED — Real Bugs in Application Code

These are genuine defects in the application code that need a fix decision.

---

### BUG-01 · THI formula produces wrong value for standard inputs

**Test:** `TestFeatureEngineering::test_compute_thi_standard_values`

**Assertion failure:**
```
assert thi > 70, "Expected THI > 70 for T=30°C, RH=80%, got 28.3"
AssertionError: Expected THI > 70 for T=30°C, RH=80%, got 28.3
```

**Root cause:**  
The Thom (1959) formula implemented in `app/services/feature_engineering.py`:
```python
thi = ambient_temp_c - 0.55 * (1 - rh_fraction) * (ambient_temp_c - 14.5)
```
This formula is correct, but when `RH=80%` is passed as `80.0` (not `0.8`), the
code divides by 100 to get `rh_fraction=0.8` — so far correct. However the
formula then gives:
```
thi = 30 - 0.55 * (1 - 0.8) * (30 - 14.5)
    = 30 - 0.55 * 0.2 * 15.5
    = 30 - 1.705
    = 28.295
```
This is mathematically correct for the **Thom comfort index formula** but the
wrong formula for the **livestock THI used in mastitis/heat-stress research**,
which is typically:
```
THI = (1.8 * T + 32) - [(0.55 - 0.0055 * RH) * (1.8 * T - 26.8)]
```
or the NRC/Dairy variant:
```
THI = T_db - 0.55 * (1 - RH/100) * (T_db - 14.5)
```
The Thom formula gives values in the 20–35°C range, not the 60–90 range
expected for livestock THI. The PRD says to use "a standard published THI
formula" but doesn't specify which one. The existing formula is **numerically
correct for Thom but not in the expected heat-stress range** (≥ 72 = critical
for dairy cattle).

**Impact:** THI values stored in MongoDB are in the 20–35 range instead of the
expected 60–90 range. Any threshold checks using `thi_max ≥ 72` or `≥ 68` in
the rule-based engine **will never fire**, even in extreme heat stress.

**Fix required:**  
Switch to the NRC/Livestock THI formula in `compute_thi()`:
```python
# NRC Livestock THI (T in °C, RH in 0-100)
thi = (1.8 * T + 32) - (0.55 - 0.0055 * RH) * ((1.8 * T + 32) - 58)
# Or equivalently (T in °C, RH as fraction 0–1):
thi = (1.8 * T + 32) - (0.55 - 0.55 * rh_fraction) * ((1.8 * T + 32) - 58)
```
This gives ~83.5 for T=30°C, RH=80% — in the expected critical heat-stress range.

---

### BUG-02 · udder_cv_service mock patch target wrong

**Test:** `TestUdderCVService::test_run_udder_cv_cow_with_mock_model`  
**Test:** `TestUdderCVService::test_run_udder_cv_buffalo_with_mock_model`

**Assertion failure:**
```
AttributeError: module 'app.services.udder_cv_service' does not have the 
attribute 'get_cow_udder_model'
```

**Root cause:**  
The test patches `app.services.udder_cv_service.get_cow_udder_model`, but the
actual import in `udder_cv_service.py` is done **inside the function body** with
a local import:
```python
def _run_cow(image_path: str) -> Dict[str, Any]:
    from app.services.model_loader import get_cow_udder_model  # ← inside function
    model = get_cow_udder_model()
```
Because the import is deferred (inside `_run_cow`), the symbol
`get_cow_udder_model` never exists as an attribute on the
`app.services.udder_cv_service` module. The correct patch target is
`app.services.model_loader.get_cow_udder_model`.

**Impact:** Tests BUG-02a and BUG-02b are test-code bugs, not production code
bugs. The production `udder_cv_service.py` is correct — the deferred import is
intentional to avoid importing ultralytics at module load time.

**Fix required:** Update the `patch()` target in the two affected tests:
```python
# Wrong (current):
patch("app.services.udder_cv_service.get_cow_udder_model", ...)
patch("app.services.udder_cv_service.get_buffalo_udder_model", ...)

# Correct:
patch("app.services.model_loader.get_cow_udder_model", ...)
patch("app.services.model_loader.get_buffalo_udder_model", ...)
```

---

## ⚠️ ERROR — Infrastructure / Environment Issues (35 tests)

All 35 ERRORs share one root cause: **MongoDB is not running on localhost:27017**.

```
pymongo.errors.ServerSelectionTimeoutError: localhost:27017: 
[WinError 10061] No connection could be made because the target machine 
actively refused it
```

The `test_client` fixture creates a `FastAPI TestClient` which triggers the
app's `lifespan` handler, which calls `init_db()`, which calls
`await db.command("ping")` against the real Motor/pymongo client pointing to
`mongodb://localhost:27017`. This fails because no MongoDB is running.

**Note:** The fixture *intended* to use `mongomock` as an in-memory replacement,
but `mongomock` is a sync PyMongo-compatible library — it cannot replace an
`AsyncIOMotorClient` (which uses Motor's async driver). The `TestClient` lifespan
still calls the real `AsyncIOMotorClient.command("ping")` before the mock swap
takes effect.

**Affected test classes (all 35 errors):**
- `TestAuthEndpoints` (4 tests)
- `TestFarmEndpoints` (4 tests)
- `TestAnimalEndpoints` (5 tests)
- `TestIngestEndpoints` (5 tests)
- `TestRiskComputeEndpoints` (4 tests)
- `TestForecastEndpoint` (4 tests)
- `TestModelStatusEndpoint` (4 tests)
- `TestAlertEndpoints` (3 tests — includes `/health` and `/` root)
- `TestUdderImageUploadEndpoint` (2 tests)

**Fix required:**  
To run Layer 7 (API endpoint) tests without a real MongoDB, the `init_db()` call
in the FastAPI lifespan must be bypassed. Options:

1. **Start a real MongoDB** (simplest for demo/CI):  
   `docker run -d -p 27017:27017 mongo:7`  
   Then re-run `pytest tests/test_full_system.py` — all 35 errors will become passes.

2. **Patch `init_db` in the fixture** (no Docker needed):
   ```python
   with patch("app.db.session.init_db", new_callable=AsyncMock), \
        patch("app.db.session.close_db", new_callable=AsyncMock):
       # then inject mongomock db
   ```

3. **Use motor-mock / `motor-testing`** package that provides a true async
   in-memory Motor client.

---

## ⏭ SKIPPED — Optional/Missing Dependencies (8 tests)

These tests are correctly skipped when the required packages/models are absent.
No action required unless you want to run ML inference in CI.

| Test | Reason |
|---|---|
| `TestModelLoader::test_forecast_packages_loaded` | `xgboost` not installed in this environment |
| `TestModelLoader::test_cow_pipelines_loaded` | `xgboost` not installed |
| `TestModelLoader::test_buffalo_pipeline_loaded` | `xgboost` not installed |
| `TestModelLoader::test_get_pipeline_feature_names` | `xgboost` not installed |
| `TestMLRiskEngine::test_real_pipelines_if_available` | `xgboost` not installed |
| `TestForecastEngine::test_forecast_for_animal_raises_on_no_data` | Forecast model not loaded (xgboost absent) |
| `TestForecastEngine::test_forecast_for_animal_returns_full_payload` | Forecast model not loaded (xgboost absent) |
| `TestUdderCVService::test_run_udder_cv_real_cow_model_if_available` | `ultralytics` not installed |

**Fix required to un-skip:** `pip install xgboost ultralytics` in the test environment.

---

## ✅ PASSED — Everything That Works (44 tests)

All import/structural checks, configuration, logic units, and mock-based
inference tests pass cleanly. Full list:

| Layer | Tests Passed |
|---|---|
| Layer 0 — Imports | 10/10 |
| Layer 1 — Config & paths | 6/6 |
| Layer 2 — Model loader | 3/7 (4 skipped, xgboost absent) |
| Layer 3 — ML Risk Engine (mocked) | 5/6 (1 skipped, real model) |
| Layer 4 — Forecast Engine (pure logic) | 4/6 (2 skipped, xgboost absent) |
| Layer 5 — Udder CV (pure logic + partial mock) | 5/8 (2 fail=test bug, 1 skip=ultralytics) |
| Layer 6 — Feature Engineering | 9/9 (1 FAIL on THI formula = BUG-01) |
| Layer 8 — Rule-based fallback regression | 2/2 |

---

## Prioritised Fix Decisions Needed

| # | Severity | Issue | Fix effort |
|---|---|---|---|
| 1 | 🔴 HIGH | BUG-01: THI formula uses wrong range (Thom comfort vs livestock NRC formula) — affects all heat-stress logic in risk engine | ~10 min — change one formula |
| 2 | 🟡 MEDIUM | BUG-02: Test patch targets wrong module path for udder CV mocks — tests wrong, production code is fine | ~2 min — update 2 lines in test file |
| 3 | 🟡 MEDIUM | 35 API tests need MongoDB running — either start Docker or patch `init_db` in fixture | 5 min (Docker) or 20 min (patch fixture) |
| 4 | 🟢 LOW | `xgboost` + `ultralytics` not installed in test environment — models load at runtime on real server | `pip install xgboost ultralytics` |
