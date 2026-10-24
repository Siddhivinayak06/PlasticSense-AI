"""End-to-end smoke tests against a locally running backend.

These exercise the real HTTP API, real model inference and real persistence - not
mocks. They are skipped automatically when the server is not running.

Run:  pytest tests/test_e2e_local.py -v     (with uvicorn already serving :8000)
"""
from __future__ import annotations

import io
import os
from pathlib import Path

import pytest

requests = pytest.importorskip("requests")

BASE = os.environ.get("WASTESENSE_API", "http://127.0.0.1:8000/api/v1")
LAB_IMAGES = Path(__file__).resolve().parents[2] / "WasteSense-Model-Lab" / "test_images"

# Dumpsite photo whose GPS is burned into the pixel overlay (no EXIF GPS).
OVERLAY_IMAGE = LAB_IMAGES / "0956e02a97954215857ec5dbfac4182f.jpeg"


def _server_up() -> bool:
    try:
        return requests.get(f"{BASE}/health", timeout=5).status_code == 200
    except Exception:
        return False


pytestmark = pytest.mark.skipif(
    not _server_up(), reason="backend not running on :8000"
)


@pytest.fixture(scope="module")
def overlay_image_bytes() -> bytes:
    if not OVERLAY_IMAGE.exists():
        pytest.skip(f"test image missing: {OVERLAY_IMAGE}")
    return OVERLAY_IMAGE.read_bytes()


def _post_detection(content: bytes, name: str = "test.jpg", **form) -> requests.Response:
    return requests.post(
        f"{BASE}/detections/detect",
        files={"file": (name, content, "image/jpeg")},
        data=form,
        timeout=300,
    )


# ── health & configuration ────────────────────────────────────────────────────

def test_health_reports_database_backend():
    r = requests.get(f"{BASE}/health", timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    # The backend must always disclose which database it actually used.
    assert "backend" in body["database"]
    assert "using_fallback" in body["database"]


def test_model_info_reports_real_architecture():
    r = requests.get(f"{BASE}/model/info", timeout=60)
    assert r.status_code == 200
    body = r.json()
    for role in ("detector", "segmenter"):
        assert body[role]["architecture"] != "unknown", f"{role} architecture not introspected"
        assert body[role]["parameters"], f"{role} parameter count missing"
    # Capabilities the system must never claim.
    caps = body["capabilities"]
    assert caps["resin_polymer_identification"] is False
    assert caps["waste_mass_estimation"] is False
    assert caps["hotspot_forecasting"] is False


# ── detection pipeline ────────────────────────────────────────────────────────

def test_detect_returns_and_persists_results(overlay_image_bytes):
    r = _post_detection(overlay_image_bytes, "kalyan.jpeg")
    assert r.status_code == 201, r.text
    body = r.json()

    assert body["id"]
    assert body["detection_status"] == "completed"
    assert body["image_url"], "original upload not stored"
    assert body["annotated_image_url"], "annotated derivative not stored"
    assert body["processing_time_ms"] is not None

    # The record must be retrievable afterwards.
    got = requests.get(f"{BASE}/detections/{body['id']}", timeout=30)
    assert got.status_code == 200
    assert got.json()["data"]["id"] == body["id"]


def test_stored_images_are_actually_retrievable(overlay_image_bytes):
    """Both image URLs must resolve.

    Regression guard: annotated images were written to the uploads directory but
    reported under /media/results/, so every annotated URL 404'd in the UI.
    """
    body = _post_detection(overlay_image_bytes, "kalyan.jpeg").json()
    root = BASE.rsplit("/api/", 1)[0]
    for field in ("image_url", "annotated_image_url"):
        url = body[field]
        assert url, f"{field} missing"
        r = requests.get(f"{root}{url}", timeout=30)
        assert r.status_code == 200, f"{field} -> {url} returned {r.status_code}"
        assert r.content, f"{field} served an empty body"


def test_coverage_is_labelled_as_indicative(overlay_image_bytes):
    body = _post_detection(overlay_image_bytes, "kalyan.jpeg").json()
    features = body["features"]
    assert features["coverage_is_validated"] is False
    assert "indicative" in features["coverage_label"].lower()
    assert features["coverage_method"] in {
        "segmentation_mask_union",
        "bbox_mask_hybrid_union",
        "detector_bbox_union",
        "none",
    }
    assert features["coverage_method_description"]
    assert "UNDERSTATES" in features["coverage_caveat"]


def test_no_resin_type_is_ever_claimed(overlay_image_bytes):
    """The resin classifier was withdrawn; nothing may assert a polymer type."""
    body = _post_detection(overlay_image_bytes, "kalyan.jpeg").json()
    resin_codes = {"PET", "HDPE", "LDPE", "PP", "PS"}
    for item in body["items"]:
        assert item["class_name"] not in resin_codes
        # Labels like "Bottle (PET)" were previously synthesised from bbox geometry.
        assert not any(f"({code})" in item["class_name"] for code in resin_codes)


def test_risk_assessment_is_traceable(overlay_image_bytes):
    body = _post_detection(overlay_image_bytes, "kalyan.jpeg").json()
    risk = body["risk"]
    assert risk is not None
    assert 0.0 <= risk["score"] <= 100.0
    assert risk["severity"] in {"LOW", "MODERATE", "HIGH", "CRITICAL"}
    # Every score must decompose into its weighted parts.
    assert set(risk["component_scores"]) == {"coverage", "density", "composition", "hazard"}
    assert risk["explanation"]
    weights = risk["component_weights"]
    assert abs(sum(weights.values()) - 1.0) < 0.01


# ── geolocation: the three supported paths ────────────────────────────────────

def test_gps_from_pixel_overlay_ocr(overlay_image_bytes):
    """29 of 31 field images carry GPS only as burned-in overlay text."""
    body = _post_detection(overlay_image_bytes, "kalyan.jpeg").json()
    assert body["location_source"] == "image_overlay_ocr"
    # Coordinates printed on this specific photo.
    assert body["latitude"] == pytest.approx(19.2039, abs=0.01)
    assert body["longitude"] == pytest.approx(73.1355, abs=0.01)


def test_manual_coordinates_take_precedence(overlay_image_bytes):
    body = _post_detection(
        overlay_image_bytes, "kalyan.jpeg", latitude=12.9716, longitude=77.5946
    ).json()
    assert body["latitude"] == pytest.approx(12.9716, abs=1e-4)
    assert body["longitude"] == pytest.approx(77.5946, abs=1e-4)
    assert body["location_source"] == "manual"


def test_image_without_location_still_analyses():
    """Analysis must not be blocked by absent geolocation."""
    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (640, 480), (90, 90, 90)).save(buf, format="JPEG")
    r = _post_detection(buf.getvalue(), "plain.jpg")
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["detection_status"] == "completed"
    assert body["latitude"] is None and body["longitude"] is None
    # Must report absence rather than inventing a coordinate.
    assert body["location_source"] in (None, "none", "unavailable")


