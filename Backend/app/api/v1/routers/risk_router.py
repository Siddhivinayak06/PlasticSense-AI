from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_risk_service
from app.api.v1.schemas.risk_schema import RiskAssessmentSchema, SingleRiskEnvelope
from app.application.services.risk_service import RiskService

router = APIRouter(prefix="/risk", tags=["Risk"])


@router.get("/{detection_id}", response_model=SingleRiskEnvelope)
def get_risk_assessment(detection_id: str, service: RiskService = Depends(get_risk_service)):
    assessment = service.get_for_detection(detection_id)
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Risk assessment for detection '{detection_id}' not found")
    return SingleRiskEnvelope(data=RiskAssessmentSchema(
        id=assessment.id, detection_id=assessment.detection_id, score=assessment.score,
        level=assessment.level, strategy_breakdown=assessment.strategy_breakdown,
        computed_at=assessment.computed_at,
    ), meta=None, error=None)
