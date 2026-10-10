"""YOLO11 inference engine for the ML service."""

import time
import logging
from typing import List

import numpy as np
import cv2
from ultralytics import YOLO

from app.schemas.predict import DetectionItem

logger = logging.getLogger("wastesense_ml")


class PlasticDetector:
    """Loads a YOLO model and runs plastic waste detection inference."""

    def __init__(self, model_path: str, conf_threshold: float, iou_threshold: float):
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold

        logger.info(f"Loading YOLO model from: {model_path}")
        try:
            self.model = YOLO(model_path)
            self.class_names = self.model.names
            logger.info(f"Model loaded successfully. Classes: {list(self.class_names.values())}")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            raise RuntimeError(f"Model load failed: {e}") from e

    def predict(self, image_bytes: bytes) -> tuple[List[DetectionItem], int]:
        """
        Run inference on raw image bytes.

        Returns:
            (list of DetectionItem, processing_time_ms)
        """
        # Decode image bytes
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image bytes — ensure the upload is a valid image.")

        start = time.time()
        results = self.model.predict(
            source=img,
            conf=self.conf_threshold,
            iou=self.iou_threshold,
            verbose=False,
        )
        processing_time_ms = int((time.time() - start) * 1000)

        detections: List[DetectionItem] = []
        if results and results[0].boxes is not None:
            for box in results[0].boxes:
                cls_id = int(box.cls.item())
                conf = float(box.conf.item())
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().tolist()
                class_name = self.class_names.get(cls_id, f"class_{cls_id}")
                detections.append(
                    DetectionItem(
                        class_name=class_name,
                        confidence=round(conf, 4),
                        bbox=[round(x1, 2), round(y1, 2), round(x2, 2), round(y2, 2)],
                    )
                )

        return detections, processing_time_ms
