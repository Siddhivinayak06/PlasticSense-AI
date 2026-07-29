from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional
from app.domain.entities.location import Location
from app.domain.enums.waste_type import WasteType


@dataclass
class DetectionItem:
    id: Optional[str]
    waste_type: WasteType
    confidence: float
    bbox_x: float
    bbox_y: float
    bbox_w: float
    bbox_h: float


@dataclass
class Detection:
    id: Optional[str]
    location: Location
    image_url: str
    model_version: str = "v1.0"
    detection_status: str = "pending"
    failure_reason: Optional[str] = None
    items: List[DetectionItem] = field(default_factory=list)
    created_at: Optional[datetime] = field(default_factory=lambda: datetime.now(timezone.utc))
