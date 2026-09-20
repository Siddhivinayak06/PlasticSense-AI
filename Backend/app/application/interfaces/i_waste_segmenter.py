"""Interface and data structures for Waste Segmentation Model (Model 2)."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, Optional
import numpy as np


@dataclass
class SegmenterPrediction:
    """Standardized output from Model 2 segmentation model."""
    model_name: str
    waste_coverage_percent: float
    material_coverage: Dict[str, float] = field(default_factory=dict)
    material_counts: Dict[str, int] = field(default_factory=dict)
    total_masks: int = 0
    annotated_image_bytes: Optional[bytes] = None
    processing_time_ms: int = 0
    # Internal mask representations for downstream union or feature processing
    combined_mask: Optional[np.ndarray] = None


class IWasteSegmenter(ABC):
    """Clean interface for scene-level waste segmentation and coverage."""

    @abstractmethod
    def predict(self, image: np.ndarray) -> SegmenterPrediction:
        """Run segmentation and mask-union coverage calculation on an OpenCV BGR image."""
        pass
