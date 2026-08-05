import unittest
from datetime import datetime, timezone

from app.application.services.risk_service import RiskService
from app.domain.entities.detection import Detection, DetectionItem
from app.domain.entities.location import Location
from app.domain.enums.waste_type import WasteType


class DummyRiskRepository:
    def __init__(self):
        self.saved_assessment = None

    def save(self, assessment):
        self.saved_assessment = assessment
        return assessment

    def get_by_detection_id(self, detection_id: str):
        return self.saved_assessment if self.saved_assessment and self.saved_assessment.detection_id == detection_id else None


class RiskServiceTests(unittest.TestCase):
    def setUp(self):
        self.repo = DummyRiskRepository()
        self.service = RiskService(repository=self.repo)

    def test_assess_empty_detection_returns_zero_score(self):
        detection = Detection(
            id="det-1",
            location=Location(latitude=12.97, longitude=77.59),
            image_url="/static/uploads/test.jpg",
            model_version="v1.0",
            detection_status="completed",
            items=[],
            created_at=datetime.now(timezone.utc),
        )
        assessment = self.service.assess(detection)
        self.assertEqual(assessment.score, 0.0)
        self.assertEqual(assessment.level, "low")
        self.assertEqual(self.repo.saved_assessment.id, assessment.id)

    def test_assess_high_hazard_detection(self):
        items = [
            DetectionItem(id=f"{i}", waste_type=WasteType.MULTILAYER, confidence=0.9, bbox_x=0, bbox_y=0, bbox_w=200, bbox_h=200)
            for i in range(25)
        ]
        detection = Detection(
            id="det-2",
            location=Location(latitude=28.6139, longitude=77.2090),  # Yamuna River
            image_url="/static/uploads/test2.jpg",
            model_version="v1.0",
            detection_status="completed",
            items=items,
            created_at=datetime.now(timezone.utc),
        )

        assessment = self.service.assess(detection)
        self.assertGreater(assessment.score, 0.0)
        self.assertIn(assessment.level, ["medium", "high", "critical"])

    def test_get_for_detection(self):
        detection = Detection(
            id="det-3",
            location=Location(latitude=12.97, longitude=77.59),
            image_url="/static/uploads/test3.jpg",
            model_version="v1.0",
            detection_status="completed",
            items=[],
            created_at=datetime.now(timezone.utc),
        )
        self.service.assess(detection)
        fetched = self.service.get_for_detection("det-3")
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.detection_id, "det-3")
