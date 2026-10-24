"""Upload validation, storage naming, rate limiting and request limits.

All rejections here happen before any database write or model call, so the
endpoint tests are safe to run against the configured database.
"""
import io
import tempfile
import unittest

from fastapi import HTTPException
from fastapi.testclient import TestClient
from PIL import Image

from app.api import upload_guard
from app.application.services.detection_service import sniff_image
from app.core.config import settings
from app.infrastructure.external.storage_client import StorageClient
from app.main import app


def _image_bytes(fmt: str = "JPEG", size=(16, 16)) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", size, (30, 120, 60)).save(buf, fmt)
    return buf.getvalue()


class SniffImageTests(unittest.TestCase):
    def test_extension_comes_from_content_not_filename(self):
        self.assertEqual(sniff_image(_image_bytes("PNG"))[0], ".png")
        self.assertEqual(sniff_image(_image_bytes("JPEG"))[0], ".jpg")
        self.assertEqual(sniff_image(_image_bytes("WEBP"))[0], ".webp")

    def test_rejects_html_and_truncated_images(self):
        with self.assertRaises(ValueError):
            sniff_image(b"<html><script>alert(1)</script></html>")
        with self.assertRaises(ValueError):
            sniff_image(_image_bytes("PNG")[:40])

    def test_rejects_unsupported_formats(self):
        with self.assertRaises(ValueError):
            sniff_image(_image_bytes("GIF"))

    def test_rejects_decompression_bombs(self):
        original = settings.MAX_IMAGE_PIXELS
        settings.MAX_IMAGE_PIXELS = 100
        try:
            with self.assertRaises(ValueError):
                sniff_image(_image_bytes("PNG", size=(20, 20)))
        finally:
            settings.MAX_IMAGE_PIXELS = original


class StorageNamingTests(unittest.TestCase):
    def test_client_filename_cannot_choose_path_or_type(self):
        with tempfile.TemporaryDirectory() as directory:
            client = StorageClient(directory, url_prefix="/media/uploads")
            url = client.save_file(b"x", "../../etc/passwd.jpg")
            self.assertRegex(url, r"^/media/uploads/[0-9a-f]{32}\.jpg$")
            for bad in ("page.html", "vector.svg", "script.js"):
                with self.assertRaises(ValueError):
                    client.save_file(b"x", bad)


class RateLimitTests(unittest.TestCase):
    def setUp(self):
        upload_guard.reset_rate_limits()
        self.original = settings.INFERENCE_RATE_LIMIT_PER_MINUTE

    def tearDown(self):
        settings.INFERENCE_RATE_LIMIT_PER_MINUTE = self.original
        upload_guard.reset_rate_limits()

    def test_limit_is_enforced_per_client(self):
        settings.INFERENCE_RATE_LIMIT_PER_MINUTE = 2
        upload_guard._check("10.0.0.1")
        upload_guard._check("10.0.0.1")
        with self.assertRaises(HTTPException) as ctx:
            upload_guard._check("10.0.0.1")
        self.assertEqual(ctx.exception.status_code, 429)
        upload_guard._check("10.0.0.2")  # a different client is unaffected


class DetectEndpointRejectionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        upload_guard.reset_rate_limits()

    def _post(self, content: bytes, name: str, ctype: str, **form):
        return self.client.post(
            "/api/v1/detections/detect",
            files={"image": (name, content, ctype)},
            data=form,
        )

    def test_rejects_non_image_bytes(self):
        r = self._post(b"not an image", "a.jpg", "image/jpeg")
        self.assertEqual(r.status_code, 400)

    def test_rejects_disallowed_extension(self):
        r = self._post(_image_bytes(), "a.html", "image/jpeg")
        self.assertEqual(r.status_code, 400)

    def test_rejects_disallowed_content_type(self):
        r = self._post(_image_bytes(), "a.jpg", "text/html")
        self.assertEqual(r.status_code, 400)

    def test_rejects_oversized_upload_with_413(self):
        original = settings.MAX_UPLOAD_SIZE_MB
        settings.MAX_UPLOAD_SIZE_MB = 0
        try:
            r = self._post(_image_bytes(), "a.jpg", "image/jpeg")
            self.assertEqual(r.status_code, 413)
        finally:
            settings.MAX_UPLOAD_SIZE_MB = original

    def test_rejects_out_of_range_or_partial_coordinates(self):
        self.assertEqual(self._post(_image_bytes(), "a.jpg", "image/jpeg", latitude="91", longitude="0").status_code, 422)
        self.assertEqual(self._post(_image_bytes(), "a.jpg", "image/jpeg", latitude="10").status_code, 422)

    def test_cors_only_admits_configured_origins(self):
        ok = self.client.options(
            "/api/v1/health",
            headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"},
        )
        self.assertEqual(ok.headers.get("access-control-allow-origin"), "http://localhost:3000")
        bad = self.client.options(
            "/api/v1/health",
            headers={"Origin": "https://evil.vercel.app", "Access-Control-Request-Method": "GET"},
        )
        self.assertIsNone(bad.headers.get("access-control-allow-origin"))

    def test_manual_status_cannot_claim_verification(self):
        r = self.client.patch("/api/v1/assignments/does-not-matter", json={"status": "verified"})
        self.assertEqual(r.status_code, 422)


if __name__ == "__main__":
    unittest.main()
