"""
Sensor Data Simulator - MongoDB Version

Generates realistic synthetic sensor data for demo/testing.
Clearly marks data as "simulated_demo" source.

Usage:
    python scripts/simulate_sensor_feed.py --farm-code F01 --days 7
"""

import asyncio
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import List
import argparse

import httpx
from motor.motor_asyncio import AsyncIOMotorClient

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.services.feature_engineering import compute_thi


class SensorDataSimulator:
    """Generates realistic synthetic sensor data."""
    
    def __init__(self):
        self.base_url = "http://localhost:8000"
    
    async def simulate_and_post(
        self,
        farm_code: str = "F01",
        days: int = 7,
    ):
        """Simulate and post sensor data for all animals in farm."""
        # Connect to MongoDB to get animals
        client = AsyncIOMotorClient(settings.DATABASE_URL)
        db = client.get_database()
        
        try:
            # Get farm
            farm = await db.farms.find_one({"code": farm_code})
            if not farm:
                print(f"❌ Farm not found: {farm_code}")
                return
            
            print(f"✓ Found farm: {farm['name']}")
            
            # Get all animals for farm
            animals = await db.animals.find({"farm_id": farm["_id"]}).to_list(None)
            print(f"✓ Found {len(animals)} animals")
            
            # Generate sensor data
            async with httpx.AsyncClient(timeout=30.0) as client_http:
                total_readings = 0
                
                for animal in animals:
                    readings_for_animal = await self._generate_animal_readings(
                        animal,
                        days=days,
                    )
                    
                    # Post readings in batch
                    if readings_for_animal:
                        payload = {
                            "device_id": f"collar_{animal['tag_id']}",
                            "animal_id": animal["_id"],
                            "source": "simulated_demo",
                            "readings": readings_for_animal,
                        }
                        
                        try:
                            response = await client_http.post(
                                f"{self.base_url}/api/v1/ingest/sensor",
                                json=payload,
                            )
                            if response.status_code == 200:
                                result = response.json()
                                total_readings += result.get("created", 0)
                                print(f"✓ Posted {result.get('created')} readings for {animal['tag_id']}")
                            else:
                                print(f"❌ Error posting for {animal['tag_id']}: {response.status_code}")
                        except Exception as e:
                            print(f"❌ Failed to post for {animal['tag_id']}: {e}")
                
                print(f"\n✓ Posted {total_readings} total sensor readings")
        
        finally:
            client.close()
    
    async def _generate_animal_readings(
        self,
        animal: dict,
        days: int = 7,
    ) -> List[dict]:
        """Generate synthetic readings for one animal over N days."""
        readings = []
        now = datetime.utcnow()
        start_time = now - timedelta(days=days)
        
        # Generate 24 readings per day (hourly)
        for hour_offset in range(days * 24):
            recorded_at = start_time + timedelta(hours=hour_offset)
            
            # Generate realistic sensor values
            hour_of_day = recorded_at.hour
            
            # Activity: high during milking (5-7am, 4-6pm), low at night
            if 5 <= hour_of_day <= 7 or 16 <= hour_of_day <= 18:
                activity_raw = random.uniform(60, 95)
            else:
                activity_raw = random.uniform(10, 40)
            
            # Surface temperature: varies with activity and time
            base_temp = 37.5 + random.uniform(-0.5, 0.5)
            if activity_raw > 75:
                surface_temp_c = base_temp + random.uniform(0.5, 2.0)
            else:
                surface_temp_c = base_temp + random.uniform(-1.0, 0.5)
            
            # Ambient temperature (simulated cycle: cooler at night, warmer during day)
            ambient_temp_c = 20 + 8 * (0.5 + 0.5 * (1 - abs((hour_of_day - 12) / 12))) + random.uniform(-1, 1)
            
            # Relative humidity (typically higher at night)
            relative_humidity = 60 + 20 * (0.5 + 0.5 * (1 - abs((hour_of_day - 2) / 12))) + random.uniform(-5, 5)
            relative_humidity = max(40, min(95, relative_humidity))  # Clamp 40-95%
            
            # Rumination: higher during resting/night
            if 20 <= hour_of_day or hour_of_day <= 6:
                rumination_inferred_min = random.uniform(30, 60)
            else:
                rumination_inferred_min = random.uniform(5, 25)
            
            # Compute THI
            thi = compute_thi(ambient_temp_c, relative_humidity)
            
            reading = {
                "recorded_at": recorded_at.isoformat(),
                "activity_raw": round(activity_raw, 2),
                "surface_temp_c": round(surface_temp_c, 2),
                "ambient_temp_c": round(ambient_temp_c, 2),
                "relative_humidity": round(relative_humidity, 2),
                "rumination_inferred_min": round(rumination_inferred_min, 2),
                "audio_features": None,
                "thi": thi,
            }
            
            readings.append(reading)
        
        return readings


async def main():
    """Main simulator function."""
    parser = argparse.ArgumentParser(description="Simulate sensor data")
    parser.add_argument("--farm-code", default="F01", help="Farm code")
    parser.add_argument("--days", type=int, default=7, help="Number of days to simulate")
    args = parser.parse_args()
    
    simulator = SensorDataSimulator()
    await simulator.simulate_and_post(farm_code=args.farm_code, days=args.days)


if __name__ == "__main__":
    asyncio.run(main())
