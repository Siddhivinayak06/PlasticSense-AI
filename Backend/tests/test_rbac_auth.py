import time
import uuid
from datetime import datetime, timedelta, timezone
import jwt
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings
from app.infrastructure.database.session import SessionLocal
from app.infrastructure.database.models.user_profile_model import UserProfileModel, RoleAuditLogModel
from app.infrastructure.database.models.detection_model import DetectionModel

client = TestClient(app)


def make_test_token(sub: str, email: str, name: str = "Test User", expired: bool = False) -> str:
    """Generate a test JWT token."""
    now = datetime.now(timezone.utc)
    exp = now - timedelta(hours=1) if expired else now + timedelta(hours=2)
    payload = {
        "sub": sub,
        "email": email,
        "user_metadata": {"full_name": name, "name": name},
        "role": "authenticated",
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    # Encode with HS256 using test secret
    secret = settings.SUPABASE_JWT_SECRET or "wastesense-test-secret-key-32chars!"
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture(autouse=True)
def ensure_jwt_secret():
    old_secret = settings.SUPABASE_JWT_SECRET
    if not settings.SUPABASE_JWT_SECRET:
        settings.SUPABASE_JWT_SECRET = "wastesense-test-secret-key-32chars!"
    yield
    settings.SUPABASE_JWT_SECRET = old_secret


@pytest.fixture
def clean_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestRBACAuthentication:
    """14 Security Scenarios for Role-Based Access Control and Session Governance."""

    def test_01_citizen_default_role_assignment(self, clean_db):
        """1. New user registration defaults strictly to 'citizen' role."""
        unique_sub = str(uuid.uuid4())
        unique_email = f"citizen_{unique_sub[:8]}@example.com"
        token = make_test_token(sub=unique_sub, email=unique_email, name="Citizen One")

        res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == unique_email
        assert data["role"] == "citizen"
        assert data["is_active"] is True

    def test_02_admin_privilege_assignment_for_configured_admin(self, clean_db):
        """2. Admin privileges are granted when email is in ADMIN_EMAILS."""
        admin_email = "admin_super@example.com"
        old_admins = list(settings.ADMIN_EMAILS) if isinstance(settings.ADMIN_EMAILS, list) else []
        settings.ADMIN_EMAILS = [admin_email]

        try:
            admin_sub = str(uuid.uuid4())
            token = make_test_token(sub=admin_sub, email=admin_email, name="Super Admin")

            res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
            assert res.status_code == 200
            data = res.json()
            assert data["role"] == "admin"
        finally:
            settings.ADMIN_EMAILS = old_admins

    def test_03_citizen_denied_access_to_admin_endpoints(self, clean_db):
        """3. Citizen role cannot access administrator endpoints (HTTP 403 Forbidden)."""
        citizen_sub = str(uuid.uuid4())
        token = make_test_token(sub=citizen_sub, email=f"cit_{citizen_sub[:8]}@example.com")

        res = client.get("/api/v1/auth/users", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 403
        assert "privileges required" in res.json()["detail"].lower()

    def test_04_admin_granted_access_to_admin_endpoints(self, clean_db):
        """4. Admin role has authorized access to list users and audit logs."""
        admin_email = "admin_list@example.com"
        old_admins = list(settings.ADMIN_EMAILS) if isinstance(settings.ADMIN_EMAILS, list) else []
        settings.ADMIN_EMAILS = [admin_email]

        try:
            admin_sub = str(uuid.uuid4())
            token = make_test_token(sub=admin_sub, email=admin_email)

            res = client.get("/api/v1/auth/users", headers={"Authorization": f"Bearer {token}"})
            assert res.status_code == 200
            assert isinstance(res.json(), list)
        finally:
            settings.ADMIN_EMAILS = old_admins

    def test_05_client_self_promotion_rejected(self, clean_db):
        """5. Citizen cannot elevate their role to admin via payload or sync."""
        citizen_sub = str(uuid.uuid4())
        email = f"attacker_{citizen_sub[:8]}@example.com"
        token = make_test_token(sub=citizen_sub, email=email)

        # Attempt to promote via role update endpoint without admin credentials
        res = client.patch(
            f"/api/v1/auth/users/{citizen_sub}/role",
            json={"role": "admin", "reason": "Self-promotion attempt"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403

        # Verify role remains 'citizen'
        me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.json()["role"] == "citizen"

    def test_06_citizen_can_read_own_report(self, clean_db):
        """6. Citizen can read their own detection report (IDOR ownership check)."""
        citizen_sub = str(uuid.uuid4())
        token = make_test_token(sub=citizen_sub, email=f"owner_{citizen_sub[:8]}@example.com")
        # Ensure user profile exists to satisfy foreign key
        init_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert init_res.status_code == 200

        # Create report directly in DB owned by citizen
        det_id = str(uuid.uuid4())
        detection = DetectionModel(
            id=det_id,
            image_url="/media/uploads/test.jpg",
            detection_status="completed",
            user_id=citizen_sub,
        )
        clean_db.add(detection)
        clean_db.commit()

        res = client.get(f"/api/v1/detections/{det_id}", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert res.json()["data"]["id"] == det_id

    def test_07_citizen_forbidden_from_other_citizen_report(self, clean_db):
        """7. Citizen cannot access another citizen's private report (IDOR protection)."""
        victim_sub = str(uuid.uuid4())
        attacker_sub = str(uuid.uuid4())

        victim_token = make_test_token(sub=victim_sub, email=f"victim_{victim_sub[:8]}@example.com")
        client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {victim_token}"})

        attacker_token = make_test_token(sub=attacker_sub, email=f"attacker_{attacker_sub[:8]}@example.com")
        client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {attacker_token}"})

        # Create report owned by victim
        det_id = str(uuid.uuid4())
        detection = DetectionModel(
            id=det_id,
            image_url="/media/uploads/private.jpg",
            detection_status="completed",
            user_id=victim_sub,
        )
        clean_db.add(detection)
        clean_db.commit()

        # Attacker tries to read victim's report
        res = client.get(f"/api/v1/detections/{det_id}", headers={"Authorization": f"Bearer {attacker_token}"})
        assert res.status_code == 403
        assert "do not have permission" in res.json()["detail"].lower()

    def test_08_admin_can_access_any_report(self, clean_db):
        """8. Admin can access any citizen's report."""
        citizen_sub = str(uuid.uuid4())
        cit_token = make_test_token(sub=citizen_sub, email=f"cit_8_{citizen_sub[:8]}@example.com")
        client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {cit_token}"})

        admin_email = "admin_view_all@example.com"
        old_admins = list(settings.ADMIN_EMAILS) if isinstance(settings.ADMIN_EMAILS, list) else []
        settings.ADMIN_EMAILS = [admin_email]

        try:
            admin_sub = str(uuid.uuid4())
            admin_token = make_test_token(sub=admin_sub, email=admin_email)
            client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {admin_token}"})

            det_id = str(uuid.uuid4())
            detection = DetectionModel(
                id=det_id,
                image_url="/media/uploads/citizen_report.jpg",
                detection_status="completed",
                user_id=citizen_sub,
            )
            clean_db.add(detection)
            clean_db.commit()

            res = client.get(f"/api/v1/detections/{det_id}", headers={"Authorization": f"Bearer {admin_token}"})
            assert res.status_code == 200
            assert res.json()["data"]["id"] == det_id
        finally:
            settings.ADMIN_EMAILS = old_admins

    def test_09_citizen_can_delete_own_report(self, clean_db):
        """9. Citizen can delete their own report."""
        citizen_sub = str(uuid.uuid4())
        token = make_test_token(sub=citizen_sub, email=f"del_{citizen_sub[:8]}@example.com")
        client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})

        det_id = str(uuid.uuid4())
        detection = DetectionModel(
            id=det_id,
            image_url="/media/uploads/delete_me.jpg",
            detection_status="completed",
            user_id=citizen_sub,
        )
        clean_db.add(detection)
        clean_db.commit()

        res = client.delete(f"/api/v1/detections/{det_id}", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert res.json()["status"] == "success"

    def test_10_citizen_cannot_delete_other_citizen_report(self, clean_db):
        """10. Citizen cannot delete another user's report."""
        victim_sub = str(uuid.uuid4())
        attacker_sub = str(uuid.uuid4())

        victim_token = make_test_token(sub=victim_sub, email=f"vic_del_{victim_sub[:8]}@example.com")
        client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {victim_token}"})

        attacker_token = make_test_token(sub=attacker_sub, email=f"del_attack_{attacker_sub[:8]}@example.com")
        client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {attacker_token}"})

        det_id = str(uuid.uuid4())
        detection = DetectionModel(
            id=det_id,
            image_url="/media/uploads/victim_delete.jpg",
            detection_status="completed",
            user_id=victim_sub,
        )
        clean_db.add(detection)
        clean_db.commit()

        res = client.delete(f"/api/v1/detections/{det_id}", headers={"Authorization": f"Bearer {attacker_token}"})
        assert res.status_code == 403

    def test_11_expired_token_rejected(self, clean_db):
        """11. Expired JWT token is rejected with HTTP 401 Unauthorized."""
        user_sub = str(uuid.uuid4())
        expired_token = make_test_token(sub=user_sub, email="expired@example.com", expired=True)

        res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
        assert res.status_code == 401
        assert "expired" in res.json()["detail"].lower()

    def test_12_malformed_token_rejected(self, clean_db):
        """12. Malformed token string is rejected with HTTP 401 Unauthorized."""
        res = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-valid-jwt-token"})
        assert res.status_code == 401

    def test_13_deactivated_account_rejected(self, clean_db):
        """13. Deactivated / disabled user account cannot access authenticated APIs."""
        user_sub = str(uuid.uuid4())
        token = make_test_token(sub=user_sub, email=f"disabled_{user_sub[:8]}@example.com")

        # First initialize profile
        init_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert init_res.status_code == 200

        # Mark user as deactivated in DB
        user = clean_db.query(UserProfileModel).filter(UserProfileModel.id == user_sub).first()
        user.is_active = False
        clean_db.commit()

        # Subsequent request must be rejected with 403 Forbidden
        blocked_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert blocked_res.status_code == 403
        assert "deactivated" in blocked_res.json()["detail"].lower()

    def test_14_sole_administrator_demotion_prevented(self, clean_db):
        """14. Sole active administrator cannot be demoted (prevents administrative lockout)."""
        admin_email = "sole_admin@example.com"
        old_admins = list(settings.ADMIN_EMAILS) if isinstance(settings.ADMIN_EMAILS, list) else []
        settings.ADMIN_EMAILS = [admin_email]

        try:
            admin_sub = str(uuid.uuid4())
            admin_token = make_test_token(sub=admin_sub, email=admin_email)

            # Initialize profile
            init_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
            assert init_res.status_code == 200

            # Ensure this is the only active admin in the DB for this test
            clean_db.query(UserProfileModel).filter(
                UserProfileModel.role == "admin",
                UserProfileModel.id != admin_sub,
            ).update({"role": "citizen"})
            clean_db.commit()

            # Attempt self-demotion
            demote_res = client.patch(
                f"/api/v1/auth/users/{admin_sub}/role",
                json={"role": "citizen", "reason": "Accidental self-demotion"},
                headers={"Authorization": f"Bearer {admin_token}"},
            )
            assert demote_res.status_code == 400
            assert "sole active administrator" in demote_res.json()["detail"].lower()
        finally:
            settings.ADMIN_EMAILS = old_admins
