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
from app.infrastructure.external.storage_client import LocalStorageClient

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


class DetectionService:
    def __init__(self, repository: IDetectionRepository, ml_client: IMLClient, risk_service: RiskService, storage_client: Optional[LocalStorageClient] = None):
        self.repository = repository
        self.ml_client = ml_client
        self.risk_service = risk_service
        self.storage_client = storage_client or LocalStorageClient()

    def create_detection(self, dto: DetectionCreateDTO) -> DetectionResponseDTO:
        # Validate coordinates
        location = Location(latitude=dto.latitude, longitude=dto.longitude)

        # Validate file size
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(dto.file_bytes) > max_bytes:
            raise ValueError(f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB")

        # Validate file extension & mime type
        ext = os.path.splitext(dto.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS or dto.content_type not in ALLOWED_MIME_TYPES:
            raise ValueError(f"Unsupported file type '{ext or dto.content_type}'. Allowed types: JPG, PNG, WEBP")

        # Store image locally
        image_url = self.storage_client.save_file(dto.file_bytes, dto.filename)

        # Construct Detection domain object with detection_status = "pending"
        detection = Detection(
            id=str(uuid.uuid4()),
            location=location,
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

    def _to_dto(self, detection: Detection) -> DetectionResponseDTO:
        items_dto = [
            DetectionItemDTO(
                id=item.id,
                waste_type=item.waste_type.value if hasattr(item.waste_type, "value") else str(item.waste_type),
                confidence=item.confidence,
                bbox_x=item.bbox_x,
                bbox_y=item.bbox_y,
                bbox_w=item.bbox_w,
                bbox_h=item.bbox_h,
            )
            for item in detection.items
        ]
        return DetectionResponseDTO(
            id=detection.id,
            image_url=detection.image_url,
            latitude=detection.location.latitude,
            longitude=detection.location.longitude,
            model_version=detection.model_version,
            detection_status=detection.detection_status,
            failure_reason=detection.failure_reason,
            items=items_dto,
            created_at=detection.created_at,
        )
