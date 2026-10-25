"""Dual-Model ML Client coordinating fine-grained WasteDetector and scene-level WasteSegmenter."""

import logging
import time
from typing import Optional

import cv2
import numpy as np

from app.application.interfaces.i_ml_client import IMLClient, MLClientError, MLPrediction
from app.application.interfaces.i_waste_detector import IWasteDetector
from app.application.interfaces.i_waste_segmenter import IWasteSegmenter
from app.infrastructure.ml_client.waste_detector import WasteDetector
from app.infrastructure.ml_client.waste_segmenter import WasteSegmenter

logger = logging.getLogger("WasteSense_AI")


class DualModelMLClient(IMLClient):
    """Executes Model 1 (WasteDetector) and Model 2 (WasteSegmenter) on the same input image."""

    def __init__(
        self,
        detector: Optional[IWasteDetector] = None,
        segmenter: Optional[IWasteSegmenter] = None,
    ):
        self.detector = detector or WasteDetector()
        self.segmenter = segmenter or WasteSegmenter()
        logger.info("DualModelMLClient initialized with WasteDetector and WasteSegmenter.")

    def predict(self, file_bytes: bytes, filename: str, content_type: str) -> MLPrediction:
        """Decode image bytes once and run both detector and segmenter."""
        try:
            # 1. Decode image bytes to OpenCV BGR image
            nparr = np.frombuffer(file_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise MLClientError("Failed to decode image bytes. Unsupported or corrupted format.")

            start_time = time.time()

            # 2. Run Model 1: Fine-grained Object Detector
            det_res = self.detector.predict(img.copy())

            # 3. Run Model 2: Scene-level TACO Segmenter
            seg_res = self.segmenter.predict(img.copy())

            total_processing_ms = int((time.time() - start_time) * 1000)

            # 4. Generate combined visualization (segmentation masks + fine-grained bounding boxes)
            combined_annotated_bytes = self._create_combined_visualization(img, det_res, seg_res)

            # Use combined visualization if available; fallback to detector or segmenter
            primary_annotated_bytes = (
                combined_annotated_bytes
                or seg_res.annotated_image_bytes
                or det_res.annotated_image_bytes
            )

            model_version = f"dual-model ({det_res.model_name} + {seg_res.model_name})"[:64]

            return MLPrediction(
                model_version=model_version,
                items=det_res.items,
                annotated_image_bytes=primary_annotated_bytes,
                processing_time_ms=total_processing_ms,
                segmentation=seg_res,
                detector=det_res,
                combined_visualization_bytes=combined_annotated_bytes,
            )

        except MLClientError:
            raise
        except Exception as e:
            logger.error(f"Dual-model inference failed: {e}", exc_info=True)
            raise MLClientError(f"Dual-model inference failed: {str(e)}") from e

    def _create_combined_visualization(self, original_img: np.ndarray, det_res, seg_res) -> Optional[bytes]:
        """Combine segmentation mask overlay and detector bounding boxes on the original image."""
        try:
            vis_img = original_img.copy()

            # Apply segmentation overlay if masks exist
            if seg_res.annotated_image_bytes:
                nparr = np.frombuffer(seg_res.annotated_image_bytes, np.uint8)
                seg_vis = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if seg_vis is not None:
                    vis_img = seg_vis

            CLASS_COLORS = {
                "plastic": (235, 120, 10),    # Vibrant Electric Blue (BGR)
                "paper": (11, 158, 245),      # Amber / Gold
                "metal": (210, 180, 20),      # Cyan / Teal
                "glass": (50, 205, 50),       # Emerald Green
                "hazardous": (30, 30, 240),   # Crimson Red
                "organic": (34, 139, 34),     # Forest Green
                "other": (180, 80, 240),      # Neon Purple
            }

            # Draw detector bounding boxes on top of the segmentation visualization
            for item in det_res.items:
                x1 = int(item.bbox_x)
                y1 = int(item.bbox_y)
                x2 = int(item.bbox_x + item.bbox_w)
                y2 = int(item.bbox_y + item.bbox_h)

                group = (item.waste_group or "plastic").lower()
                box_color = CLASS_COLORS.get(group, (235, 120, 10))

                # Draw crisp bounding box
                cv2.rectangle(vis_img, (x1, y1), (x2, y2), box_color, 2)

                # Label badge with white text on filled color header
                label = f"{item.class_name} {int(item.confidence * 100)}% conf"
                (w_label, h_label), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                badge_top = max(0, y1 - h_label - 6)
                badge_bottom = max(h_label + 6, y1)
                cv2.rectangle(vis_img, (x1, badge_top), (x1 + w_label + 8, badge_bottom), box_color, -1)
                cv2.putText(
                    vis_img,
                    label,
                    (x1 + 4, badge_bottom - 4),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.45,
                    (255, 255, 255),
                    1,
                    cv2.LINE_AA,
                )

            success, encoded = cv2.imencode(".jpg", vis_img)
            return encoded.tobytes() if success else None
        except Exception as e:
            logger.warning(f"Could not build combined visualization: {e}")
            return None
