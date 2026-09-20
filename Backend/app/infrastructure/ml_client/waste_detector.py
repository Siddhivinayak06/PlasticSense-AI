"""Waste Object Detector implementation (Model 1 — Custom PlasticSense YOLO11s)."""

import json
import logging
import time
import uuid
from typing import Dict, Optional

import cv2
import numpy as np
import torch
from ultralytics import YOLO

from app.application.interfaces.i_ml_client import MLClientError
from app.application.interfaces.i_waste_detector import (
    DetectorPrediction,
    IWasteDetector,
)
from app.core.config import resolve_model_path, settings
from app.domain.entities.detection import DetectionItem

logger = logging.getLogger("PlasticSense_AI")


class WasteDetector(IWasteDetector):
    """Fine-grained waste object detector using YOLO11s."""

    MAPPING_PATH = "app/core/waste_mapping.json"

    def __init__(
        self,
        model_path: Optional[str] = None,
        conf_threshold: Optional[float] = None,
        iou_threshold: Optional[float] = None,
        device: Optional[str] = None,
    ):
        raw_path = model_path or settings.DETECTOR_MODEL_PATH
        self.model_path = resolve_model_path(raw_path)
        self.conf_threshold = conf_threshold if conf_threshold is not None else settings.DETECTOR_CONF_THRESHOLD
        self.iou_threshold = iou_threshold if iou_threshold is not None else settings.DETECTOR_IOU_THRESHOLD
        self.image_size = settings.IMAGE_SIZE

        # Device determination
        target_device = device or settings.INFERENCE_DEVICE
        if target_device == "auto":
            self.device = "cuda:0" if torch.cuda.is_available() else "cpu"
        else:
            self.device = target_device

        # Load waste mapping
        self.waste_mapping: Dict[str, str] = {}
        try:
            resolved_mapping = resolve_model_path(self.MAPPING_PATH)
            with open(resolved_mapping, "r") as f:
                mapping_dict = json.load(f)
                for group, classes in mapping_dict.items():
                    for cls in classes:
                        self.waste_mapping[cls.lower()] = group
            logger.info("Loaded waste group mappings for detector successfully.")
        except Exception as e:
            logger.warning(f"Could not load waste mapping from {self.MAPPING_PATH}: {e}. Falling back to default.")

        # Load YOLO model
        try:
            logger.info(f"Loading Waste Detector (Model 1) from {self.model_path} on {self.device}...")
            self.model = YOLO(self.model_path)
            self.class_names = self.model.names
            logger.info(
                f"Waste Detector loaded successfully. Classes ({len(self.class_names)}): {list(self.class_names.values())}"
            )
        except Exception as e:
            logger.error(f"Failed to load Waste Detector model from {self.model_path}: {e}")
            raise RuntimeError(f"Detector load failed: {e}")

    def predict(self, image: np.ndarray) -> DetectorPrediction:
        """Run fine-grained detection on an OpenCV BGR image."""
        if image is None or image.size == 0:
            raise MLClientError("Invalid image provided to WasteDetector")

        try:
            start_time = time.time()
            results = self.model.predict(
                source=image,
                conf=self.conf_threshold,
                iou=self.iou_threshold,
                imgsz=self.image_size,
                device=self.device,
                verbose=False,
            )
            proc_time_ms = int((time.time() - start_time) * 1000)

            items = []
            class_counts: Dict[str, int] = {}
            annotated_image_bytes = None

            if len(results) > 0 and results[0].boxes is not None:
                r = results[0]
                # Generate annotated visualization
                if len(r.boxes) > 0:
                    annotated_img = r.plot(labels=True, conf=True, line_width=2)
                    success, encoded = cv2.imencode(".jpg", annotated_img)
                    if success:
                        annotated_image_bytes = encoded.tobytes()

                for box in r.boxes:
                    cls_id = int(box.cls.item())
                    conf = float(box.conf.item())
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().tolist()

                    raw_name = self.class_names.get(cls_id, f"class_{cls_id}")
                    # Map to waste group
                    waste_group = self.waste_mapping.get(raw_name.lower())
                    if not waste_group:
                        if "plastic" in raw_name.lower():
                            waste_group = "plastic"
                        elif "metal" in raw_name.lower() or "can" in raw_name.lower():
                            waste_group = "metal"
                        elif "glass" in raw_name.lower():
                            waste_group = "glass"
                        elif "paper" in raw_name.lower() or "carton" in raw_name.lower():
                            waste_group = "paper"
                        elif "cigarette" in raw_name.lower():
                            waste_group = "hazardous"
                        else:
                            waste_group = "other"

                    class_counts[raw_name] = class_counts.get(raw_name, 0) + 1

                    items.append(
                        DetectionItem(
                            id=str(uuid.uuid4()),
                            class_name=raw_name,
                            waste_group=waste_group,
                            confidence=conf,
                            bbox_x=float(x1),
                            bbox_y=float(y1),
                            bbox_w=float(x2 - x1),
                            bbox_h=float(y2 - y1),
                        )
                    )

            return DetectorPrediction(
                model_name="plasticsense_detector_yolo11s",
                items=items,
                class_counts=class_counts,
                total_objects=len(items),
                annotated_image_bytes=annotated_image_bytes,
                processing_time_ms=proc_time_ms,
            )
        except Exception as e:
            logger.error(f"Detector inference error: {e}", exc_info=True)
            raise MLClientError(f"Detector inference failed: {e}") from e
