"""RiskService: Orchestrates deterministic RiskEngine assessment for detections."""

import logging
import os
import uuid
from typing import Any, Dict, Optional

from app.application.interfaces.i_risk_repository import IRiskRepository
from app.application.interfaces.i_waste_detector import DetectorPrediction
from app.application.services.feature_engine import FeatureEngine, StructuredVisualFeatures
from app.application.services.risk_engine import RiskAssessmentResult, RiskEngine
from app.domain.entities.detection import Detection
from app.domain.entities.risk_assessment import RiskAssessment

logger = logging.getLogger("WasteSense_AI")


class RiskService:
    """Evaluates environmental risk deterministically using RiskEngine & FeatureEngine."""

    def __init__(
        self,
        repository: IRiskRepository,
        risk_engine: Optional[RiskEngine] = None,
        feature_engine: Optional[FeatureEngine] = None,
    ):
        self.repository = repository
        self.risk_engine = risk_engine or RiskEngine()
        self.feature_engine = feature_engine or FeatureEngine()

    def assess(
        self,
        detection: Detection,
        features: Optional[StructuredVisualFeatures] = None,
    ) -> RiskAssessment:
        if not detection.id:
            raise ValueError("RiskService requires an already-persisted detection")

        # If structured visual features were not provided directly, synthesize from detection items
        if features is None:
            features = self._extract_features_from_detection(detection)

        assessment_result: RiskAssessmentResult = self.risk_engine.evaluate(features)

        # Strategy breakdown stored as JSONB in PostgreSQL / JSON in SQLite
        breakdown = {
            # Deterministic Risk Engine sub-component scores
            "coverage": assessment_result.component_scores["coverage"],
            "density": assessment_result.component_scores["density"],
            "composition": assessment_result.component_scores["composition"],
            "hazard": assessment_result.component_scores["hazard"],
            # Legacy backwards-compatibility keys
            "object_count": assessment_result.component_scores["density"],
            "waterbody": 0.0,
            # Structured output & rationale
            "severity": assessment_result.severity,
            "cleanup_priority": assessment_result.cleanup_priority,
            "explanation": assessment_result.explanation,
            "waste_coverage_percent": features.waste_coverage_percent,
            "material_coverage": features.material_coverage,
            "material_counts": features.material_counts,
            "material_proportions": features.material_proportions,
            "hazard_indicators": features.hazard_indicators,
            "component_weights": assessment_result.component_weights,
            "logistics": assessment_result.logistics,
            "estimated_density_label": assessment_result.estimated_density_label,
        }

        assessment = RiskAssessment(
            id=str(uuid.uuid4()),
            detection_id=detection.id,
            score=assessment_result.score,
            level=assessment_result.level,
            strategy_breakdown=breakdown,
        )

        return self.repository.save(assessment)

    def get_for_detection(self, detection_id: str) -> Optional[RiskAssessment]:
        return self.repository.get_by_detection_id(detection_id)

    def _extract_features_from_detection(self, detection: Detection) -> StructuredVisualFeatures:
        """Synthesize visual features from detection items if raw ML predictions are unavailable."""
        counts = {}
        for item in detection.items:
            counts[item.class_name] = counts.get(item.class_name, 0) + 1

        det_pred = DetectorPrediction(
            model_name="synthesized",
            items=detection.items,
            class_counts=counts,
            total_objects=len(detection.items),
        )
        return self.feature_engine.extract(detector_result=det_pred)
