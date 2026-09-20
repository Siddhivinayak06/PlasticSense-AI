"""Deterministic Risk Engine for PlasticSense AI.

Combines structured visual features (waste coverage, density, material composition, hazards)
into a transparent, deterministic engineering decision-support score (0-100), severity level,
and cleanup priority.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, Optional
import logging

from app.application.services.feature_engine import StructuredVisualFeatures
from app.core.config import settings

logger = logging.getLogger("PlasticSense_AI")


@dataclass(frozen=True)
class RiskAssessmentResult:
    """Standardized output of the deterministic Risk Engine."""
    score: float                         # 0.0 to 100.0
    severity: str                        # "LOW", "MODERATE", "HIGH", "CRITICAL"
    level: str                           # "low", "medium", "high", "critical" (compatibility)
    cleanup_priority: str                # "LOW", "MEDIUM", "HIGH", "URGENT"
    component_scores: Dict[str, float]   # Sub-component scores (0-100 each)
    component_weights: Dict[str, float]  # Configured weights
    explanation: str                     # Human-readable rationale

    def to_dict(self) -> Dict[str, Any]:
        """Convert assessment result to JSON-serializable dict."""
        return {
            "score": self.score,
            "severity": self.severity,
            "level": self.level,
            "cleanup_priority": self.cleanup_priority,
            "component_scores": self.component_scores,
            "component_weights": self.component_weights,
            "explanation": self.explanation,
        }


class RiskEngine:
    """Deterministic engineering decision-support engine.

    Calculates environmental risk score from 4 measurable components:
    1. Coverage Component (from Model 2 mask union)
    2. Density Component (from Model 1 & 2 instance counts)
    3. Composition Component (material persistence weights)
    4. Hazard Component (cigarettes, sharp metal/glass, high plastic concentration)
    """

    DEFAULT_MATERIAL_PERSISTENCE = {
        "plastic": 1.00,  # Non-biodegradable, high persistence
        "other": 0.80,    # Synthetic/hazardous unknown
        "metal": 0.70,    # Persistent, physical hazard
        "glass": 0.60,    # Indefinite persistence, physical hazard
        "paper": 0.30,    # Biodegradable, lower environmental persistence
    }

    def __init__(
        self,
        weight_coverage: Optional[float] = None,
        weight_density: Optional[float] = None,
        weight_composition: Optional[float] = None,
        weight_hazard: Optional[float] = None,
        coverage_saturation: Optional[float] = None,
        density_saturation: Optional[int] = None,
        material_weights: Optional[Dict[str, float]] = None,
    ):
        self.w_coverage = weight_coverage if weight_coverage is not None else settings.RISK_WEIGHT_COVERAGE
        self.w_density = weight_density if weight_density is not None else settings.RISK_WEIGHT_DENSITY
        self.w_composition = weight_composition if weight_composition is not None else settings.RISK_WEIGHT_COMPOSITION
        self.w_hazard = weight_hazard if weight_hazard is not None else settings.RISK_WEIGHT_HAZARD

        self.coverage_sat = coverage_saturation if coverage_saturation is not None else settings.RISK_COVERAGE_SATURATION_PCT
        self.density_sat = density_saturation if density_saturation is not None else settings.RISK_DENSITY_SATURATION_COUNT
        self.material_weights = material_weights or self.DEFAULT_MATERIAL_PERSISTENCE

        # Ensure weights normalize to 1.0
        total_weight = self.w_coverage + self.w_density + self.w_composition + self.w_hazard
        if abs(total_weight - 1.0) > 1e-4:
            logger.warning(f"Risk weights sum to {total_weight}, re-normalizing to 1.0")
            self.w_coverage /= total_weight
            self.w_density /= total_weight
            self.w_composition /= total_weight
            self.w_hazard /= total_weight

    def evaluate(self, features: StructuredVisualFeatures) -> RiskAssessmentResult:
        """Compute transparent, deterministic risk score from visual features."""
        # 1. Coverage Component (0-100)
        # S_coverage = min(100.0, (coverage_pct / coverage_sat) * 100.0)
        if self.coverage_sat > 0:
            coverage_score = min(100.0, (features.waste_coverage_percent / self.coverage_sat) * 100.0)
        else:
            coverage_score = 0.0
        coverage_score = round(max(0.0, coverage_score), 2)

        # 2. Density Component (0-100)
        # S_density = min(100.0, (total_objects / density_sat) * 100.0)
        if self.density_sat > 0:
            density_score = min(100.0, (features.total_effective_objects / self.density_sat) * 100.0)
        else:
            density_score = 0.0
        density_score = round(max(0.0, density_score), 2)

        # 3. Composition Component (0-100)
        # Weighted sum of material proportions * material persistence
        comp_raw = 0.0
        if features.material_proportions and features.total_effective_objects > 0:
            for mat, prop in features.material_proportions.items():
                w_mat = self.material_weights.get(mat.lower(), 0.50)
                comp_raw += (prop / 100.0) * w_mat * 100.0
            composition_score = min(100.0, comp_raw)
        else:
            composition_score = 0.0
        composition_score = round(max(0.0, composition_score), 2)

        # 4. Hazard Component (0-100)
        # Evaluates acute hazards strictly from real model classes
        haz_raw = 0.0
        haz_ind = features.hazard_indicators

        # Cigarette butts: toxic chemical leachate (+30 pts per butt, max 60)
        cig_count = haz_ind.get("cigarette_count", 0)
        if cig_count > 0:
            haz_raw += min(60.0, cig_count * 30.0)

        # Sharp waste (glass + metal): physical hazard (+15 pts per item, max 30)
        sharp_count = haz_ind.get("sharp_waste_count", 0)
        if sharp_count > 0:
            haz_raw += min(30.0, sharp_count * 15.0)

        # High plastic concentration: >= 70% plastic (+20 pts)
        if haz_ind.get("plastic_dominance_percent", 0.0) >= 70.0 and features.total_effective_objects >= 3:
            haz_raw += 20.0

        # If zero items are detected, hazard is strictly 0.0
        if features.total_effective_objects == 0 and features.waste_coverage_percent == 0:
            haz_raw = 0.0

        hazard_score = round(min(100.0, max(0.0, haz_raw)), 2)

        # 5. Composite Final Score
        raw_final = (
            self.w_coverage * coverage_score
            + self.w_density * density_score
            + self.w_composition * composition_score
            + self.w_hazard * hazard_score
        )
        final_score = round(min(100.0, max(0.0, raw_final)), 1)

        # 6. Severity & Priority Mapping
        # Read thresholds from settings
        th_mod = settings.RISK_THRESHOLD_MODERATE
        th_high = settings.RISK_THRESHOLD_HIGH
        th_crit = settings.RISK_THRESHOLD_CRITICAL

        if final_score >= th_crit:
            severity = "CRITICAL"
            level = "critical"
            cleanup_priority = "URGENT"
        elif final_score >= th_high:
            severity = "HIGH"
            level = "high"
            cleanup_priority = "HIGH"
        elif final_score >= th_mod:
            severity = "MODERATE"
            level = "medium"
            cleanup_priority = "MEDIUM"
        else:
            severity = "LOW"
            level = "low"
            cleanup_priority = "LOW"

        # 7. Human-readable Rationale
        reasons = []
        if features.total_effective_objects == 0 and features.waste_coverage_percent == 0:
            reasons.append("No waste objects or segmentation masks detected.")
        else:
            reasons.append(f"{features.waste_coverage_percent}% waste coverage")
            reasons.append(f"{features.total_effective_objects} waste objects")
            if features.material_proportions:
                top_mat = max(features.material_proportions.items(), key=lambda x: x[1])
                reasons.append(f"predominantly {top_mat[0]} ({top_mat[1]}%)")
            if cig_count > 0:
                reasons.append(f"{cig_count} cigarette butt(s) identified")
            if sharp_count > 0:
                reasons.append(f"{sharp_count} sharp waste item(s) (glass/metal)")

        explanation = f"{severity} severity ({final_score}/100) — " + "; ".join(reasons) + "."

        component_scores = {
            "coverage": coverage_score,
            "density": density_score,
            "composition": composition_score,
            "hazard": hazard_score,
        }

        component_weights = {
            "weight_coverage": round(self.w_coverage, 2),
            "weight_density": round(self.w_density, 2),
            "weight_composition": round(self.w_composition, 2),
            "weight_hazard": round(self.w_hazard, 2),
        }

        return RiskAssessmentResult(
            score=final_score,
            severity=severity,
            level=level,
            cleanup_priority=cleanup_priority,
            component_scores=component_scores,
            component_weights=component_weights,
            explanation=explanation,
        )
