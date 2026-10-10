"""Waste Segmentation Model implementation (Model 2 — Pretrained TACO YOLO11s-seg)."""

import logging
import time
from typing import Dict, Optional

import cv2
import numpy as np
import torch
from ultralytics import YOLO

from app.application.interfaces.i_ml_client import MLClientError
from app.application.interfaces.i_waste_segmenter import (
    IWasteSegmenter,
    SegmenterPrediction,
)
from app.core.config import resolve_model_path, settings

logger = logging.getLogger("WasteSense_AI")

# Palette for material segmentation masks (BGR colors for OpenCV)
MATERIAL_COLORS = {
    "plastic": (233, 165, 14),   # Bright Sky Blue/Cyan in BGR: (B=233, G=165, R=14)
    "metal": (139, 116, 100),    # Slate Gray
    "glass": (129, 185, 16),     # Emerald Green
    "paper": (11, 158, 245),     # Amber / Gold
    "other": (168, 85, 247),     # Purple
}
DEFAULT_MASK_COLOR = (0, 0, 255)  # Red fallback


class WasteSegmenter(IWasteSegmenter):
    """Scene-level waste segmenter using TACO YOLO11s-seg."""

    def __init__(
        self,
        model_path: Optional[str] = None,
        conf_threshold: Optional[float] = None,
        iou_threshold: Optional[float] = None,
        device: Optional[str] = None,
    ):
        raw_path = model_path or settings.SEGMENTER_MODEL_PATH
        self.model_path = resolve_model_path(raw_path)
        self.conf_threshold = conf_threshold if conf_threshold is not None else settings.SEGMENTER_CONF_THRESHOLD
        self.iou_threshold = iou_threshold if iou_threshold is not None else settings.SEGMENTER_IOU_THRESHOLD
        self.image_size = settings.IMAGE_SIZE

        # Device determination
        target_device = device or settings.INFERENCE_DEVICE
        if target_device == "auto":
            self.device = "cuda:0" if torch.cuda.is_available() else "cpu"
        else:
            self.device = target_device

        try:
            logger.info(f"Loading Waste Segmenter (Model 2) from {self.model_path} on {self.device}...")
            self.model = YOLO(self.model_path)
            self.class_names = self.model.names
            logger.info(
                f"Waste Segmenter loaded successfully. Classes ({len(self.class_names)}): {list(self.class_names.values())}"
            )
        except Exception as e:
            logger.error(f"Failed to load Waste Segmenter from {self.model_path}: {e}")
            raise RuntimeError(f"Segmenter load failed: {e}")

    def predict(self, image: np.ndarray) -> SegmenterPrediction:
        """Run segmentation, mask union, and coverage calculation on an OpenCV BGR image."""
        if image is None or image.size == 0:
            raise MLClientError("Invalid image provided to WasteSegmenter")

        try:
            start_time = time.time()
            h, w = image.shape[:2]
            total_pixels = h * w
            if total_pixels == 0:
                raise MLClientError("Image dimensions cannot be zero")

            results = self.model.predict(
                source=image,
                conf=self.conf_threshold,
                iou=self.iou_threshold,
                imgsz=self.image_size,
                device=self.device,
                verbose=False,
            )
            proc_time_ms = int((time.time() - start_time) * 1000)

            # Union of all valid waste masks to prevent double-counting overlapping pixels
            combined_mask = np.zeros((h, w), dtype=np.uint8)
            material_masks: Dict[str, np.ndarray] = {}
            material_counts: Dict[str, int] = {}
            total_masks = 0

            # Overlay canvas for visualization
            overlay = image.copy()

            if len(results) > 0 and results[0].masks is not None:
                r = results[0]
                masks_data = r.masks.data.cpu().numpy()
                classes_data = r.boxes.cls.cpu().numpy().astype(int)
                confs_data = r.boxes.conf.cpu().numpy()
                total_masks = len(masks_data)

                for mask, cls_id, conf in zip(masks_data, classes_data, confs_data):
                    raw_cls_name = self.class_names.get(cls_id, f"class_{cls_id}")
                    # Standardize material name: e.g. "Plastic", "Metal", "Glass", "Paper", "Other"
                    material_name = raw_cls_name.capitalize()
                    material_counts[material_name] = material_counts.get(material_name, 0) + 1

                    # Resize predicted mask to original image dimensions using nearest-neighbor interpolation
                    mask_resized = cv2.resize(mask, (w, h), interpolation=cv2.INTER_NEAREST)
                    binary_mask = (mask_resized > 0.5).astype(np.uint8)

                    # Update global combined mask union
                    combined_mask = np.bitwise_or(combined_mask, binary_mask)

                    # Update material-specific mask union
                    if material_name not in material_masks:
                        material_masks[material_name] = np.zeros((h, w), dtype=np.uint8)
                    material_masks[material_name] = np.bitwise_or(material_masks[material_name], binary_mask)

                    # Draw colored mask on overlay
                    color = MATERIAL_COLORS.get(material_name.lower(), DEFAULT_MASK_COLOR)
                    overlay[binary_mask == 1] = color

                    # Find contours to draw crisp outlines
                    contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    cv2.drawContours(image, contours, -1, color, 2)

            # Calculate total union waste pixels and percentage
            waste_pixels = int(combined_mask.sum())
            waste_coverage_percent = round((waste_pixels / total_pixels) * 100, 2)

            # Calculate material-level coverage percentages
            material_coverage: Dict[str, float] = {}
            for mat_name, mat_mask in material_masks.items():
                mat_pixels = int(mat_mask.sum())
                material_coverage[mat_name] = round((mat_pixels / total_pixels) * 100, 2)

            # Generate alpha-blended annotated image
            alpha = 0.4
            blended = cv2.addWeighted(overlay, alpha, image, 1 - alpha, 0)

            success, encoded = cv2.imencode(".jpg", blended)
            annotated_image_bytes = encoded.tobytes() if success else None

            return SegmenterPrediction(
                model_name="taco_segmentation_yolo11s_seg",
                waste_coverage_percent=waste_coverage_percent,
                material_coverage=material_coverage,
                material_counts=material_counts,
                total_masks=total_masks,
                annotated_image_bytes=annotated_image_bytes,
                processing_time_ms=proc_time_ms,
                combined_mask=combined_mask,
            )
        except Exception as e:
            logger.error(f"Segmenter inference error: {e}", exc_info=True)
            raise MLClientError(f"Segmenter inference failed: {e}") from e
