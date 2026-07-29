import uuid
from abc import ABC, abstractmethod
from typing import Iterable

from app.application.interfaces.i_risk_repository import IRiskRepository
from app.domain.entities.detection import Detection
from app.domain.entities.risk_assessment import RiskAssessment
from app.domain.enums.waste_type import WasteType


class RiskStrategy(ABC):
    name: str

    @abstractmethod
    def score(self, detection: Detection) -> float:
        """Return a bounded contribution to a detection's risk score."""


class PlasticTypeRiskStrategy(RiskStrategy):
    name = "plastic_type"
    _weights = {
        WasteType.PET_BOTTLE: 10.0, WasteType.PLASTIC_BAG: 20.0,
        WasteType.FOOD_WRAPPER: 25.0, WasteType.STYROFOAM: 35.0,
        WasteType.MULTILAYER: 40.0, WasteType.OTHER: 15.0,
    }

    def score(self, detection: Detection) -> float:
        return min(60.0, sum(self._weights.get(item.waste_type, 15.0) for item in detection.items))


class DensityRiskStrategy(RiskStrategy):
    name = "density"

    def score(self, detection: Detection) -> float:
        return min(40.0, len(detection.items) * 5.0)


class ProximityRiskStrategy(RiskStrategy):
    name = "proximity"

    def score(self, detection: Detection) -> float:
        return 0.0


class RiskService:
    def __init__(self, repository: IRiskRepository, strategies: Iterable[RiskStrategy] | None = None):
        self.repository = repository
        self.strategies = list(strategies or [
            PlasticTypeRiskStrategy(), DensityRiskStrategy(), ProximityRiskStrategy(),
        ])

    def assess(self, detection: Detection) -> RiskAssessment:
        if not detection.id:
            raise ValueError("RiskService requires an already-persisted detection")
        breakdown = {strategy.name: strategy.score(detection) for strategy in self.strategies}
        score = min(100.0, sum(breakdown.values()))
        level = "low" if score < 25 else "medium" if score < 50 else "high" if score < 75 else "critical"
        return self.repository.save(RiskAssessment(
            id=str(uuid.uuid4()), detection_id=detection.id, score=score,
            level=level, strategy_breakdown=breakdown,
        ))

    def get_for_detection(self, detection_id: str):
        return self.repository.get_by_detection_id(detection_id)
