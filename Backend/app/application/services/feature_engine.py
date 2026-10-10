"""Feature Engine: Combines raw ML outputs into structured, transparent visual features.

Independent of raw YOLO objects, allowing underlying ML models to be swapped or retrained
without modifying downstream decision engines.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import logging

from app.application.interfaces.i_waste_detector import DetectorPrediction
from app.application.interfaces.i_waste_segmenter import SegmenterPrediction

logger = logging.getLogger("WasteSense_AI")


@dataclass(frozen=True)
class StructuredVisualFeatures:
    """Clean internal visual feature representation independent of raw ML objects."""
    # 1. Coverage
    waste_coverage_percent: float

    # 2. Counts & Density
    object_count: int                        # Fine-grained objects from Model 1
    segmented_instance_count: int            # Segmented masks from Model 2
    total_effective_objects: int             # Reconciled total waste items
    class_counts: Dict[str, int]             # Fine-grained class counts (e.g. plastic_bottle: 3)

    # 3. Material Composition & Coverage
    material_coverage: Dict[str, float]      # % of image area covered per material
    material_counts: Dict[str, int]          # Segmented counts per material category
    material_proportions: Dict[str, float]   # % share of waste composed of each material

    # 4. Hazard Indicators (Derived strictly from verified model classes)
    hazard_indicators: Dict[str, Any]

    # 5. Fine-Grained Object Evidence
    fine_grained_evidence: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        """Convert features to JSON-serializable dictionary."""
        return {
            "waste_coverage_percent": self.waste_coverage_percent,
            "object_count": self.object_count,
            "segmented_instance_count": self.segmented_instance_count,
            "total_effective_objects": self.total_effective_objects,
            "class_counts": self.class_counts,
            "material_coverage": self.material_coverage,
            "material_counts": self.material_counts,
            "material_proportions": self.material_proportions,
            "hazard_indicators": self.hazard_indicators,
            "fine_grained_evidence": self.fine_grained_evidence,
        }


class FeatureEngine:
    """Extracts structured visual features from detector and segmenter outputs."""

    # Fine-grained class mapping to hazard categories
    HAZARD_GLASS_CLASSES = {"glass", "glass_bottle", "broken_glass"}
    HAZARD_METAL_CLASSES = {"metal_can", "can", "chemical_spray_can"}
    HAZARD_CIGARETTE_CLASSES = {"cigarette"}

    def extract(
        self,
        detector_result: Optional[DetectorPrediction] = None,
        segmenter_result: Optional[SegmenterPrediction] = None,
        image_shape: Optional[tuple] = None,
    ) -> StructuredVisualFeatures:
        """Extract unified visual features from detector and segmenter predictions."""
        # 1. Waste Coverage from Model 2 (TACO Segmenter)
        coverage_pct = 0.0
        material_cov: Dict[str, float] = {}
        material_cnts: Dict[str, int] = {}
        segmented_count = 0

        if segmenter_result is not None:
            coverage_pct = round(float(segmenter_result.waste_coverage_percent), 2)
            material_cov = {k.lower(): round(float(v), 2) for k, v in segmenter_result.material_coverage.items()}
            material_cnts = {k.lower(): int(v) for k, v in segmenter_result.material_counts.items()}
            segmented_count = int(segmenter_result.total_masks)

        # 2. Fine-grained detections from Model 1 (WasteSense Detector)
        obj_count = 0
        cls_counts: Dict[str, int] = {}
        high_conf_count = 0
        low_conf_count = 0

        if detector_result is not None:
            obj_count = int(detector_result.total_objects)
            cls_counts = {k: int(v) for k, v in detector_result.class_counts.items()}
            for item in detector_result.items:
                if item.confidence >= 0.20:
                    high_conf_count += 1
                else:
                    low_conf_count += 1

        # 3. Total Effective Waste Items
        total_effective = max(obj_count, segmented_count)

        # 4. Material Proportions (based on segmenter counts or fallback to detector groups)
        total_mat_instances = sum(material_cnts.values())
        material_props: Dict[str, float] = {}
        if total_mat_instances > 0:
            for mat, count in material_cnts.items():
                material_props[mat] = round((count / total_mat_instances) * 100.0, 1)
        elif obj_count > 0 and detector_result is not None:
            # Fallback estimation from detector items' waste groups
            group_counts: Dict[str, int] = {}
            for item in detector_result.items:
                grp = (item.waste_group or "other").lower()
                group_counts[grp] = group_counts.get(grp, 0) + 1
            for grp, cnt in group_counts.items():
                material_props[grp] = round((cnt / obj_count) * 100.0, 1)

        # 5. Extract Hazard Indicators (Strictly from real model classes)
        # Cigarette count
        cig_count = sum(cls_counts.get(c, 0) for c in self.HAZARD_CIGARETTE_CLASSES)
        # Glass count (from detector classes + segmenter glass count)
        glass_det = sum(cls_counts.get(c, 0) for c in self.HAZARD_GLASS_CLASSES)
        glass_seg = material_cnts.get("glass", 0)
        glass_count = max(glass_det, glass_seg)

        # Metal count
        metal_det = sum(cls_counts.get(c, 0) for c in self.HAZARD_METAL_CLASSES)
        metal_seg = material_cnts.get("metal", 0)
        metal_count = max(metal_det, metal_seg)

        # Sharp waste count (glass + metal)
        sharp_count = glass_count + metal_count

        # Plastic dominance
        plastic_share = material_props.get("plastic", 0.0)
        has_high_plastic = plastic_share >= 60.0

        hazard_indicators = {
            "cigarette_count": cig_count,
            "has_cigarette": cig_count > 0,
            "glass_count": glass_count,
            "metal_count": metal_count,
            "sharp_waste_count": sharp_count,
            "has_sharp_waste": sharp_count > 0,
            "plastic_dominance_percent": plastic_share,
            "has_high_plastic_concentration": has_high_plastic,
        }

        # 6. Fine-grained evidence structure
        fine_grained_evidence = {
            "detector_available": detector_result is not None,
            "high_confidence_objects": high_conf_count,
            "low_confidence_objects": low_conf_count,
            "detected_classes": list(cls_counts.keys()),
        }

        return StructuredVisualFeatures(
            waste_coverage_percent=coverage_pct,
            object_count=obj_count,
            segmented_instance_count=segmented_count,
            total_effective_objects=total_effective,
            class_counts=cls_counts,
            material_coverage=material_cov,
            material_counts=material_cnts,
            material_proportions=material_props,
            hazard_indicators=hazard_indicators,
            fine_grained_evidence=fine_grained_evidence,
        )
