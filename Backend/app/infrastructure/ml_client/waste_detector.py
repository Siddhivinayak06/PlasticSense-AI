"""Waste Object Detector implementation (Model 1 — Custom WasteSense YOLO11s)."""

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
from app.core.config import resolve_inference_device, resolve_model_path, settings
from app.domain.entities.detection import DetectionItem
from app.infrastructure.ml_client.plastic_classifier import PlasticClassifier

logger = logging.getLogger("WasteSense_AI")


class WasteDetector(IWasteDetector):
    """Fine-grained waste object detector using YOLO11s."""

    MAPPING_PATH = "app/core/waste_mapping.json"

    @staticmethod
    def _parse_class_names(names) -> Dict[int, str]:
        """Flatten nested or stringified multi-head class names into a continuous index dictionary."""
        import ast

        if not isinstance(names, dict):
            return names or {}

        # Check if multi-head dictionary (either dict of dicts or dict of stringified dicts)
        if len(names) > 0 and (
            isinstance(list(names.values())[0], dict)
            or (isinstance(list(names.values())[0], str) and list(names.values())[0].strip().startswith("{"))
        ):
            flattened: Dict[int, str] = {}
            curr_idx = 0
            for head_idx in sorted(names.keys()):
                val = names[head_idx]
                if isinstance(val, str):
                    try:
                        val = ast.literal_eval(val)
                    except Exception:
                        val = {0: val}
                if isinstance(val, dict):
                    for cls_id in sorted(val.keys()):
                        flattened[curr_idx] = str(val[cls_id])
                        curr_idx += 1
            return flattened

        return names

    @staticmethod
    def _map_plastic_item_form(resin_code: str, bbox_w: float, bbox_h: float) -> str:
        """Map plastic resin code and physical bounding box dimensions into combined item label."""
        area = bbox_w * bbox_h
        aspect_ratio = max(bbox_w, bbox_h) / max(min(bbox_w, bbox_h), 1.0)

        # 1. Very small compact boxes are typically bottle caps or drink lids
        if (bbox_w <= 45 and bbox_h <= 45) or (area <= 2200 and aspect_ratio <= 1.8):
            if resin_code in ("HDPE", "PP", "Other", "unknown"):
                return f"Cap & Lid ({resin_code})" if resin_code != "unknown" else "Cap & Lid"

        # 2. Resin-specific primary form mapping
        if resin_code == "PET":
            return f"Bottle ({resin_code})"
        elif resin_code == "LDPE":
            return f"Plastic Bag ({resin_code})"
        elif resin_code == "Other":
            return f"Wrapper & Film ({resin_code})"
        elif resin_code == "PS":
            return f"Cup & Container ({resin_code})"
        elif resin_code == "PP":
            if aspect_ratio >= 1.6 and bbox_w > bbox_h:
                return f"Tub & Tray ({resin_code})"
            return f"Cup & Container ({resin_code})"
        elif resin_code == "HDPE":
            if area <= 3500 and aspect_ratio <= 1.6:
                return f"Cap & Lid ({resin_code})"
            elif aspect_ratio >= 1.8 and bbox_w > bbox_h:
                return f"Tub & Tray ({resin_code})"
            else:
                return f"Bottle ({resin_code})"

        return f"Plastic ({resin_code})" if resin_code != "unknown" else "Plastic"

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

        # Device determination (CUDA, Apple Silicon MPS, or CPU)
        self.device = resolve_inference_device(device)

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
            self.class_names = self._parse_class_names(self.model.names)
            # Ensure model's internal names dictionary matches flattened mapping so r.plot() renders without KeyError
            if hasattr(self.model, "model") and hasattr(self.model.model, "names"):
                self.model.model.names = self.class_names

            import os
            base = os.path.basename(self.model_path).replace(".pt", "")
            if "wastesense" in base.lower():
                self.model_name = "WasteSense-YOLO"
            elif "yolov8m" in base.lower():
                self.model_name = "YOLOv8m-det"
            elif "yolo11" in base.lower():
                self.model_name = "YOLO11-det"
            else:
                self.model_name = base[:20]

            # Load Stage 2: Plastic Resin Classifier
            try:
                self.plastic_classifier = PlasticClassifier(device=self.device)
            except Exception as e:
                logger.warning(f"Could not load PlasticClassifier: {e}")
                self.plastic_classifier = None

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
            h_img, w_img = image.shape[:2]
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
                # Stage 1: Gather raw detection boxes
                parsed_boxes = []
                plastic_crops = []
                plastic_indices = []

                for idx, box in enumerate(r.boxes):
                    cls_id = int(box.cls.item() if box.cls.numel() == 1 else box.cls[0].item())
                    conf = float(box.conf.item() if box.conf.numel() == 1 else box.conf[0].item())
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().tolist()
                    ix1, iy1 = max(0, int(x1)), max(0, int(y1))
                    ix2, iy2 = min(w_img, int(x2)), min(h_img, int(y2))

                    raw_name = self.class_names.get(cls_id, f"class_{cls_id}").capitalize()
                    # Map to waste group
                    waste_group = self.waste_mapping.get(raw_name.lower())
                    if not waste_group:
                        lowered = raw_name.lower()
                        if "plastic" in lowered or any(k in lowered for k in ["bottle", "cup", "wrapper", "bag", "tub", "tray", "jug", "lid"]):
                            waste_group = "plastic"
                        elif "metal" in lowered or any(k in lowered for k in ["can", "tin", "cylinder", "aerosol"]):
                            waste_group = "metal"
                        elif "glass" in lowered or "jar" in lowered:
                            waste_group = "glass"
                        elif "paper" in lowered or "carton" in lowered or "fiber" in lowered or "cardboard" in lowered:
                            waste_group = "paper"
                        elif "cigarette" in lowered or "hazard" in lowered or "battery" in lowered:
                            waste_group = "hazardous"
                        elif "electronic" in lowered:
                            waste_group = "electronic"
                        else:
                            waste_group = "other"

                    parsed_boxes.append({
                        "cls_id": cls_id,
                        "conf": conf,
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                        "raw_name": raw_name,
                        "waste_group": waste_group,
                        "waste_type": "unknown",
                    })

                    # If plastic and valid crop size, stage for batched resin classification
                    if waste_group == "plastic" and (ix2 - ix1) >= 8 and (iy2 - iy1) >= 8:
                        crop = image[iy1:iy2, ix1:ix2]
                        plastic_crops.append(crop)
                        plastic_indices.append(idx)

                # Stage 2: Parallel batched resin classification for all plastic crops
                if self.plastic_classifier and plastic_crops:
                    try:
                        resin_preds = self.plastic_classifier.classify_crops_batch(plastic_crops, batch_size=32)
                        for p_idx, (resin_cls, resin_conf) in zip(plastic_indices, resin_preds):
                            p_box = parsed_boxes[p_idx]
                            bw = p_box["x2"] - p_box["x1"]
                            bh = p_box["y2"] - p_box["y1"]
                            if resin_cls != "unknown":
                                p_box["waste_type"] = resin_cls
                                p_box["raw_name"] = self._map_plastic_item_form(resin_cls, bw, bh)
                                # Update confidence to reflect the ConvNeXt classification certainty
                                if resin_conf > 0:
                                    p_box["conf"] = round(max(p_box["conf"], resin_conf), 4)
                            else:
                                p_box["raw_name"] = self._map_plastic_item_form("unknown", bw, bh)
                    except Exception as e:
                        logger.warning(f"Batched plastic classification failed, keeping defaults: {e}")

                # Build final detection items
                for p_box in parsed_boxes:
                    name = p_box["raw_name"]
                    class_counts[name] = class_counts.get(name, 0) + 1
                    items.append(
                        DetectionItem(
                            id=str(uuid.uuid4()),
                            class_name=name,
                            waste_group=p_box["waste_group"],
                            confidence=p_box["conf"],
                            bbox_x=float(p_box["x1"]),
                            bbox_y=float(p_box["y1"]),
                            bbox_w=float(p_box["x2"] - p_box["x1"]),
                            bbox_h=float(p_box["y2"] - p_box["y1"]),
                            waste_type=p_box["waste_type"],
                        )
                    )

                # Generate annotated visualization with combined category + resin labels
                if len(parsed_boxes) > 0:
                    annotated_img = image.copy()
                    for p_box in parsed_boxes:
                        x1, y1 = max(0, int(p_box["x1"])), max(0, int(p_box["y1"]))
                        x2, y2 = min(w_img, int(p_box["x2"])), min(h_img, int(p_box["y2"]))
                        lbl = f"{p_box['raw_name']} {int(p_box['conf'] * 100)}%"

                        grp = p_box["waste_group"]
                        if grp == "plastic":
                            color = (235, 99, 37)  # Blue
                        elif grp == "metal":
                            color = (212, 182, 6)   # Cyan
                        elif grp == "glass":
                            color = (16, 185, 129)  # Green
                        elif grp == "paper":
                            color = (11, 158, 245)  # Amber
                        else:
                            color = (247, 85, 168)  # Purple

                        cv2.rectangle(annotated_img, (x1, y1), (x2, y2), color, 2)
                        (tw, th), _ = cv2.getTextSize(lbl, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                        lbl_y = max(y1 - 6, th + 4)
                        cv2.rectangle(
                            annotated_img,
                            (x1, lbl_y - th - 3),
                            (x1 + tw + 6, lbl_y + 3),
                            color,
                            -1,
                        )
                        cv2.putText(
                            annotated_img,
                            lbl,
                            (x1 + 3, lbl_y),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.45,
                            (255, 255, 255),
                            1,
                            cv2.LINE_AA,
                        )

                    success, encoded = cv2.imencode(".jpg", annotated_img)
                    if success:
                        annotated_image_bytes = encoded.tobytes()

            return DetectorPrediction(
                model_name=self.model_name,
                items=items,
                class_counts=class_counts,
                total_objects=len(items),
                annotated_image_bytes=annotated_image_bytes,
                processing_time_ms=proc_time_ms,
            )
        except Exception as e:
            logger.error(f"Detector inference error: {e}", exc_info=True)
            raise MLClientError(f"Detector inference failed: {e}") from e
