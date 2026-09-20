from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel

from app.api.v1.schemas.detection_schema import EnvelopeResponse


class RiskAssessmentSchema(BaseModel):
    id: str
    detection_id: str
    score: float
    level: str
    severity: Optional[str] = None
    cleanup_priority: Optional[str] = None
    explanation: Optional[str] = None
    strategy_breakdown: Dict[str, Any]
    computed_at: datetime



class SingleRiskEnvelope(EnvelopeResponse):
    data: Optional[RiskAssessmentSchema] = None
