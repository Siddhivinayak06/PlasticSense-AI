from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, Field


class DetectionItemSchema(BaseModel):
    id: Optional[str] = None
    waste_type: str
    confidence: float
    bbox_x: float
    bbox_y: float
    bbox_w: float
    bbox_h: float


class DetectionSchema(BaseModel):
    id: str
    image_url: str
    latitude: float
    longitude: float
    model_version: str
    detection_status: str
    failure_reason: Optional[str] = None
    items: List[DetectionItemSchema] = []
    created_at: datetime


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
