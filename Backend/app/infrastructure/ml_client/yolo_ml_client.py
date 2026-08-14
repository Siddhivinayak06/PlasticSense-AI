"""Local YOLOv11 ML client using direct Ultralytics inference."""

import uuid
import numpy as np
import cv2
from ultralytics import YOLO

import json
import time
from app.application.interfaces.i_ml_client import IMLClient, MLClientError, MLPrediction
from app.core.config import settings
from app.domain.entities.detection import DetectionItem

import logging
logger = logging.getLogger("PlasticSense_AI")


class LocalYoloMLClient(IMLClient):
    """Directly executes YOLOv11 inference locally instead of calling an HTTP service."""
    
    # We load mappings from waste_mapping.json instead of hardcoding
    MAPPING_PATH = "app/core/waste_mapping.json"

    def __init__(
        self,
        model_path: str = settings.MODEL_WEIGHTS_PATH,
        conf_threshold: float = settings.CONFIDENCE_THRESHOLD,
        iou_threshold: float = settings.IOU_THRESHOLD,
    ):
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        self.image_size = settings.IMAGE_SIZE

        # Load waste mapping
        self.waste_mapping = {}
        try:
            with open(self.MAPPING_PATH, 'r') as f:
                mapping_dict = json.load(f)
                for group, classes in mapping_dict.items():
                    for cls in classes:
                        self.waste_mapping[cls.lower()] = group
            logger.info("Loaded waste group mappings successfully.")
        except Exception as e:
            logger.warning(f"Failed to load waste mapping from {self.MAPPING_PATH}: {e}. Will fallback to 'unknown'.")
        
        try:
            self.model = YOLO(model_path)
            self.class_names = self.model.names
            logger.info(f"Local YOLOv11 model loaded successfully from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            raise RuntimeError(f"YOLO model load failed: {e}")

    def predict(self, file_bytes: bytes, filename: str, content_type: str) -> MLPrediction:
        """Run inference on file bytes directly in memory."""
        try:
            # Convert bytes to numpy array then to OpenCV image
            nparr = np.frombuffer(file_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise MLClientError("Failed to decode image bytes")
                
            # Run YOLO inference
            start_time = time.time()
            results = self.model.predict(
                source=img,
                conf=self.conf_threshold,
                iou=self.iou_threshold,
                imgsz=self.image_size,
                verbose=False,
            )
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            items = []
            annotated_image_bytes = None
            if len(results) > 0 and results[0].boxes is not None:
                # Generate annotated image using Ultralytics plot()
                annotated_img = results[0].plot(labels=True, conf=True, line_width=2)
                success, encoded_img = cv2.imencode('.jpg', annotated_img)
                if success:
                    annotated_image_bytes = encoded_img.tobytes()

                for box in results[0].boxes:
                    cls_id = int(box.cls.item())
                    conf = float(box.conf.item())
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().tolist()
                    
                    raw_name = self.class_names.get(cls_id, f"class_{cls_id}")
                    waste_group = self.waste_mapping.get(raw_name.lower(), "unknown")
                    
                    items.append(DetectionItem(
                        id=str(uuid.uuid4()),
                        class_name=raw_name,
                        waste_group=waste_group,
                        confidence=conf,
                        bbox_x=float(x1),
                        bbox_y=float(y1),
                        bbox_w=float(x2 - x1),
                        bbox_h=float(y2 - y1),
                    ))
                    
            return MLPrediction(
                model_version="v1.0-yolov11", 
                items=items,
                annotated_image_bytes=annotated_image_bytes,
                processing_time_ms=processing_time_ms
            )
            
        except Exception as e:
            raise MLClientError(f"Inference failed: {str(e)}") from e
