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
    BatchDetectResponseSchema,
    MapDetectionEnvelope
)
from app.application.dto.detection_dto import DetectionCreateDTO
from app.application.services.detection_service import DetectionService
from app.core.logging import logger

router = APIRouter(prefix="/detections", tags=["Detections"])


def _to_detection_schema(dto) -> DetectionSchema:
    items_schema = [
        DetectionItemSchema(
            id=item.id,
            class_name=item.class_name,
            waste_group=item.waste_group,
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
        annotated_image_url=dto.annotated_image_url,
        latitude=dto.latitude,
        longitude=dto.longitude,
        location_source=dto.location_source,
        location_confidence=dto.location_confidence,
        model_version=dto.model_version,
        detection_status=dto.detection_status,
        failure_reason=dto.failure_reason,
        items=items_schema,
        created_at=dto.created_at,
        processing_time_ms=dto.processing_time_ms,
        summary=dto.summary,
        segmentation=dto.segmentation,
        features=dto.features,
        risk=dto.risk,
    )


@router.post(
    "/detect",
    response_model=DetectionSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Upload image & run dual-model waste detection/segmentation/risk analysis",
)
@router.post(
    "/analyze",
    response_model=DetectionSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Upload image & run comprehensive waste analysis (alias for /detect)",
)
async def create_detection(
    latitude: Optional[float] = Form(None, description="Latitude coordinate (-90 to 90)"),
    longitude: Optional[float] = Form(None, description="Longitude coordinate (-180 to 180)"),
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
        return _to_detection_schema(result)
    except ValueError as err:
        logger.error(f"Detection creation failed: {err}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    except Exception as err:
        logger.error(f"Unexpected error in create_detection: {err}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(err))


@router.post(
    "/detect/batch",
    response_model=BatchDetectResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Upload multiple images",
)
async def create_batch_detection(
    latitude: Optional[float] = Form(None, description="Latitude coordinate"),
    longitude: Optional[float] = Form(None, description="Longitude coordinate"),
    files: list[UploadFile] = File(..., description="List of images"),
    service: DetectionService = Depends(get_detection_service),
):
    results = []
    for upload_file in files:
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
            results.append(_to_detection_schema(result))
        except Exception as e:
            logger.error(f"Failed to process {upload_file.filename} in batch: {e}")
            continue

    return BatchDetectResponseSchema(results=results)


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


from collections import defaultdict
from pydantic import BaseModel


class HotspotItemSchema(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    radius: float
    report_count: int
    total_waste_objects: int
    avg_risk_score: float
    max_risk_score: float
    severity: str
    priority: str
    dominant_materials: list[str]
    most_common_material: str
    status: str
    last_updated: str
    detection_ids: list[str]


class HotspotsEnvelope(BaseModel):
    hotspots: list[HotspotItemSchema]
    total_hotspots: int


@router.get(
    "/map",
    response_model=MapDetectionEnvelope,
    summary="Get detections with valid coordinates for map visualization",
)
async def get_map_detections(
    service: DetectionService = Depends(get_detection_service),
):
    items = service.list_map_detections()
    schema_items = [_to_detection_schema(item) for item in items]
    return MapDetectionEnvelope(detections=schema_items)


@router.get(
    "/hotspots",
    response_model=HotspotsEnvelope,
    summary="Get dynamically clustered pollution hotspots from real detections",
)
async def get_hotspots(
    service: DetectionService = Depends(get_detection_service),
):
    items = service.list_map_detections()
    if not items:
        return HotspotsEnvelope(hotspots=[], total_hotspots=0)

    # Spatial clustering (group within ~0.025 degrees ≈ 2.5 km)
    clusters = []
    for item in items:
        if item.latitude is None or item.longitude is None:
            continue
        lat, lng = item.latitude, item.longitude
        placed = False
        for cl in clusters:
            cl_lat = sum(d.latitude for d in cl) / len(cl)
            cl_lng = sum(d.longitude for d in cl) / len(cl)
            dist = math.hypot(lat - cl_lat, lng - cl_lng)
            if dist <= 0.025:
                cl.append(item)
                placed = True
                break
        if not placed:
            clusters.append([item])

    hotspot_list = []
    for idx, cl in enumerate(clusters):
        c_lat = sum(d.latitude for d in cl) / len(cl)
        c_lng = sum(d.longitude for d in cl) / len(cl)
        waste_objects = sum(len(d.items) for d in cl)


        # Risk scores
        risk_scores = []
        for d in cl:
            score = None
            if isinstance(d.risk, dict):
                score = d.risk.get("score")
            elif hasattr(d.risk, "score"):
                score = d.risk.score
            if score is not None:
                try:
                    risk_scores.append(float(score))
                except (ValueError, TypeError):
                    pass
        avg_score = round(sum(risk_scores) / len(risk_scores), 1) if risk_scores else 50.0
        max_score = round(max(risk_scores), 1) if risk_scores else 50.0


        if max_score >= 75:
            severity = "critical"
            priority = "urgent"
        elif max_score >= 50:
            severity = "high"
            priority = "high"
        elif max_score >= 25:
            severity = "medium"
            priority = "medium"
        else:
            severity = "low"
            priority = "low"

        # Materials
        mat_counts = defaultdict(int)
        for d in cl:
            for it in d.items:
                if it.waste_group:
                    mat_counts[it.waste_group.lower()] += 1
        sorted_mats = sorted(mat_counts.items(), key=lambda x: x[1], reverse=True)
        dominant_mats = [m[0].title() for m in sorted_mats[:3]] or ["Plastic"]
        most_common = dominant_mats[0]

        latest_dt = max(d.created_at for d in cl)
        radius = min(1000.0, max(250.0, float(len(cl)) * 120.0))

        hotspot_list.append(HotspotItemSchema(
            id=f"HS-2026-{idx+1:02d}",
            name=f"Zone Lat {c_lat:.3f}, Lng {c_lng:.3f}",
            latitude=round(c_lat, 6),
            longitude=round(c_lng, 6),
            radius=radius,
            report_count=len(cl),
            total_waste_objects=waste_objects,
            avg_risk_score=avg_score,
            max_risk_score=max_score,
            severity=severity,
            priority=priority,
            dominant_materials=dominant_mats,
            most_common_material=most_common,
            status="pending",
            last_updated=latest_dt.isoformat() if hasattr(latest_dt, "isoformat") else str(latest_dt),
            detection_ids=[d.id for d in cl],
        ))

    hotspot_list.sort(key=lambda h: h.max_risk_score, reverse=True)
    return HotspotsEnvelope(hotspots=hotspot_list, total_hotspots=len(hotspot_list))


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
