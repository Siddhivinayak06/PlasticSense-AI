from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional


@dataclass
class DetectionCreateDTO:
    latitude: Optional[float]
    longitude: Optional[float]
    filename: str
    content_type: str
    file_bytes: bytes


@dataclass
class DetectionItemDTO:
    id: Optional[str]
    class_name: str
    waste_group: str
    confidence: float
    bbox_x: float
    bbox_y: float
    bbox_w: float
    bbox_h: float


@dataclass
class DetectionResponseDTO:
    id: str
    image_url: str
    annotated_image_url: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    location_source: Optional[str]
    location_confidence: Optional[float]
    model_version: str
    detection_status: str
    failure_reason: Optional[str]
    items: List[DetectionItemDTO]
    created_at: datetime
    processing_time_ms: Optional[int]
    summary: Optional[dict]
