from typing import List
from pydantic import BaseModel


class DetectionItem(BaseModel):
    """A single detected plastic object."""
    class_name: str
    confidence: float
    bbox: List[float]  # [x1, y1, x2, y2]


class PredictResponse(BaseModel):
    """Response contract returned by the ML service /predict endpoint."""
    model_version: str
    detections: List[DetectionItem]
    processing_time_ms: int
