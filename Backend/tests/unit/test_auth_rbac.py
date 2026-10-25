import unittest
from fastapi.testclient import TestClient
from app.main import app


class TestAuthAndRBAC(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_unauthenticated_me_returns_401(self):
        r = self.client.get("/api/v1/auth/me")
        self.assertEqual(r.status_code, 401)
        self.assertIn("Authentication required", r.json()["detail"])

    def test_authenticated_citizen_user_me(self):
        r = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer test-user-token"},
        )
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["email"], "citizen@wastesense.ai")
        self.assertEqual(data["role"], "user")

    def test_authenticated_admin_user_me(self):
        r = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer test-admin-token"},
        )
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["role"], "admin")

    def test_citizen_user_cannot_access_admin_user_list(self):
        r = self.client.get(
            "/api/v1/auth/users",
            headers={"Authorization": "Bearer test-user-token"},
        )
        self.assertEqual(r.status_code, 403)
        self.assertIn("Municipal Administrator privileges required", r.json()["detail"])

    def test_admin_can_access_user_list(self):
        r = self.client.get(
            "/api/v1/auth/users",
            headers={"Authorization": "Bearer test-admin-token"},
        )
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json(), list)

    def test_citizen_user_cannot_create_ngo(self):
        ngo_payload = {
            "name": "Unauthorized NGO",
            "city": "Mumbai",
            "state": "Maharashtra",
            "contact_person": "Unauthorized Person",
            "email": "unauthorized@ngo.org",
            "phone": "+919876543210",
            "team_size": 15,
            "specializations": ["coastal"],
        }
        r = self.client.post(
            "/api/v1/ngos",
            json=ngo_payload,
            headers={"Authorization": "Bearer test-user-token"},
        )
        self.assertEqual(r.status_code, 403)

    def test_admin_can_create_ngo(self):
        ngo_payload = {
            "name": "Verified Municipal NGO",
            "city": "Thane",
            "state": "Maharashtra",
            "contact_person": "Siddharth Rao",
            "email": "siddharth@municipal-clean.org",
            "phone": "+919876543299",
            "team_size": 20,
            "specializations": ["dumpsites", "riverbanks"],
        }
        r = self.client.post(
            "/api/v1/ngos",
            json=ngo_payload,
            headers={"Authorization": "Bearer test-admin-token"},
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["name"], "Verified Municipal NGO")

    def test_citizen_user_cannot_create_assignment(self):
        assignment_payload = {
            "title": "Unauthorized Assignment",
            "location_name": "Kalyan Dumpsite Sector 4",
            "priority": "high",
            "severity": "critical",
        }
        r = self.client.post(
            "/api/v1/assignments",
            json=assignment_payload,
            headers={"Authorization": "Bearer test-user-token"},
        )
        self.assertEqual(r.status_code, 403)

    def test_admin_can_create_assignment(self):
        assignment_payload = {
            "title": "Authorized Municipal Cleanup",
            "location_name": "Kalyan Creek Shore",
            "latitude": 19.2437,
            "longitude": 73.1355,
            "priority": "urgent",
            "severity": "critical",
            "waste_count": 45,
            "risk_score": 82.5,
        }
        r = self.client.post(
            "/api/v1/assignments",
            json=assignment_payload,
            headers={"Authorization": "Bearer test-admin-token"},
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["title"], "Authorized Municipal Cleanup")

    def test_public_routes_remain_accessible(self):
        r_health = self.client.get("/api/v1/health")
        self.assertEqual(r_health.status_code, 200)

        r_hotspots = self.client.get("/api/v1/detections/hotspots")
        self.assertEqual(r_hotspots.status_code, 200)

        r_summary = self.client.get("/api/v1/statistics/dashboard/summary")
        self.assertEqual(r_summary.status_code, 200)


if __name__ == "__main__":
    unittest.main()
