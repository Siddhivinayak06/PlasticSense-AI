import unittest
from fastapi.testclient import TestClient
from app.main import app


class TestNewEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_ngos_endpoint(self):
        response = self.client.get("/api/v1/ngos")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        self.assertIn("name", data[0])
        self.assertIn("city", data[0])
        self.assertIn("availability", data[0])

    def test_assignments_endpoint(self):
        response = self.client.get("/api/v1/assignments")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        self.assertIn("title", data[0])
        self.assertIn("status", data[0])

    def test_hotspots_endpoint(self):
        response = self.client.get("/api/v1/detections/hotspots")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("hotspots", data)
        self.assertIn("total_hotspots", data)
        self.assertIsInstance(data["hotspots"], list)
        if len(data["hotspots"]) > 0:
            h = data["hotspots"][0]
            self.assertIn("latitude", h)
            self.assertIn("longitude", h)
            self.assertIn("total_waste_objects", h)
            self.assertIn("severity", h)

    def test_dashboard_summary_endpoint(self):
        response = self.client.get("/api/v1/statistics/dashboard/summary")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_detections", data)
        self.assertIn("total_objects_detected", data)
        self.assertIn("critical_hotspots", data)
        self.assertIn("active_ngos", data)
        self.assertIn("completed_cleanups", data)

    def test_analytics_endpoint(self):
        response = self.client.get("/api/v1/statistics/analytics")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("time_series", data)
        self.assertIn("severity_breakdown", data)
        self.assertIn("risk_distribution", data)
        self.assertIn("insights", data)

    def test_impact_endpoint(self):
        response = self.client.get("/api/v1/statistics/impact")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_detections", data)
        self.assertIn("total_objects_detected", data)
        self.assertIn("high_risk_sites", data)
        self.assertIn("completed_cleanups", data)
        self.assertIn("verified_cleanups", data)
        self.assertIn("category_impact", data)


if __name__ == "__main__":
    unittest.main()
