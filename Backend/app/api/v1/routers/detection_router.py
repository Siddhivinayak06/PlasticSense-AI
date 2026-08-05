import math
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from app.api.dependencies import get_detection_service
from app.api.v1.schemas.detection_schema import (
    DetectionItemSchema,
    DetectionSchema,
    PaginatedDetectionEnvelope,
    PaginationMeta,
    SingleDetectionEnvelope,
)
from app.application.dto.detection_dto import DetectionCreateDTO
from app.application.services.detection_service import DetectionService
from app.core.logging import logger

router = APIRouter(prefix="/detections", tags=["Detections"])


def _to_detection_schema(dto) -> DetectionSchema:
    items_schema = [
        DetectionItemSchema(
            id=item.id,
            waste_type=item.waste_type,
            confidence=item.confidence,
            bbox_x=item.bbox_x,
            bbox_y=item.bbox_y,
            bbox_w=item.bbox_w,
            bbox_h=item.bbox_h,
        )
        for item in dto.items
    ]
    return DetectionSchema(
        id=dto.id,
        image_url=dto.image_url,
        latitude=dto.latitude,
        longitude=dto.longitude,
        model_version=dto.model_version,
        detection_status=dto.detection_status,
        failure_reason=dto.failure_reason,
        items=items_schema,
        created_at=dto.created_at,
    )


@router.post(
    "",
    response_model=SingleDetectionEnvelope,
    status_code=status.HTTP_201_CREATED,
    summary="Upload image & create detection record",
)
async def create_detection(
    latitude: float = Form(..., description="Latitude coordinate (-90 to 90)"),
    longitude: float = Form(..., description="Longitude coordinate (-180 to 180)"),
    image: Optional[UploadFile] = File(None, description="Plastic waste image file (JPG, PNG, WEBP)"),
    file: Optional[UploadFile] = File(None, description="Plastic waste image file (alias)"),
    service: DetectionService = Depends(get_detection_service),
):
    upload_file = image or file
    if not upload_file:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Image file is required")
    try:
        file_bytes = await upload_file.read()
        dto = DetectionCreateDTO(
            latitude=latitude,
            longitude=longitude,
            filename=upload_file.filename or "uploaded_image.jpg",
            content_type=upload_file.content_type or "image/jpeg",
            file_bytes=file_bytes,
        )
        result = service.create_detection(dto)
        schema_data = _to_detection_schema(result)
        return SingleDetectionEnvelope(data=schema_data, meta=None, error=None)
    except ValueError as err:
        logger.error(f"Detection creation failed: {err}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    except Exception as err:
        logger.error(f"Unexpected error in create_detection: {err}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(err))


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
    schema_items = [_to_detection_schema(item) for item in items]
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
    schema_data = _to_detection_schema(item)
    return SingleDetectionEnvelope(data=schema_data, meta=None, error=None)

