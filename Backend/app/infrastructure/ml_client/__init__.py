"""Infrastructure ML Client package exposing dual-model inference services."""

from app.infrastructure.ml_client.dual_model_ml_client import DualModelMLClient
from app.infrastructure.ml_client.waste_detector import WasteDetector
from app.infrastructure.ml_client.waste_segmenter import WasteSegmenter
from app.infrastructure.ml_client.yolo_ml_client import LocalYoloMLClient

__all__ = [
    "DualModelMLClient",
    "WasteDetector",
    "WasteSegmenter",
    "LocalYoloMLClient",
]
