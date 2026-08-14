from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional
from app.domain.entities.location import Location


@dataclass
class DetectionItem:
    id: Optional[str]
    class_name: str
    waste_group: str
    confidence: float
    bbox_x: float
    bbox_y: float
    bbox_w: float
    bbox_h: float


@dataclass
class Detection:
    id: Optional[str]
    image_url: str
    annotated_image_url: Optional[str] = None
    processing_time_ms: Optional[int] = None
    model_version: str = "v1.0"
    detection_status: str = "pending"
    failure_reason: Optional[str] = None
    location: Optional[Location] = None
    location_source: Optional[str] = None
    location_confidence: Optional[float] = None
    items: List[DetectionItem] = field(default_factory=list)
    created_at: Optional[datetime] = field(default_factory=lambda: datetime.now(timezone.utc))
