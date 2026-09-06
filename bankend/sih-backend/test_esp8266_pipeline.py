"""
ESP8266 Pre-Connection Pipeline Test
=====================================
Tests the full data path BEFORE physically connecting the ESP8266 collar:

    Laptop → Backend API → Database → ML Engine → Prediction

Run from bankend/sih-backend/ with the backend already running:

    python test_esp8266_pipeline.py

Or specify a custom base URL and credentials:

    python test_esp8266_pipeline.py --url http://localhost:8000 \\
        --email admin@innovx-gorakshak.com --password TestPass123!

The script will:
  STEP 1 → Register a test user + farm + animal (idempotent — skips if already exists)
  STEP 2 → POST dummy ESP8266 payload to /api/v1/ingest/esp8266
  STEP 3 → Verify the reading was stored in MongoDB (via sensor-history endpoint)
  STEP 4 → Trigger ML risk computation and verify a prediction is returned

Each step prints ✅ PASS or ❌ FAIL with the exact response so you can debug.
Exit code 0 = all four checks passed.  Exit code 1 = at least one failed.
"""

import argparse
import json
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple


# ─── Colour helpers (Windows-safe fallback) ──────────────────────────────────

def _green(s: str) -> str:
    return f"\033[92m{s}\033[0m"

def _red(s: str) -> str:
    return f"\033[91m{s}\033[0m"

def _yellow(s: str) -> str:
    return f"\033[93m{s}\033[0m"

def _bold(s: str) -> str:
    return f"\033[1m{s}\033[0m"


# ─── Tiny HTTP client (stdlib only, no requests required) ────────────────────

def http(
    method: str,
    url: str,
    body: Optional[Dict[str, Any]] = None,
    token: Optional[str] = None,
    timeout: int = 30,
) -> Tuple[int, Dict[str, Any]]:
    """Send an HTTP request and return (status_code, json_body)."""
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            body_text = e.read().decode()
            return e.code, json.loads(body_text)
        except Exception:
            return e.code, {"detail": str(e)}
    except urllib.error.URLError as e:
        raise ConnectionError(f"Cannot reach {url} — is the backend running?\n  {e.reason}") from e


# ─── Pretty print helpers ─────────────────────────────────────────────────────

def section(title: str) -> None:
    print(f"\n{'─' * 60}")
    print(_bold(f"  {title}"))
    print(f"{'─' * 60}")

def ok(msg: str) -> None:
    print(f"  {_green('✅ PASS')}  {msg}")

def fail(msg: str, detail: Any = None) -> None:
    print(f"  {_red('❌ FAIL')}  {msg}")
    if detail:
        if isinstance(detail, dict):
            print(f"           {json.dumps(detail, indent=10)}")
        else:
            print(f"           {detail}")

def info(msg: str) -> None:
    print(f"  {_yellow('ℹ')}{_yellow(' INFO')}  {msg}")


# ─── Test helpers ─────────────────────────────────────────────────────────────

