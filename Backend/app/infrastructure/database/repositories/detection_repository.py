from typing import List, Optional, Tuple
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload
from app.application.interfaces.i_detection_repository import IDetectionRepository
from app.domain.entities.detection import Detection, DetectionItem
from app.domain.entities.location import Location
from app.domain.entities.risk_assessment import RiskAssessment
from app.infrastructure.database.models.detection_model import DetectionModel, DetectionItemModel


class DetectionRepository(IDetectionRepository):
    def __init__(self, db: Session):
        self.db = db

    def _to_domain(self, model: DetectionModel) -> Detection:
        items = [
            DetectionItem(
                id=item.id,
                class_name=item.class_name,
                waste_group=item.waste_group,
                confidence=item.confidence,
                bbox_x=item.bbox_x,
                bbox_y=item.bbox_y,
                bbox_w=item.bbox_w,
                bbox_h=item.bbox_h,
                waste_type=item.waste_type,
            )
            for item in model.items
        ]
        assessment = None
        if getattr(model, "risk_assessment", None):
            ra = model.risk_assessment
            assessment = RiskAssessment(
                id=ra.id,
                detection_id=ra.detection_id,
                score=ra.score,
                level=ra.level,
                strategy_breakdown=ra.strategy_breakdown,
                computed_at=ra.computed_at,
            )

        return Detection(
            id=model.id,
            location=Location(latitude=model.latitude, longitude=model.longitude) if model.latitude is not None and model.longitude is not None else None,
            location_source=model.location_source,
            location_confidence=model.location_confidence,
            captured_at=model.captured_at,
            image_url=model.image_url,
            annotated_image_url=model.annotated_image_url,
            processing_time_ms=model.processing_time_ms,
            model_version=model.model_version,
            detection_status=model.detection_status,
            failure_reason=model.failure_reason,
            items=items,
            risk_assessment=assessment,
            created_at=model.created_at,
            user_id=model.user_id,
        )


    def save(self, detection: Detection) -> Detection:
        model = DetectionModel(
            id=detection.id,
            image_url=detection.image_url,
            annotated_image_url=detection.annotated_image_url,
            processing_time_ms=detection.processing_time_ms,
            latitude=detection.location.latitude if detection.location else None,
            longitude=detection.location.longitude if detection.location else None,
            location_source=detection.location_source,
            location_confidence=detection.location_confidence,
            captured_at=getattr(detection, 'captured_at', None),
            model_version=detection.model_version,
            detection_status=detection.detection_status,
            failure_reason=detection.failure_reason,
            created_at=detection.created_at,
            user_id=getattr(detection, 'user_id', None),
        )

        for item in detection.items:
            waste_type_val = (
                item.waste_type.value if hasattr(getattr(item, "waste_type", None), "value")
                else str(item.waste_type) if getattr(item, "waste_type", None)
                else item.class_name or "unknown"
            )
            item_model = DetectionItemModel(
                id=item.id,
                detection_id=model.id,
                class_name=item.class_name,
                waste_group=item.waste_group,
                confidence=item.confidence,
                bbox_x=item.bbox_x,
                bbox_y=item.bbox_y,
                bbox_w=item.bbox_w,
                bbox_h=item.bbox_h,
                waste_type=waste_type_val,
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
        model.annotated_image_url = detection.annotated_image_url
        model.processing_time_ms = detection.processing_time_ms
        model.items.clear()
        for item in detection.items:
            waste_type_val = (
                item.waste_type.value if hasattr(getattr(item, "waste_type", None), "value")
                else str(item.waste_type) if getattr(item, "waste_type", None)
                else item.class_name or "unknown"
            )
            model.items.append(DetectionItemModel(
                id=item.id,
                detection_id=model.id,
                class_name=item.class_name,
                waste_group=item.waste_group,
                confidence=item.confidence,
                bbox_x=item.bbox_x,
                bbox_y=item.bbox_y,
                bbox_w=item.bbox_w,
                bbox_h=item.bbox_h,
                waste_type=waste_type_val,
            ))
        self.db.commit()
        self.db.refresh(model)
        return self._to_domain(model)

    def get_by_id(self, detection_id: str) -> Optional[Detection]:
        model = (
            self.db.query(DetectionModel)
            .options(
                selectinload(DetectionModel.items),
                selectinload(DetectionModel.risk_assessment),
            )
            .filter(DetectionModel.id == detection_id)
            .first()
        )
        if not model:
            return None
        return self._to_domain(model)

    def get_all(self, skip: int = 0, limit: int = 10, user_id: Optional[str] = None) -> Tuple[List[Detection], int]:
        query = self.db.query(DetectionModel).options(
            selectinload(DetectionModel.items),
            selectinload(DetectionModel.risk_assessment),
        )
        if user_id:
            query = query.filter(DetectionModel.user_id == user_id)

        total = query.count()
        models = (
            query.order_by(DetectionModel.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        items = [self._to_domain(m) for m in models]
        return items, total

    def delete(self, detection_id: str) -> bool:
        model = self.db.query(DetectionModel).filter(DetectionModel.id == detection_id).first()
        if not model:
            return False
        self.db.delete(model)
        self.db.commit()
        return True

    def list_map_detections(self) -> List[Detection]:
        models = (
            self.db.query(DetectionModel)
            .options(
                selectinload(DetectionModel.items),
                selectinload(DetectionModel.risk_assessment),
            )
            .filter(DetectionModel.latitude.isnot(None))
            .filter(DetectionModel.longitude.isnot(None))
            .order_by(DetectionModel.created_at.desc())
            .limit(500)
            .all()
        )
        return [self._to_domain(m) for m in models]

