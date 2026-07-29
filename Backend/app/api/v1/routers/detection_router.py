import math
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from app.api.dependencies import get_detection_service
from app.api.v1.schemas.detection_schema import (
    DetectionSchema,
    PaginatedDetectionEnvelope,
    PaginationMeta,
    SingleDetectionEnvelope,
)
from app.application.dto.detection_dto import DetectionCreateDTO
from app.application.services.detection_service import DetectionService

router = APIRouter(prefix="/detections", tags=["Detections"])


@router.post(
    "",
    response_model=SingleDetectionEnvelope,
    status_code=status.HTTP_201_CREATED,
    summary="Upload image & create detection record",
)
async def create_detection(
    latitude: float = Form(..., description="Latitude coordinate (-90 to 90)"),
    longitude: float = Form(..., description="Longitude coordinate (-180 to 180)"),
    image: UploadFile = File(..., description="Plastic waste image file (JPG, PNG, WEBP)"),
    service: DetectionService = Depends(get_detection_service),
):
    try:
        file_bytes = await image.read()
        dto = DetectionCreateDTO(
            latitude=latitude,
            longitude=longitude,
            filename=image.filename or "uploaded_image.jpg",
            content_type=image.content_type or "image/jpeg",
            file_bytes=file_bytes,
        )
        result = service.create_detection(dto)
        schema_data = DetectionSchema(
            id=result.id,
            image_url=result.image_url,
            latitude=result.latitude,
            longitude=result.longitude,
            model_version=result.model_version,
            detection_status=result.detection_status,
            failure_reason=result.failure_reason,
            items=result.items,
            created_at=result.created_at,
        )
        return SingleDetectionEnvelope(data=schema_data, meta=None, error=None)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.get(
    "",
    response_model=PaginatedDetectionEnvelope,
    summary="List detections with pagination",
)
async def list_detections(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    service: DetectionService = Depends(get_detection_service),
):
    items, total = service.list_detections(page=page, limit=limit)
    total_pages = math.ceil(total / limit) if limit > 0 else 1
    meta = PaginationMeta(
        page=page,
        limit=limit,
        total_items=total,
        total_pages=total_pages,
    )
    schema_items = [
        DetectionSchema(
            id=item.id,
            image_url=item.image_url,
            latitude=item.latitude,
            longitude=item.longitude,
            model_version=item.model_version,
            detection_status=item.detection_status,
            failure_reason=item.failure_reason,
            items=item.items,
            created_at=item.created_at,
        )
        for item in items
    ]
    return PaginatedDetectionEnvelope(data=schema_items, meta=meta, error=None)


@router.get(
    "/{detection_id}",
    response_model=SingleDetectionEnvelope,
    summary="Get single detection record",
)
async def get_detection(
    detection_id: str,
    service: DetectionService = Depends(get_detection_service),
):
    item = service.get_detection(detection_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Detection '{detection_id}' not found")
    schema_data = DetectionSchema(
        id=item.id,
        image_url=item.image_url,
        latitude=item.latitude,
        longitude=item.longitude,
        model_version=item.model_version,
        detection_status=item.detection_status,
        failure_reason=item.failure_reason,
        items=item.items,
        created_at=item.created_at,
    )
    return SingleDetectionEnvelope(data=schema_data, meta=None, error=None)
