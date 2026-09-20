"""Interface and data structures for Waste Object Detector (Model 1)."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List, Optional
import numpy as np

from app.domain.entities.detection import DetectionItem


@dataclass(frozen=True)
class DetectorPrediction:
    """Standardized output from Model 1 fine-grained detector."""
    model_name: str
    items: List[DetectionItem]
    class_counts: Dict[str, int] = field(default_factory=dict)
    total_objects: int = 0
    annotated_image_bytes: Optional[bytes] = None
    processing_time_ms: int = 0


class IWasteDetector(ABC):
    """Clean interface for waste object detection."""

    @abstractmethod
    def predict(self, image: np.ndarray) -> DetectorPrediction:
        """Run fine-grained waste detection on an OpenCV BGR image."""
        pass
