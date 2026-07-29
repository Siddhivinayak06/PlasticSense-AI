"""HTTP adapter for the separately deployed ML inference service."""

import json
import uuid
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.application.interfaces.i_ml_client import IMLClient, MLClientError, MLPrediction
from app.core.config import settings
from app.domain.entities.detection import DetectionItem
from app.domain.enums.waste_type import WasteType


class YoloMLClient(IMLClient):
    def __init__(self, base_url: str = settings.ML_SERVICE_URL, timeout: float = settings.ML_SERVICE_TIMEOUT_SECONDS):
        self.predict_url = f"{base_url.rstrip('/')}/predict"
        self.timeout = timeout

    def predict(self, file_bytes: bytes, filename: str, content_type: str) -> MLPrediction:
        boundary = f"----PlasticSense{uuid.uuid4().hex}"
        body = self._multipart_body(boundary, file_bytes, filename, content_type)
        request = Request(
            self.predict_url,
            data=body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
            method="POST",
        )
        try:
            with urlopen(request, timeout=self.timeout) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            raise MLClientError(f"ML service returned HTTP {error.code}") from error
        except (URLError, TimeoutError) as error:
            raise MLClientError(f"ML service unavailable: {error.reason if isinstance(error, URLError) else error}") from error
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise MLClientError("ML service returned invalid JSON") from error
        return self._normalize(payload)

    @staticmethod
    def _multipart_body(boundary: str, file_bytes: bytes, filename: str, content_type: str) -> bytes:
        prefix = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="image"; filename="{filename}"\r\n'
            f"Content-Type: {content_type}\r\n\r\n"
        ).encode("utf-8")
        return prefix + file_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    @staticmethod
    def _normalize(payload: object) -> MLPrediction:
        if not isinstance(payload, dict) or not isinstance(payload.get("model_version"), str):
            raise MLClientError("ML service response is missing model_version")
        raw_detections = payload.get("detections")
        if not isinstance(raw_detections, list):
            raise MLClientError("ML service response is missing detections")
        items = []
        for raw in raw_detections:
            if not isinstance(raw, dict):
                raise MLClientError("ML service returned an invalid detection item")
            label, confidence, bbox = raw.get("class"), raw.get("confidence"), raw.get("bbox")
            if not isinstance(label, str) or not isinstance(confidence, (int, float)) or not isinstance(bbox, list) or len(bbox) != 4:
                raise MLClientError("ML service detection must contain class, confidence, and [x1,y1,x2,y2] bbox")
            x1, y1, x2, y2 = bbox
            if not all(isinstance(value, (int, float)) for value in bbox) or not 0.0 <= float(confidence) <= 1.0 or x2 < x1 or y2 < y1:
                raise MLClientError("ML service returned an invalid bounding box")
            waste_type = WasteType(label) if label in WasteType._value2member_map_ else WasteType.OTHER
            items.append(DetectionItem(
                id=str(uuid.uuid4()), waste_type=waste_type, confidence=float(confidence),
                bbox_x=float(x1), bbox_y=float(y1), bbox_w=float(x2 - x1), bbox_h=float(y2 - y1),
            ))
        return MLPrediction(model_version=payload["model_version"], items=items)
