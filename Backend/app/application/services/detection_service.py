import os
import uuid
from typing import List, Optional, Tuple
from app.application.dto.detection_dto import DetectionCreateDTO, DetectionResponseDTO, DetectionItemDTO
from app.application.interfaces.i_detection_repository import IDetectionRepository
from app.application.interfaces.i_ml_client import IMLClient, MLClientError
from app.application.services.risk_service import RiskService
from app.core.config import settings
from app.domain.entities.detection import Detection
from app.domain.entities.location import Location
from app.application.services.geolocation_service import extract_gps_from_image
from app.infrastructure.external.storage_client import LocalStorageClient

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".jfif", ".bmp"}
ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/webp",
    "image/pjpeg", "image/x-png", "application/octet-stream"
}


class DetectionService:
    def __init__(self, repository: IDetectionRepository, ml_client: IMLClient, risk_service: RiskService, storage_client: Optional[LocalStorageClient] = None):
        self.repository = repository
        self.ml_client = ml_client
        self.risk_service = risk_service
        self.storage_client = storage_client or LocalStorageClient(upload_dir=settings.UPLOAD_DIR)
        self.result_storage_client = LocalStorageClient(upload_dir=settings.RESULTS_DIR)

    def create_detection(self, dto: DetectionCreateDTO) -> DetectionResponseDTO:
        # 1. Extract EXIF GPS
        gps_result = extract_gps_from_image(dto.file_bytes)
        
        # 2. Location Fallback Logic
        location = None
        location_source = None
        if gps_result["has_location"]:
            location = Location(latitude=gps_result["latitude"], longitude=gps_result["longitude"])
            location_source = gps_result["source"]
            location_confidence = gps_result.get("confidence", 1.0)
        elif dto.latitude is not None and dto.longitude is not None:
            location = Location(latitude=dto.latitude, longitude=dto.longitude)
            location_source = "user_provided"
            location_confidence = 0.80
        else:
            location_confidence = 0.0

        # Validate file size
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(dto.file_bytes) > max_bytes:
            raise ValueError(f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB")

        # Validate file extension & mime type
        ext = os.path.splitext(dto.filename)[1].lower() if dto.filename else ".jpg"
        content_type = (dto.content_type or "").lower()
        is_valid_ext = ext in ALLOWED_EXTENSIONS
        is_valid_mime = content_type in ALLOWED_MIME_TYPES or content_type.startswith("image/")

        if not (is_valid_ext or is_valid_mime):
            raise ValueError(f"Unsupported file type '{ext or content_type}'. Allowed types: JPG, PNG, WEBP")

        # Store image locally
        image_url = self.storage_client.save_file(dto.file_bytes, dto.filename)

        # Construct Detection domain object with detection_status = "pending"
        detection = Detection(
            id=str(uuid.uuid4()),
            location=location,
            location_source=location_source,
            location_confidence=location_confidence,
            image_url=image_url,
            model_version="v1.0",
            detection_status="pending",
            items=[],
        )

        saved = self.repository.save(detection)
        try:
            prediction = self.ml_client.predict(dto.file_bytes, dto.filename, dto.content_type)
            
            saved.model_version = prediction.model_version
            saved.items = prediction.items
            saved.processing_time_ms = prediction.processing_time_ms

            if prediction.annotated_image_bytes:
                result_filename = f"annotated_{dto.filename}"
                annotated_url = self.result_storage_client.save_file(prediction.annotated_image_bytes, result_filename)
                # Fix up the URL to point to /media/results instead of /static/uploads (assuming save_file returns hardcoded static/uploads)
                if "/static/uploads" in annotated_url:
                    annotated_url = annotated_url.replace("/static/uploads", "/media/results")
                saved.annotated_image_url = annotated_url

            saved.detection_status = "completed"
            saved = self.repository.update(saved)
            self.risk_service.assess(saved)
        except MLClientError as error:
            saved.detection_status = "failed"
            saved.failure_reason = str(error)
            saved = self.repository.update(saved)
        return self._to_dto(saved)

    def get_detection(self, detection_id: str) -> Optional[DetectionResponseDTO]:
        detection = self.repository.get_by_id(detection_id)
        if not detection:
            return None
        return self._to_dto(detection)

    def list_detections(self, page: int = 1, limit: int = 10) -> Tuple[List[DetectionResponseDTO], int]:
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 10
        skip = (page - 1) * limit
        items, total = self.repository.get_all(skip=skip, limit=limit)
        dtos = [self._to_dto(d) for d in items]
        return dtos, total

    def list_map_detections(self) -> List[DetectionResponseDTO]:
        items = self.repository.list_map_detections()
        return [self._to_dto(d) for d in items]

    def _to_dto(self, detection: Detection) -> DetectionResponseDTO:
        items_dto = [
            DetectionItemDTO(
                id=item.id,
                class_name=item.class_name,
                waste_group=item.waste_group,
                confidence=item.confidence,
                bbox_x=item.bbox_x,
                bbox_y=item.bbox_y,
                bbox_w=item.bbox_w,
                bbox_h=item.bbox_h,
            )
            for item in detection.items
        ]
        
        summary = None
        if items_dto:
            summary = {"total_objects": len(items_dto)}
            for item in items_dto:
                group = item.waste_group
                summary[group] = summary.get(group, 0) + 1
        # Fix up image_url in case it uses old /static/uploads
        img_url = detection.image_url
        if img_url and "/static/uploads" in img_url:
            img_url = img_url.replace("/static/uploads", "/media/uploads")
            
        return DetectionResponseDTO(
            id=detection.id,
            image_url=img_url,
            annotated_image_url=detection.annotated_image_url,
            latitude=detection.location.latitude if detection.location else None,
            longitude=detection.location.longitude if detection.location else None,
            location_source=detection.location_source,
            location_confidence=detection.location_confidence,
            model_version=detection.model_version,
            detection_status=detection.detection_status,
            failure_reason=detection.failure_reason,
            items=items_dto,
            created_at=detection.created_at,
            processing_time_ms=detection.processing_time_ms,
            summary=summary,
        )
