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
from app.infrastructure.ml_client.model_introspect import describe
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

            info = describe(self.model)
            self.architecture = info["architecture"]
            self.param_count = info["param_count"]
            self.provenance = info["provenance"]

            # "best.pt" is the Ultralytics default filename and says nothing useful,
            # so name the model after what it actually is.
            if base.lower() in {"best", "last", "weights", "model"}:
                self.model_name = f"{self.architecture}-{len(self.class_names)}cls"

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

            # 1. Global image inference pass
            raw_detections = []
            results = self.model.predict(
                source=image,
                conf=self.conf_threshold,
                iou=self.iou_threshold,
                imgsz=self.image_size,
                augment=False,
                device=self.device,
                verbose=False,
                max_det=1000,
            )

            if len(results) > 0 and results[0].boxes is not None:
                for box in results[0].boxes:
                    cls_id = int(box.cls.item() if box.cls.numel() == 1 else box.cls[0].item())
                    conf = float(box.conf.item() if box.conf.numel() == 1 else box.conf[0].item())
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().tolist()
                    raw_detections.append({
                        "cls_id": cls_id,
                        "conf": conf,
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                    })

            # 2. Sliced/Tiled inference pass for high-resolution images (>= 1200px)
            # Slices image into an overlapping 2x2 grid (58% window, 20% overlap)
            # Captures small background bottles, caps, wrappers, and debris that
            # shrink below the detector receptive field during global 960px downsampling.
            if max(w_img, h_img) >= 1200:
                tile_w = int(w_img * 0.58)
                tile_h = int(h_img * 0.58)
                step_x = int(w_img * 0.42)
                step_y = int(h_img * 0.42)

                for ty in range(0, h_img, step_y):
                    for tx in range(0, w_img, step_x):
                        tx2 = min(tx + tile_w, w_img)
                        ty2 = min(ty + tile_h, h_img)
                        tx1 = max(0, tx2 - tile_w)
                        ty1 = max(0, ty2 - tile_h)
                        tile_crop = image[ty1:ty2, tx1:tx2]
                        if tile_crop.shape[0] < 32 or tile_crop.shape[1] < 32:
                            continue

                        tile_res = self.model.predict(
                            source=tile_crop,
                            conf=self.conf_threshold,
                            iou=self.iou_threshold,
                            imgsz=self.image_size,
                            augment=False,
                            device=self.device,
                            verbose=False,
                            max_det=500,
                        )
                        if len(tile_res) > 0 and tile_res[0].boxes is not None:
                            for tbox in tile_res[0].boxes:
                                t_cls = int(tbox.cls.item() if tbox.cls.numel() == 1 else tbox.cls[0].item())
                                t_conf = float(tbox.conf.item() if tbox.conf.numel() == 1 else tbox.conf[0].item())
                                bx1, by1, bx2, by2 = tbox.xyxy[0].cpu().numpy().tolist()
                                raw_detections.append({
                                    "cls_id": t_cls,
                                    "conf": t_conf,
                                    "x1": bx1 + tx1,
                                    "y1": by1 + ty1,
                                    "x2": bx2 + tx1,
                                    "y2": by2 + ty1,
                                })

            proc_time_ms = int((time.time() - start_time) * 1000)

            items = []
            class_counts: Dict[str, int] = {}
            annotated_image_bytes = None

            if raw_detections:
                # Stage 1: Map detected class labels to waste categories
                parsed_boxes = []

                for rbox in raw_detections:
                    cls_id = rbox["cls_id"]
                    conf = rbox["conf"]
                    x1, y1, x2, y2 = rbox["x1"], rbox["y1"], rbox["x2"], rbox["y2"]

                    raw_name = self.class_names.get(cls_id, f"class_{cls_id}").capitalize()
                    waste_group = self.waste_mapping.get(raw_name.lower())
                    if not waste_group:
                        lowered = raw_name.lower()
                        if lowered in ("plastic", "metal", "glass", "paper", "organic"):
                            waste_group = lowered
                        elif lowered == "bulky":
                            waste_group = "other"
                        elif any(k in lowered for k in ["bottle", "cup", "wrapper", "bag", "tub", "tray", "jug", "lid", "cap", "straw", "cultery"]):
                            waste_group = "plastic"
                        elif any(k in lowered for k in ["can", "tin", "cylinder", "aerosol"]):
                            waste_group = "metal"
                        elif "jar" in lowered:
                            waste_group = "glass"
                        elif any(k in lowered for k in ["carton", "fiber", "cardboard"]):
                            waste_group = "paper"
                        elif any(k in lowered for k in ["cigarette", "hazard", "battery"]):
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

                # Stage 2: Smart Duplicate & Concentric Box Suppression FIRST
                # Suppressing duplicates before ConvNeXt saves 75% of classification time
                if len(parsed_boxes) > 1:
                    def _box_area(b):
                        return max(0.0, b["x2"] - b["x1"]) * max(0.0, b["y2"] - b["y1"])

                    def _box_intersection(b1, b2):
                        ix1 = max(b1["x1"], b2["x1"])
                        iy1 = max(b1["y1"], b2["y1"])
                        ix2 = min(b1["x2"], b2["x2"])
                        iy2 = min(b1["y2"], b2["y2"])
                        return max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)

                    sorted_boxes = sorted(parsed_boxes, key=lambda b: b["conf"], reverse=True)
                    deduped_boxes = []
                    suppressed_indices = set()

                    for idx, b_high in enumerate(sorted_boxes):
                        if idx in suppressed_indices:
                            continue
                        deduped_boxes.append(b_high)
                        area_high = _box_area(b_high)
                        if area_high <= 0:
                            continue

                        for jdx in range(idx + 1, len(sorted_boxes)):
                            if jdx in suppressed_indices:
                                continue
                            b_low = sorted_boxes[jdx]
                            area_low = _box_area(b_low)
                            if area_low <= 0:
                                continue

                            inter = _box_intersection(b_high, b_low)
                            if inter <= 0:
                                continue

                            min_area = min(area_high, area_low)
                            max_area = max(area_high, area_low)
                            union = area_high + area_low - inter
                            iou = inter / union if union > 0 else 0.0
                            containment = inter / min_area if min_area > 0 else 0.0
                            size_ratio = min_area / max_area if max_area > 0 else 0.0

                            # Suppress if:
                            # 1. IoU >= 0.50 (significant overlap on the same target)
                            # 2. Concentric duplicate: containment >= 0.70 AND size_ratio >= 0.45
                            if iou >= 0.50 or (containment >= 0.70 and size_ratio >= 0.45):
                                suppressed_indices.add(jdx)
                                logger.debug(
                                    "Suppressed duplicate box '%s' (conf=%.2f, iou=%.2f, containment=%.2f, size_ratio=%.2f) inside '%s' (conf=%.2f)",
                                    b_low["raw_name"], b_low["conf"], iou, containment, size_ratio, b_high["raw_name"], b_high["conf"]
                                )

                    parsed_boxes = deduped_boxes

                # Stage 3: Parallel batched resin classification for deduplicated candidate crops
                if self.plastic_classifier and parsed_boxes:
                    plastic_crops = []
                    plastic_indices = []
                    for p_idx, p_box in enumerate(parsed_boxes):
                        if p_box["waste_group"] == "plastic" or p_box["conf"] < 0.35:
                            crop_x1 = max(0, int(p_box["x1"]))
                            crop_y1 = max(0, int(p_box["y1"]))
                            crop_x2 = min(w_img, int(p_box["x2"]))
                            crop_y2 = min(h_img, int(p_box["y2"]))
                            if (crop_x2 - crop_x1) >= 8 and (crop_y2 - crop_y1) >= 8:
                                crop = image[crop_y1:crop_y2, crop_x1:crop_x2]
                                plastic_crops.append(crop)
                                plastic_indices.append(p_idx)

                    if plastic_crops:
                        try:
                            resin_preds = self.plastic_classifier.classify_crops_batch(plastic_crops, batch_size=64)
                            for p_idx, (resin_cls, resin_conf) in zip(plastic_indices, resin_preds):
                                p_box = parsed_boxes[p_idx]
                                bw = p_box["x2"] - p_box["x1"]
                                bh = p_box["y2"] - p_box["y1"]
                                if p_box["waste_group"] == "plastic" or resin_conf >= 0.30:
                                    if resin_cls != "unknown":
                                        p_box["waste_group"] = "plastic"
                                        p_box["waste_type"] = resin_cls
                                        p_box["raw_name"] = self._map_plastic_item_form(resin_cls, bw, bh)
                                        if resin_conf > 0:
                                            p_box["conf"] = round(max(p_box["conf"], resin_conf), 4)
                                    else:
                                        if p_box["waste_group"] == "plastic":
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
                        lbl = f"{p_box['raw_name']} {int(p_box['conf'] * 100)}% conf"

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
