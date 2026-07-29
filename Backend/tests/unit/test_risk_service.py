import unittest

from app.application.services.risk_service import RiskService
from app.domain.entities.detection import Detection, DetectionItem
from app.domain.entities.location import Location
from app.domain.enums.waste_type import WasteType


class _RiskRepository:
    def save(self, assessment):
        return assessment

    def get_by_detection_id(self, detection_id):
        return None


class RiskServiceTests(unittest.TestCase):
    def test_combines_plastic_type_and_density_without_ml_or_database(self):
        detection = Detection(
            id="persisted-detection", location=Location(12.9, 77.5), image_url="/image.jpg",
            items=[
                DetectionItem("a", WasteType.MULTILAYER, 0.9, 0, 0, 10, 10),
                DetectionItem("b", WasteType.PET_BOTTLE, 0.8, 20, 20, 10, 10),
            ],
        )
        assessment = RiskService(_RiskRepository()).assess(detection)
        self.assertEqual(assessment.strategy_breakdown["plastic_type"], 50.0)
        self.assertEqual(assessment.strategy_breakdown["density"], 10.0)
        self.assertEqual(assessment.strategy_breakdown["proximity"], 0.0)
        self.assertEqual(assessment.score, 60.0)
        self.assertEqual(assessment.level, "high")
