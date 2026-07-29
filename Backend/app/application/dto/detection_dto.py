from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional


@dataclass
class DetectionCreateDTO:
    latitude: float
    longitude: float
    filename: str
    content_type: str
    file_bytes: bytes


@dataclass
class DetectionItemDTO:
    id: Optional[str]
    waste_type: str
    confidence: float
    bbox_x: float
    bbox_y: float
    bbox_w: float
    bbox_h: float


@dataclass
class DetectionResponseDTO:
    id: str
    image_url: str
    latitude: float
    longitude: float
    model_version: str
    detection_status: str
    failure_reason: Optional[str]
    items: List[DetectionItemDTO]
    created_at: datetime
