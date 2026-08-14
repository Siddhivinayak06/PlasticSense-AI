from typing import List, Optional, Tuple
from app.application.interfaces.i_detection_repository import IDetectionRepository
from app.application.interfaces.i_risk_repository import IRiskRepository
from app.domain.entities.detection import Detection
from app.domain.entities.risk_assessment import RiskAssessment

class MockDetectionRepository(IDetectionRepository):
    def __init__(self):
        self._store = {}

    def save(self, detection: Detection) -> Detection:
        self._store[detection.id] = detection
        return detection

    def update(self, detection: Detection) -> Detection:
        if detection.id in self._store:
            self._store[detection.id] = detection
        return detection

    def get_by_id(self, detection_id: str) -> Optional[Detection]:
        return self._store.get(detection_id)

    def get_all(self, skip: int = 0, limit: int = 10) -> Tuple[List[Detection], int]:
        items = list(self._store.values())
        items.sort(key=lambda d: d.created_at, reverse=True)
        return items[skip: skip + limit], len(items)

    def list_map_detections(self) -> List[Detection]:
        return [
            d for d in self._store.values()
            if d.location and d.location.latitude is not None and d.location.longitude is not None
        ]


class MockRiskRepository(IRiskRepository):
    def __init__(self):
        self._store = {}

    def save(self, assessment: RiskAssessment) -> RiskAssessment:
        self._store[assessment.id] = assessment
        return assessment

    def get_by_detection_id(self, detection_id: str) -> Optional[RiskAssessment]:
        for risk in self._store.values():
            if risk.detection_id == detection_id:
                return risk
        return None
