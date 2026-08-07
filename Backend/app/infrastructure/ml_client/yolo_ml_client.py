"""Local YOLOv11 ML client using direct Ultralytics inference."""

import uuid
import numpy as np
import cv2
from ultralytics import YOLO

from app.application.interfaces.i_ml_client import IMLClient, MLClientError, MLPrediction
from app.core.config import settings
from app.domain.entities.detection import DetectionItem
from app.domain.enums.waste_type import WasteType

import logging
logger = logging.getLogger("PlasticSense_AI")


class LocalYoloMLClient(IMLClient):
    """Directly executes YOLOv11 inference locally instead of calling an HTTP service."""
    
    # Map trained YOLO class names to domain WasteType enum
    MODEL_CLASS_MAPPING = {
        "plastic_bottle": WasteType.PET_BOTTLE,
        "PET_bottle": WasteType.PET_BOTTLE,
        "plastic_bag": WasteType.PLASTIC_BAG,
        "wrapper": WasteType.FOOD_WRAPPER,
        "food_wrapper": WasteType.FOOD_WRAPPER,
        "food_container": WasteType.FOOD_WRAPPER,
        "styrofoam": WasteType.STYROFOAM,
        "multilayer_packaging": WasteType.MULTILAYER,
        "multilayer": WasteType.MULTILAYER,
        "plastic_cap": WasteType.OTHER,
        "other_plastic": WasteType.OTHER,
        "other": WasteType.OTHER,
    }

    def __init__(
        self,
        model_path: str = settings.MODEL_WEIGHTS_PATH,
        conf_threshold: float = settings.CONFIDENCE_THRESHOLD,
        iou_threshold: float = settings.IOU_THRESHOLD,
    ):
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        
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
            results = self.model.predict(
                source=img,
                conf=self.conf_threshold,
                iou=self.iou_threshold,
                verbose=False,
            )
            
            items = []
            if len(results) > 0 and results[0].boxes is not None:
                for box in results[0].boxes:
                    cls_id = int(box.cls.item())
                    conf = float(box.conf.item())
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().tolist()
                    
                    raw_name = self.class_names.get(cls_id, f"class_{cls_id}")
                    waste_type = self.MODEL_CLASS_MAPPING.get(raw_name, WasteType.OTHER)
                    
                    items.append(DetectionItem(
                        id=str(uuid.uuid4()),
                        waste_type=waste_type,
                        confidence=conf,
                        bbox_x=float(x1),
                        bbox_y=float(y1),
                        bbox_w=float(x2 - x1),
                        bbox_h=float(y2 - y1),
                    ))
                    
            return MLPrediction(model_version="v1.0-yolov11", items=items)
            
        except Exception as e:
            raise MLClientError(f"Inference failed: {str(e)}") from e
