from typing import Optional

from sqlalchemy.orm import Session

from app.application.interfaces.i_risk_repository import IRiskRepository
from app.domain.entities.risk_assessment import RiskAssessment
from app.infrastructure.database.models import RiskAssessmentModel


class RiskRepository(IRiskRepository):
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _to_domain(model: RiskAssessmentModel) -> RiskAssessment:
        return RiskAssessment(
            id=model.id,
            detection_id=model.detection_id,
            score=model.score,
            level=model.level,
            strategy_breakdown=model.strategy_breakdown,
            computed_at=model.computed_at,
        )

    def save(self, assessment: RiskAssessment) -> RiskAssessment:
        model = RiskAssessmentModel(
            id=assessment.id,
            detection_id=assessment.detection_id,
            score=assessment.score,
            level=assessment.level,
            strategy_breakdown=assessment.strategy_breakdown,
            computed_at=assessment.computed_at,
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._to_domain(model)

    def get_by_detection_id(self, detection_id: str) -> Optional[RiskAssessment]:
        model = self.db.query(RiskAssessmentModel).filter(
            RiskAssessmentModel.detection_id == detection_id
        ).first()
        return self._to_domain(model) if model else None