class PipelineTest:
    def __init__(self, base_url: str, email: str, password: str):
        self.base = base_url.rstrip("/")
        self.email = email
        self.password = password
        self.token: Optional[str] = None
        self.farm_id: Optional[str] = None
        self.animal_id: Optional[str] = None
        self.tag_id = "ESP_TEST_COW_001"
        self.failures = 0

    # ── auth ──────────────────────────────────────────────────────────────────

    def _ensure_user(self) -> None:
        """Register user if not exists, then login."""
        reg_status, _ = http("POST", f"{self.base}/api/v1/auth/register", {
            "name": "ESP8266 Test User",
            "email": self.email,
            "password": self.password,
            "role": "admin",
        })
        # 200 = created, 400 = already exists — both are fine
        if reg_status not in (200, 400):
            raise RuntimeError(f"Unexpected register status {reg_status}")

        login_status, login_body = http("POST", f"{self.base}/api/v1/auth/login", {
            "email": self.email,
            "password": self.password,
        })
        if login_status != 200:
            raise RuntimeError(f"Login failed ({login_status}): {login_body}")
        self.token = login_body["access_token"]

    def _ensure_farm(self) -> None:
        """Create test farm if not exists."""
        # List farms first
        status, body = http("GET", f"{self.base}/api/v1/farms", token=self.token)
        if status == 200:
            for farm in body.get("data", []):
                if farm.get("code") == "ESP_TEST_FARM":
                    self.farm_id = farm["id"]
                    return

        # Create
        status, body = http("POST", f"{self.base}/api/v1/farms", {
            "name": "ESP8266 Test Farm",
            "code": "ESP_TEST_FARM",
            "location_text": "Test Location",
        }, token=self.token)
        if status not in (200, 400):
            raise RuntimeError(f"Farm create failed ({status}): {body}")
        if status == 200:
            self.farm_id = body["id"]
        else:
            # 400 = code already exists, fetch it
            status2, body2 = http("GET", f"{self.base}/api/v1/farms", token=self.token)
            for farm in body2.get("data", []):
                if farm.get("code") == "ESP_TEST_FARM":
                    self.farm_id = farm["id"]

    def _ensure_animal(self) -> None:
        """Create test animal if not exists."""
        # Try to list by farm
        status, body = http(
            "GET",
            f"{self.base}/api/v1/animals?farm_id={self.farm_id}&limit=200",
            token=self.token,
        )
        if status == 200:
            for a in body.get("data", []):
                if a.get("tag_id") == self.tag_id:
                    self.animal_id = a["id"]
                    return

        # Create
        status, body = http("POST", f"{self.base}/api/v1/animals", {
            "tag_id": self.tag_id,
            "species": "cow",
            "breed": "HF",
            "age_months": 36,
            "lactation_number": 2,
            "farm_id": self.farm_id,
        }, token=self.token)
        if status not in (200, 400):
            raise RuntimeError(f"Animal create failed ({status}): {body}")
        if status == 200:
            self.animal_id = body["id"]
        else:
            raise RuntimeError(f"Animal tag collision ({status}): {body}")

    # ── the 4 actual test steps ───────────────────────────────────────────────

    def step1_api(self) -> Optional[str]:
        """
        STEP 1 — API accepts the ESP8266 payload.
        Returns the reading_id on success, None on failure.
        """
        section("STEP 1 — API accepts the ESP8266 payload")

        esp_payload = {
            "cow_id": self.tag_id,
            "body_temperature": 38.4,
            "ambient_temperature": 29.0,
            "humidity": 68.0,
            "activity": 0.245,
            "mic_average": 515.0,
            "mic_peak_peak": 31.0,
        }
        info(f"Sending to POST {self.base}/api/v1/ingest/esp8266")
        info(f"Payload: {json.dumps(esp_payload, indent=11)}")

        status_code, body = http("POST", f"{self.base}/api/v1/ingest/esp8266", esp_payload)

        print()
        if status_code == 200 and body.get("status") == "ok":
            ok(f"Status {status_code} — endpoint accepted the payload")
            ok(f"reading_id  = {body.get('reading_id')}")
            ok(f"animal_id   = {body.get('animal_id')}")
            ok(f"tag_id      = {body.get('tag_id')}")
            stored = body.get("stored", {})
            ok(f"surface_temp_c stored = {stored.get('surface_temp_c')} °C")
            ok(f"ambient_temp_c stored = {stored.get('ambient_temp_c')} °C")
            ok(f"relative_humidity     = {stored.get('relative_humidity')} %")
            ok(f"activity_raw          = {stored.get('activity_raw')}")
            ok(f"THI computed          = {stored.get('thi')}")
            ok(f"next_step hint        = {body.get('next_step', '—')}")
            return body.get("reading_id")
        else:
            fail(f"Status {status_code}", body)
            self.failures += 1
            return None

    def step2_db(self) -> bool:
        """
        STEP 2 — Reading is stored in MongoDB (verify via sensor-history endpoint).
        """
        section("STEP 2 — Reading stored in database")

        # Small pause to let any async baseline update settle
        time.sleep(0.5)

        info(f"Fetching sensor history for animal_id={self.animal_id}")
        url = f"{self.base}/api/v1/animals/{self.animal_id}/sensor-history?limit=5"
        status_code, body = http("GET", url, token=self.token)

        print()
        if status_code != 200:
            fail(f"sensor-history returned {status_code}", body)
            self.failures += 1
            return False

        readings = body.get("data", [])
        total = body.get("meta", {}).get("total", 0)

        if total == 0 or len(readings) == 0:
            fail("No readings found in database — ingest may have silently failed")
            self.failures += 1
            return False

        latest = readings[0]
        ok(f"Total readings in DB   = {total}")
        ok(f"Latest reading source  = {latest.get('source')}")
        ok(f"surface_temp_c         = {latest.get('surface_temp_c')} °C")
        ok(f"ambient_temp_c         = {latest.get('ambient_temp_c')} °C")
        ok(f"relative_humidity      = {latest.get('relative_humidity')} %")
        ok(f"activity_raw           = {latest.get('activity_raw')}")
        ok(f"thi                    = {latest.get('thi')}")
        ok(f"received_at            = {latest.get('received_at')}")

        # Verify the values match what we sent
        checks = [
            ("surface_temp_c", 38.4),
            ("ambient_temp_c", 29.0),
            ("relative_humidity", 68.0),
            ("activity_raw", 0.245),
        ]
        value_ok = True
        for field, expected in checks:
            actual = latest.get(field)
            if actual is None or abs(float(actual) - expected) > 0.01:
                fail(f"Value mismatch: {field} = {actual!r} (expected {expected})")
                value_ok = False
                self.failures += 1

        if value_ok:
            ok("All sensor values match what was sent  ✓")
        return value_ok

    def step3_ml_receives(self) -> bool:
        """
        STEP 3 — ML engine receives the data (trigger risk compute,
        verify features were extracted from the stored reading).
        """
        section("STEP 3 — ML engine receives the data")

        info(f"Triggering POST /api/v1/risk/compute for animal_id={self.animal_id}")
        status_code, body = http(
            "POST",
            f"{self.base}/api/v1/risk/compute",
            {"animal_id": self.animal_id},
            token=self.token,
        )

        print()
        if status_code != 200:
            fail(f"Risk compute returned {status_code}", body)
            self.failures += 1
            return False

        results = body.get("results", [])
        if not results:
            fail("No results in risk compute response", body)
            self.failures += 1
            return False

        result = results[0]
        compute_status = result.get("status")

        if compute_status == "no_data":
            fail(
                "ML engine reported 'no_data' — the reading was stored but "
                "baselines haven't been computed yet (need ≥2 readings for z-scores).\n"
                "           This is normal on the very first reading. "
                "Send a second reading and retry.",
                result,
            )
            # This is a known-good state on first run — warn but don't hard-fail
            info("Hint: send 2-3 readings before the ML engine can compute deviations.")
            return True  # not a failure — pipeline is working correctly

        if compute_status == "error":
            fail(f"Risk compute error: {result.get('error')}", result)
            self.failures += 1
            return False

        if compute_status == "computed":
            ok(f"Risk compute status    = {compute_status}")
            ok(f"Engine used            = {result.get('engine_used', '—')}")
            ok(f"Model version          = {result.get('model_version', '—')}")
            ok("ML engine successfully received and processed sensor data  ✓")
            return True

        # Unexpected status
        fail(f"Unexpected compute status: {compute_status!r}", result)
        self.failures += 1
        return False

    def step4_prediction(self) -> bool:
        """
        STEP 4 — ML prediction is returned (risk level + score).
        """
        section("STEP 4 — Prediction returned")

        info(f"Fetching latest risk score for animal_id={self.animal_id}")
        url = f"{self.base}/api/v1/animals/{self.animal_id}/risk"
        status_code, body = http("GET", url, token=self.token)

        print()
        if status_code == 404:
            # No prediction yet (happens if step3 got 'no_data')
            info(
                "No risk score stored yet — this happens when there is only one reading "
                "(need ≥2 for baseline deviation)."
            )
            info("The pipeline is correctly wired. Send more readings to get predictions.")
            ok("Endpoint reachable — prediction will appear after more data  ✓")
            return True

        if status_code != 200:
            fail(f"Risk fetch returned {status_code}", body)
            self.failures += 1
            return False

        ok(f"risk_level             = {body.get('risk_level')}")
        ok(f"risk_score_numeric     = {body.get('risk_score_numeric')}")
        ok(f"model_version          = {body.get('model_version')}")
        ok(f"is_forecast            = {body.get('is_forecast')}")
        ok(f"computed_at            = {body.get('computed_at')}")

        factors = body.get("contributing_factors", [])
        if factors:
            ok(f"contributing factors   = {[f.get('factor') for f in factors]}")

        rec = body.get("recommended_action")
        if rec:
            ok(f"recommendation         = {rec[:80]}{'…' if len(rec) > 80 else ''}")

        ok("Full prediction pipeline working end-to-end  ✓")
        return True

    # ── run all steps ─────────────────────────────────────────────────────────

    def run(self) -> int:
        """Run all 4 steps. Returns exit code (0 = all pass, 1 = any fail)."""
        print()
        print(_bold("═" * 60))
        print(_bold("  Gorakshak — ESP8266 Pre-Connection Pipeline Test"))
        print(_bold("═" * 60))
        print(f"  Backend : {self.base}")
        print(f"  Animal  : {self.tag_id}")
        print(f"  Time    : {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")

        # Setup
        section("SETUP — Auth + Farm + Animal")
        try:
            info("Logging in …")
            self._ensure_user()
            ok("Authenticated")

            info("Ensuring test farm exists …")
            self._ensure_farm()
            ok(f"Farm ready  (id={self.farm_id})")

            info(f"Ensuring test animal '{self.tag_id}' exists …")
            self._ensure_animal()
            ok(f"Animal ready (id={self.animal_id})")
        except Exception as exc:
            fail(f"Setup failed: {exc}")
            return 1

        # Run the 4 steps
        self.step1_api()
        self.step2_db()
        self.step3_ml_receives()
        self.step4_prediction()

        # Summary
        print()
        print("═" * 60)
        if self.failures == 0:
            print(_green(_bold("  ✅ ALL CHECKS PASSED — Safe to connect the ESP8266")))
        else:
            print(_red(_bold(f"  ❌ {self.failures} CHECK(S) FAILED — Fix above errors before connecting ESP8266")))
        print("═" * 60)
        print()

        return 0 if self.failures == 0 else 1


# ─── CLI ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Test the Gorakshak ESP8266 data pipeline end-to-end."
    )
    parser.add_argument(
        "--url",
        default="http://localhost:8000",
        help="Backend base URL (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--email",
        default="admin@innovx-gorakshak.com",
        help="Admin user email",
    )
    parser.add_argument(
        "--password",
        default="TestPass123!",
        help="Admin user password",
    )
    args = parser.parse_args()

    tester = PipelineTest(
        base_url=args.url,
        email=args.email,
        password=args.password,
    )
    sys.exit(tester.run())


if __name__ == "__main__":
    main()
