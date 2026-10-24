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


# How the waste-area figure was produced, so no consumer has to guess.
COVERAGE_METHODS = {
    "segmentation_mask_union": (
        "Union of instance-segmentation masks from the TACO YOLO11s-seg model, as a "
        "percentage of image pixels."
    ),
    "bbox_mask_hybrid_union": (
        "Union of segmentation masks with detector bounding-box rectangles. Bounding "
        "boxes include background pixels inside each rectangle, so this OVERSTATES "
        "true object area while partially compensating for masks missed on dense waste."
    ),
    "detector_bbox_union": (
        "Union of detector bounding-box rectangles only (no segmentation available). "
        "Includes background pixels inside each box."
    ),
    "none": "No detector or segmenter output was available; no area could be estimated.",
}

# Shown anywhere this number is surfaced. It is an indicator, not a measurement.
COVERAGE_LABEL = "Detected Waste Index (indicative)"
COVERAGE_CAVEAT = (
    "Indicative only. This is the image area covered by model detections, NOT a "
    "validated measurement of waste extent, volume or mass. On dense aggregated "
    "dumpsites instance-based models detect only visually separable items, so this "
    "value substantially UNDERSTATES actual waste extent. It has not been validated "
    "against human-annotated ground truth."
)


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

    # 6. Provenance of the coverage figure above. Defaulted so existing callers and
    # tests that only care about the numeric features keep working.
    coverage_method: str = "unspecified"
    coverage_label: str = COVERAGE_LABEL
    coverage_caveat: str = COVERAGE_CAVEAT
    coverage_is_validated: bool = False

    def to_dict(self) -> Dict[str, Any]:
        """Convert features to JSON-serializable dictionary."""
        return {
            "waste_coverage_percent": self.waste_coverage_percent,
            "coverage_method": self.coverage_method,
            "coverage_method_description": COVERAGE_METHODS.get(self.coverage_method, "unknown"),
            "coverage_label": self.coverage_label,
            "coverage_caveat": self.coverage_caveat,
            "coverage_is_validated": self.coverage_is_validated,
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
        # 1. Waste Coverage — Hybrid approach
        # The segmenter produces pixel-precise masks (tight outlines around objects),
        # while the detector produces bounding boxes (rectangle enclosing the object).
        # Segmenter masks alone vastly undercount coverage because they tightly hug the
        # object edges. Combining both gives a realistic area-of-impact estimate.
        coverage_pct = 0.0
        coverage_method = "none"
        material_cov: Dict[str, float] = {}
        material_cnts: Dict[str, int] = {}
        segmented_count = 0

        seg_coverage_pct = 0.0
        if segmenter_result is not None:
            seg_coverage_pct = round(float(segmenter_result.waste_coverage_percent), 2)
            material_cov = {k.lower(): round(float(v), 2) for k, v in segmenter_result.material_coverage.items()}
            material_cnts = {k.lower(): int(v) for k, v in segmenter_result.material_counts.items()}
            segmented_count = int(segmenter_result.total_masks)

        # Compute detector bounding box coverage if we have image dimensions
        det_bbox_coverage_pct = 0.0
        if detector_result is not None and detector_result.items:
            # Determine image dimensions for coverage calculation
            img_h, img_w = 0, 0
            if image_shape and len(image_shape) >= 2:
                img_h, img_w = image_shape[0], image_shape[1]
            elif segmenter_result is not None and segmenter_result.combined_mask is not None:
                img_h, img_w = segmenter_result.combined_mask.shape[:2]
            else:
                # Estimate image dimensions from bounding box coordinates
                max_x = max(it.bbox_x + it.bbox_w for it in detector_result.items)
                max_y = max(it.bbox_y + it.bbox_h for it in detector_result.items)
                img_w = int(max_x * 1.05)  # small margin
                img_h = int(max_y * 1.05)

            if img_h > 0 and img_w > 0:
                total_pixels = img_h * img_w
                try:
                    import numpy as np
                    # Build union of all detector bounding boxes
                    bbox_union = np.zeros((img_h, img_w), dtype=np.uint8)
                    for item in detector_result.items:
                        x1 = max(0, int(item.bbox_x))
                        y1 = max(0, int(item.bbox_y))
                        x2 = min(img_w, int(item.bbox_x + item.bbox_w))
                        y2 = min(img_h, int(item.bbox_y + item.bbox_h))
                        if x2 > x1 and y2 > y1:
                            bbox_union[y1:y2, x1:x2] = 1

                    # If segmenter mask exists, compute hybrid union
                    if segmenter_result is not None and segmenter_result.combined_mask is not None:
                        import cv2
                        seg_mask = segmenter_result.combined_mask
                        if seg_mask.shape != (img_h, img_w):
                            seg_mask = cv2.resize(seg_mask, (img_w, img_h), interpolation=cv2.INTER_NEAREST)
                        hybrid_mask = np.bitwise_or(bbox_union, (seg_mask > 0).astype(np.uint8))
                        hybrid_pixels = int(hybrid_mask.sum())
                        coverage_pct = max(seg_coverage_pct, round((hybrid_pixels / total_pixels) * 100, 2))
                        coverage_method = "bbox_mask_hybrid_union"
                    elif segmenter_result is None:
                        det_bbox_pixels = int(bbox_union.sum())
                        det_bbox_coverage_pct = round((det_bbox_pixels / total_pixels) * 100, 2)
                        coverage_pct = det_bbox_coverage_pct
                        coverage_method = "detector_bbox_union"
                    else:
                        coverage_pct = seg_coverage_pct
                        coverage_method = "segmentation_mask_union"
                except Exception:
                    # Fall back to segmenter-only coverage on any numpy error
                    coverage_pct = seg_coverage_pct
                    coverage_method = "segmentation_mask_union"

        # If no detector items or coverage_pct still 0, fall back to segmenter-only coverage
        if coverage_pct == 0.0:
            coverage_pct = seg_coverage_pct
            coverage_method = "segmentation_mask_union" if segmenter_result is not None else "none"

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

        # If hybrid coverage expanded beyond raw segmenter coverage, scale material_cov proportionally
        if coverage_pct > seg_coverage_pct and material_props:
            material_cov = {
                mat: round((prop / 100.0) * coverage_pct, 2)
                for mat, prop in material_props.items()
            }

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
            coverage_method=coverage_method,
            coverage_label=COVERAGE_LABEL,
            coverage_caveat=COVERAGE_CAVEAT,
            coverage_is_validated=False,
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
