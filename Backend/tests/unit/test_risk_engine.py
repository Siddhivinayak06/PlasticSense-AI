"""Unit tests for Phase 4 (FeatureEngine) and Phase 5 (RiskEngine)."""

import unittest
from app.application.interfaces.i_waste_detector import DetectorPrediction
from app.application.interfaces.i_waste_segmenter import SegmenterPrediction
from app.application.services.feature_engine import FeatureEngine, StructuredVisualFeatures
from app.application.services.risk_engine import RiskEngine, RiskAssessmentResult
from app.domain.entities.detection import DetectionItem


class FeatureAndRiskEngineTests(unittest.TestCase):
    def setUp(self):
        self.feature_engine = FeatureEngine()
        self.risk_engine = RiskEngine()

    def test_boundary_empty_scene_zero_risk(self):
        """Zero waste detected must result in 0 score and LOW severity."""
        features = self.feature_engine.extract(
            detector_result=DetectorPrediction("det", [], {}, 0, None, 10),
            segmenter_result=SegmenterPrediction("seg", 0.0, {}, {}, 0, None, 10),
        )
        self.assertEqual(features.waste_coverage_percent, 0.0)
        self.assertEqual(features.total_effective_objects, 0)
        self.assertFalse(features.hazard_indicators["has_cigarette"])
        self.assertFalse(features.hazard_indicators["has_sharp_waste"])

        assessment = self.risk_engine.evaluate(features)
        self.assertEqual(assessment.score, 0.0)
        self.assertEqual(assessment.severity, "LOW")
        self.assertEqual(assessment.level, "low")
        self.assertEqual(assessment.cleanup_priority, "LOW")
        self.assertEqual(assessment.component_scores["coverage"], 0.0)
        self.assertEqual(assessment.component_scores["density"], 0.0)
        self.assertEqual(assessment.component_scores["hazard"], 0.0)

    def test_feature_extraction_from_both_models(self):
        """Test extraction correctly merges detector items and segmenter masks."""
        det_items = [
            DetectionItem("1", "plastic_bottle", "plastic", 0.85, 10, 10, 50, 50),
            DetectionItem("2", "cigarette", "hazardous", 0.75, 100, 100, 20, 20),
            DetectionItem("3", "metal_can", "metal", 0.60, 200, 200, 40, 40),
        ]
        det_pred = DetectorPrediction(
            model_name="yolo11s",
            items=det_items,
            class_counts={"plastic_bottle": 1, "cigarette": 1, "metal_can": 1},
            total_objects=3,
            processing_time_ms=50,
        )
        seg_pred = SegmenterPrediction(
            model_name="yolo11s-seg",
            waste_coverage_percent=8.5,
            material_coverage={"Plastic": 5.0, "Metal": 2.5, "Glass": 1.0},
            material_counts={"Plastic": 6, "Metal": 2, "Glass": 1},
            total_masks=9,
            processing_time_ms=60,
        )

        features = self.feature_engine.extract(det_pred, seg_pred)

        self.assertEqual(features.waste_coverage_percent, 8.5)
        self.assertEqual(features.object_count, 3)
        self.assertEqual(features.segmented_instance_count, 9)
        self.assertEqual(features.total_effective_objects, 9)
        self.assertTrue(features.hazard_indicators["has_cigarette"])
        self.assertEqual(features.hazard_indicators["cigarette_count"], 1)
        self.assertTrue(features.hazard_indicators["has_sharp_waste"])
        self.assertIn("plastic", features.material_proportions)

    def test_boundary_extreme_saturation_max_risk(self):
        """Exceeding saturation limits must clamp score cleanly to 100 and CRITICAL."""
        # 50% coverage (exceeds 30% saturation limit), 50 objects (exceeds 25 saturation limit)
        features = StructuredVisualFeatures(
            waste_coverage_percent=50.0,
            object_count=50,
            segmented_instance_count=50,
            total_effective_objects=50,
            class_counts={"plastic_bottle": 50, "cigarette": 5, "glass": 5},
            material_coverage={"plastic": 50.0},
            material_counts={"plastic": 50},
            material_proportions={"plastic": 100.0},

            hazard_indicators={
                "cigarette_count": 5,
                "has_cigarette": True,
                "glass_count": 5,
                "metal_count": 0,
                "sharp_waste_count": 5,
                "has_sharp_waste": True,
                "plastic_dominance_percent": 90.0,
                "has_high_plastic_concentration": True,
            },
            fine_grained_evidence={},
        )

        assessment = self.risk_engine.evaluate(features)
        self.assertEqual(assessment.score, 100.0)
        self.assertEqual(assessment.severity, "CRITICAL")
        self.assertEqual(assessment.level, "critical")
        self.assertEqual(assessment.cleanup_priority, "URGENT")
        self.assertEqual(assessment.component_scores["coverage"], 100.0)
        self.assertEqual(assessment.component_scores["density"], 100.0)
        self.assertEqual(assessment.component_scores["hazard"], 100.0)

    def test_moderate_field_scene(self):
        """Realistic field scene values should map to MODERATE or HIGH severity."""
        features = StructuredVisualFeatures(
            waste_coverage_percent=3.44,
            object_count=2,
            segmented_instance_count=11,
            total_effective_objects=11,
            class_counts={"paper_carton": 1, "plastic_container_cup": 1},
            material_coverage={"plastic": 1.97, "metal": 1.05, "glass": 0.25, "other": 0.16},
            material_counts={"plastic": 5, "metal": 2, "glass": 2, "other": 2},
            material_proportions={"plastic": 45.5, "metal": 18.2, "glass": 18.2, "other": 18.2},
            hazard_indicators={
                "cigarette_count": 0,
                "has_cigarette": False,
                "glass_count": 2,
                "metal_count": 2,
                "sharp_waste_count": 4,
                "has_sharp_waste": True,
                "plastic_dominance_percent": 45.5,
                "has_high_plastic_concentration": False,
            },
            fine_grained_evidence={},
        )

        assessment = self.risk_engine.evaluate(features)
        # Check coverage: 3.44 / 30 * 100 = 11.47
        # Check density: 11 / 25 * 100 = 44.0
        # Hazard: 4 sharp items * 15 = 60.0 (capped at 30) = 30.0
        # Weighted score should be around 35-45
        self.assertGreaterEqual(assessment.score, 25.0)
        self.assertLess(assessment.score, 50.0)
        self.assertEqual(assessment.severity, "MODERATE")
        self.assertEqual(assessment.level, "medium")
        self.assertEqual(assessment.cleanup_priority, "MEDIUM")

    def test_re_normalization_of_unbalanced_weights(self):
        """Engine should handle custom weights that do not sum to 1.0 gracefully."""
        engine = RiskEngine(weight_coverage=1.0, weight_density=1.0, weight_composition=1.0, weight_hazard=1.0)
        # Sum is 4.0, each weight should be re-normalized to 0.25
        self.assertAlmostEqual(engine.w_coverage, 0.25)
        self.assertAlmostEqual(engine.w_density, 0.25)
        self.assertAlmostEqual(engine.w_composition, 0.25)
        self.assertAlmostEqual(engine.w_hazard, 0.25)


if __name__ == "__main__":
    unittest.main()
