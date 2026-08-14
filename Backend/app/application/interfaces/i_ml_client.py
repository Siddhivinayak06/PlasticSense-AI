from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

from app.domain.entities.detection import DetectionItem


class MLClientError(Exception):
    """The configured ML service could not produce a valid prediction."""


@dataclass(frozen=True)
class MLPrediction:
    model_version: str
    items: List[DetectionItem]
    annotated_image_bytes: Optional[bytes] = None
    processing_time_ms: Optional[int] = None


class IMLClient(ABC):
    @abstractmethod
    def predict(self, file_bytes: bytes, filename: str, content_type: str) -> MLPrediction:
        """Return normalized domain items for one image, or raise MLClientError."""
