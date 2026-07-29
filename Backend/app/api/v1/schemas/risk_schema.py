from datetime import datetime
from typing import Dict, Optional

from pydantic import BaseModel

from app.api.v1.schemas.detection_schema import EnvelopeResponse


class RiskAssessmentSchema(BaseModel):
    id: str
    detection_id: str
    score: float
    level: str
    strategy_breakdown: Dict[str, float]
    computed_at: datetime


class SingleRiskEnvelope(EnvelopeResponse):
    data: Optional[RiskAssessmentSchema] = None
