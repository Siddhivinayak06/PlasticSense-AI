from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.application.interfaces.i_detection_repository import IDetectionRepository
from app.domain.entities.detection import Detection, DetectionItem
from app.domain.entities.location import Location
from app.domain.enums.waste_type import WasteType
from app.infrastructure.database.models.detection_model import DetectionModel, DetectionItemModel


class DetectionRepository(IDetectionRepository):
    def __init__(self, db: Session):
        self.db = db

    def _to_domain(self, model: DetectionModel) -> Detection:
        items = [
            DetectionItem(
                id=item.id,
                waste_type=WasteType(item.waste_type) if item.waste_type in WasteType._value2member_map_ else WasteType.OTHER,
                confidence=item.confidence,
                bbox_x=item.bbox_x,
                bbox_y=item.bbox_y,
                bbox_w=item.bbox_w,
                bbox_h=item.bbox_h,
            )
            for item in model.items
        ]
        return Detection(
            id=model.id,
            location=Location(latitude=model.latitude, longitude=model.longitude),
            image_url=model.image_url,
            model_version=model.model_version,
            detection_status=model.detection_status,
            failure_reason=model.failure_reason,
            items=items,
            created_at=model.created_at,
        )

    def save(self, detection: Detection) -> Detection:
        model = DetectionModel(
            id=detection.id,
            image_url=detection.image_url,
            latitude=detection.location.latitude,
            longitude=detection.location.longitude,
            model_version=detection.model_version,
            detection_status=detection.detection_status,
            failure_reason=detection.failure_reason,
            created_at=detection.created_at,
        )
        
        for item in detection.items:
            item_model = DetectionItemModel(
                id=item.id,
                detection_id=model.id,
                waste_type=item.waste_type.value if isinstance(item.waste_type, WasteType) else str(item.waste_type),
                confidence=item.confidence,
                bbox_x=item.bbox_x,
                bbox_y=item.bbox_y,
                bbox_w=item.bbox_w,
                bbox_h=item.bbox_h,
            )
            model.items.append(item_model)

        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._to_domain(model)

    def update(self, detection: Detection) -> Detection:
        model = self.db.query(DetectionModel).filter(DetectionModel.id == detection.id).first()
        if not model:
            raise ValueError(f"Detection '{detection.id}' not found")

        model.model_version = detection.model_version
        model.detection_status = detection.detection_status
        model.failure_reason = detection.failure_reason
        model.items.clear()
        for item in detection.items:
            model.items.append(DetectionItemModel(
                id=item.id,
                detection_id=model.id,
                waste_type=item.waste_type.value if isinstance(item.waste_type, WasteType) else str(item.waste_type),
                confidence=item.confidence,
                bbox_x=item.bbox_x,
                bbox_y=item.bbox_y,
                bbox_w=item.bbox_w,
                bbox_h=item.bbox_h,
            ))
        self.db.commit()
        self.db.refresh(model)
        return self._to_domain(model)

    def get_by_id(self, detection_id: str) -> Optional[Detection]:
        model = self.db.query(DetectionModel).filter(DetectionModel.id == detection_id).first()
        if not model:
            return None
        return self._to_domain(model)

    def get_all(self, skip: int = 0, limit: int = 10) -> Tuple[List[Detection], int]:
        total = self.db.query(DetectionModel).count()
        models = (
            self.db.query(DetectionModel)
            .order_by(DetectionModel.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        items = [self._to_domain(m) for m in models]
        return items, total
