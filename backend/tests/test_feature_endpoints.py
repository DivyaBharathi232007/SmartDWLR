import os
import sys
import unittest

from starlette.testclient import TestClient

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from app.main import app, build_sms_message


class FeatureEndpointTests(unittest.TestCase):
    def setUp(self):
        # TestClient must be used as a context manager (or entered explicitly)
        # for FastAPI's startup event (init_db) to actually run — otherwise
        # every test hits "no such table" on a fresh DB.
        self.client = TestClient(app)
        self.client.__enter__()
        # water-budget / sensor-health both 404 until BW01 has at least one
        # reading — seed one so the suite doesn't depend on seed.py having
        # been run first.
        self.client.post("/api/ingest", json={
            "borewell_id": "BW01", "water_level": 70, "air_temperature": 28,
            "humidity": 60, "water_temperature": 25, "soil": 40, "rain": 10, "tds": 350,
        })

    def tearDown(self):
        self.client.__exit__(None, None, None)

    def test_water_budget_endpoint(self):
        response = self.client.get(
            "/api/water-budget",
            params={
                "land_area_acres": 2.5,
                "crop": "groundnut",
                "irrigation_method": "drip",
                "pumping_hours": 4,
                "borewell_id": "BW01",
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("available_liters_per_day", data)
        self.assertIn("demand_liters_per_day", data)
        self.assertIn("surplus_liters_per_day", data)

    def test_sensor_health_endpoint(self):
        response = self.client.get("/api/sensor-health", params={"borewell_id": "BW01"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("last_sensor_update", data)
        self.assertIn("wifi_signal_dbm", data)
        self.assertIn("sensor_faults", data)

    def test_portal_endpoint(self):
        response = self.client.get("/api/portal", params={"role": "officer"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("role", data)
        self.assertIn("villages", data)

    def test_notifications_endpoint(self):
        response = self.client.get("/api/notifications", params={"borewell_id": "BW01"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("notifications", data)

    def test_sms_tamil_message_format(self):
        msg = build_sms_message({"title": "Groundwater alert", "message": "Critical risk detected"}, "BW01", language="ta")
        self.assertIn("BW01", msg)
        self.assertIn("கடுமையான", msg)


if __name__ == "__main__":
    unittest.main()