def test_rejects_non_image_upload():
    r = _post_detection(b"this is definitely not an image", "notes.txt")
    assert r.status_code in (400, 415, 422), r.text


# ── observed clusters (explicitly not a forecast) ─────────────────────────────

def test_clusters_are_descriptive_not_predictive():
    r = requests.get(f"{BASE}/detections/hotspots", timeout=60)
    assert r.status_code == 200
    body = r.json()
    assert body["is_forecast"] is False
    assert "does not predict" in body["methodology"]
    for h in body["hotspots"]:
        assert h["report_count"] >= 1
        # Unscored clusters must stay null, never a stand-in number.
        if h["severity"] == "unknown":
            assert h["max_risk_score"] is None


def test_map_only_returns_located_detections():
    r = requests.get(f"{BASE}/detections/map", timeout=30)
    assert r.status_code == 200
    for d in r.json()["detections"]:
        assert d["latitude"] is not None and d["longitude"] is not None


# ── listing & statistics ──────────────────────────────────────────────────────

def test_detection_listing_paginates():
    r = requests.get(f"{BASE}/detections", params={"page": 1, "limit": 5}, timeout=30)
    assert r.status_code == 200
    body = r.json()
    assert len(body["data"]) <= 5
    assert body["meta"]["page"] == 1
    assert body["meta"]["total_items"] >= len(body["data"])


@pytest.mark.parametrize(
    "path", ["/statistics", "/statistics/dashboard/summary", "/statistics/analytics", "/statistics/impact"]
)
def test_statistics_endpoints_respond(path):
    r = requests.get(f"{BASE}{path}", timeout=60)
    assert r.status_code == 200, r.text


@pytest.mark.parametrize("path", ["/ngos", "/assignments"])
def test_operational_endpoints_respond(path):
    r = requests.get(f"{BASE}{path}", timeout=30)
    assert r.status_code == 200, r.text
