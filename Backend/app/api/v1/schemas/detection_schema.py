from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class DetectionItemSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[str] = None
    class_name: str
    waste_group: str
    confidence: float
    bbox_x: float
    bbox_y: float
    bbox_w: float
    bbox_h: float


class DetectionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    image_url: str
    annotated_image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_source: Optional[str] = None
    location_confidence: Optional[float] = None
    model_version: str
    detection_status: str
    failure_reason: Optional[str] = None
    items: List[DetectionItemSchema] = []
    created_at: datetime
    processing_time_ms: Optional[int] = None
    summary: Optional[dict] = None

class BatchDetectResponseSchema(BaseModel):
    results: List[DetectionSchema]
class PaginationMeta(BaseModel):
    page: int
    limit: int
    total_items: int
    total_pages: int


class EnvelopeResponse(BaseModel):
    data: Optional[Any] = None
    meta: Optional[Any] = None
    error: Optional[Any] = None


class SingleDetectionEnvelope(EnvelopeResponse):
    data: Optional[DetectionSchema] = None


class PaginatedDetectionEnvelope(EnvelopeResponse):
    data: Optional[List[DetectionSchema]] = None
    meta: Optional[PaginationMeta] = None

class MapDetectionEnvelope(BaseModel):
    detections: List[DetectionSchema]

