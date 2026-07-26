from abc import ABC, abstractmethod
from typing import Optional

from app.domain.entities.risk_assessment import RiskAssessment


class IRiskRepository(ABC):
    @abstractmethod
    def save(self, assessment: RiskAssessment) -> RiskAssessment:
        """Persist a risk assessment."""

    @abstractmethod
    def get_by_detection_id(self, detection_id: str) -> Optional[RiskAssessment]:
        """Return the risk assessment for a persisted detection."""
