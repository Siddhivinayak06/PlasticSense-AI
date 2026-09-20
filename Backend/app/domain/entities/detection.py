from datetime import datetime, timezone
from typing import Any, List, Optional
from app.domain.entities.location import Location
from app.domain.enums.waste_type import WasteType


class DetectionItem:
    def __init__(
        self,
        id: Optional[str] = None,
        class_name: Optional[Any] = None,
        waste_group: Optional[str] = None,
        confidence: float = 0.0,
        bbox_x: float = 0.0,
        bbox_y: float = 0.0,
        bbox_w: float = 0.0,
        bbox_h: float = 0.0,
        waste_type: Optional[Any] = None,
        *args,
        **kwargs,
    ):
        self.id = id
        # Check if legacy 7 positional args were passed: (id, waste_type, confidence, bbox_x, bbox_y, bbox_w, bbox_h)
        if len(args) == 5:
            legacy_waste_type = class_name
            legacy_conf = waste_group
            self.class_name = str(getattr(legacy_waste_type, "value", legacy_waste_type))
            self.waste_group = "plastic"
            self.confidence = float(legacy_conf)
            self.bbox_x = float(args[0])
            self.bbox_y = float(args[1])
            self.bbox_w = float(args[2])
            self.bbox_h = float(args[3])
            self.waste_type = legacy_waste_type
            return

        if waste_type is not None:
            self.waste_type = waste_type
            self.class_name = class_name or str(getattr(waste_type, "value", waste_type))
            self.waste_group = waste_group or "plastic"
        else:
            self.class_name = str(getattr(class_name, "value", class_name)) if class_name is not None else "unknown"
            self.waste_group = waste_group or "unknown"
            self.waste_type = None

        self.confidence = confidence
        self.bbox_x = bbox_x
        self.bbox_y = bbox_y
        self.bbox_w = bbox_w
        self.bbox_h = bbox_h

    def __repr__(self) -> str:
        return (
            f"DetectionItem(id={self.id!r}, class_name={self.class_name!r}, "
            f"waste_group={self.waste_group!r}, confidence={self.confidence!r}, "
            f"bbox_x={self.bbox_x!r}, bbox_y={self.bbox_y!r}, bbox_w={self.bbox_w!r}, bbox_h={self.bbox_h!r})"
        )


class Detection:
    def __init__(
        self,
        id: Optional[str] = None,
        image_url: Optional[Any] = None,
        annotated_image_url: Optional[str] = None,
        processing_time_ms: Optional[float] = None,
        model_version: str = "v1.0",
        detection_status: str = "pending",
        failure_reason: Optional[str] = None,
        location: Optional[Location] = None,
        location_source: Optional[str] = None,
        location_confidence: Optional[float] = None,
        items: Optional[List[DetectionItem]] = None,
        created_at: Optional[datetime] = None,
        *args,
        **kwargs,
    ):
        self.id = id

        # Handle legacy positional args: Detection(id, location, image_url, ...)
        if isinstance(image_url, Location):
            self.location = image_url
            self.image_url = annotated_image_url or ""
            self.annotated_image_url = None
            if len(args) > 0:
                self.model_version = args[0]
            else:
                self.model_version = kwargs.get("model_version", model_version)
            if len(args) > 1:
                self.detection_status = args[1]
            else:
                self.detection_status = kwargs.get("detection_status", detection_status)
        else:
            self.image_url = image_url or ""
            self.annotated_image_url = annotated_image_url
            self.model_version = model_version
            self.detection_status = detection_status
            self.location = location

        self.processing_time_ms = processing_time_ms
        self.failure_reason = failure_reason
        self.location_source = location_source
        self.location_confidence = location_confidence
        self.items = items if items is not None else []
        self.created_at = created_at or datetime.now(timezone.utc)

    def __repr__(self) -> str:
        return f"Detection(id={self.id!r}, status={self.detection_status!r}, items={len(self.items)})"
