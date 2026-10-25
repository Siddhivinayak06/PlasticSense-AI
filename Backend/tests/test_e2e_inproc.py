"""Run the end-to-end assertions via FastAPI TestClient without needing port binding."""
import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import os
import sys

sys.path.insert(0, "/home/bipin/Documents/PlasticSense-AI/Backend")
os.chdir("/home/bipin/Documents/PlasticSense-AI/Backend")

from app.main import app

client = TestClient(app)

LAB_IMAGES = Path(__file__).resolve().parents[2] / "WasteSense-Model-Lab" / "test_images"
OVERLAY_IMAGE = LAB_IMAGES / "0956e02a97954215857ec5dbfac4182f.jpeg"

def test_health():
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] in ("ok", "degraded")
    assert "backend" in body["database"]

def test_model_info():
    r = client.get("/api/v1/model/info")
    assert r.status_code == 200
    body = r.json()
    assert body["detector"]["architecture"] == "yolo11s"
    assert body["detector"]["parameters"] == 9430114
    assert body["capabilities"]["resin_polymer_identification"] is False

def test_end_to_end_detection():
    if not OVERLAY_IMAGE.exists():
        pytest.skip("Test image not found")
    content = OVERLAY_IMAGE.read_bytes()
    r = client.post(
        "/api/v1/detections/detect",
        files={"file": ("test.jpeg", content, "image/jpeg")}
    )
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["detection_status"] == "completed"
    assert data["items"]
    assert len(data["items"]) >= 10, f"Expected dense detections, got {len(data['items'])}"
    assert data["authenticity_screening"] is not None
    assert "suspicion_score" in data["authenticity_screening"]
    
    # Check retrieval
    det_id = data["id"]
    get_r = client.get(f"/api/v1/detections/{det_id}")
    assert get_r.status_code == 200
    assert get_r.json()["data"]["id"] == det_id
    print(f"\nSUCCESS: E2E Test Passed with {len(data['items'])} detections. Screening: {data['authenticity_screening']['flag_level']}")

if __name__ == "__main__":
    test_health()
    print("Health test passed.")
    test_model_info()
    print("Model info test passed.")
    test_end_to_end_detection()
