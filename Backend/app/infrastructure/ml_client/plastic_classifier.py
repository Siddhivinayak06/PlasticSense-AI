"""Plastic Resin Type Classifier using ConvNeXt-Base."""

import logging
from typing import List, Optional, Tuple

import cv2
import numpy as np
import timm
import torch
import torchvision.transforms as T

from app.core.config import resolve_inference_device, resolve_model_path, settings

logger = logging.getLogger("WasteSense_AI")


class PlasticClassifier:
    """Classifies cropped plastic image patches into 6 resin codes (HDPE, LDPE, Other, PET, PP, PS)."""

    CLASS_NAMES = ["HDPE", "LDPE", "Other", "PET", "PP", "PS"]

    def __init__(
        self,
        model_path: Optional[str] = None,
        device: Optional[str] = None,
    ):
        raw_path = model_path or getattr(settings, "PLASTIC_CLASSIFIER_PATH", "plastic_classifier_best.pt")
        self.model_path = resolve_model_path(raw_path)
        self.device = resolve_inference_device(device)

        self.transform = T.Compose([
            T.ToPILImage(),
            T.Resize((224, 224)),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

        try:
            logger.info(f"Loading Plastic Classifier from {self.model_path} on {self.device}...")
            self.model = timm.create_model("convnext_base", num_classes=6, pretrained=False)
            ckpt = torch.load(self.model_path, map_location=self.device, weights_only=False)
            self.model.load_state_dict(ckpt)
            self.model.to(self.device)
            self.model.eval()
            logger.info(f"Plastic Classifier loaded successfully. Resin classes: {self.CLASS_NAMES}")
        except Exception as e:
            logger.error(f"Failed to load Plastic Classifier from {self.model_path}: {e}")
            self.model = None

    def classify_crops_batch(
        self, crops_bgr: List[np.ndarray], batch_size: int = 32
    ) -> List[Tuple[str, float]]:
        """Classify a batch of cropped OpenCV BGR image patches in parallel on GPU/MPS/CPU.

        Returns a list of (resin_type, confidence_score) matching the input order.
        """
        if not crops_bgr:
            return []

        results: List[Tuple[str, float]] = [("unknown", 0.0)] * len(crops_bgr)
        if self.model is None:
            return results

        # Filter out empty or micro crops (<8x8) and keep track of valid indices
        valid_indices: List[int] = []
        valid_tensors: List[torch.Tensor] = []

        for idx, crop in enumerate(crops_bgr):
            if crop is not None and crop.size > 0:
                h, w = crop.shape[:2]
                if h >= 8 and w >= 8:
                    try:
                        crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
                        t = self.transform(crop_rgb)
                        valid_tensors.append(t)
                        valid_indices.append(idx)
                    except Exception as e:
                        logger.debug(f"Failed to transform crop {idx}: {e}")

        if not valid_tensors:
            return results

        # Process valid crops in batches
        for start_idx in range(0, len(valid_tensors), batch_size):
            chunk_tensors = valid_tensors[start_idx : start_idx + batch_size]
            chunk_indices = valid_indices[start_idx : start_idx + batch_size]

            try:
                batch_tensor = torch.stack(chunk_tensors).to(self.device)
                with torch.no_grad():
                    logits = self.model(batch_tensor)
                    probs = torch.softmax(logits, dim=1)
                    top_confs, top_indices = torch.max(probs, dim=1)

                for orig_idx, cls_idx, conf in zip(
                    chunk_indices, top_indices.cpu().numpy(), top_confs.cpu().numpy()
                ):
                    cls_name = self.CLASS_NAMES[int(cls_idx)]
                    results[orig_idx] = (cls_name, float(conf))
            except Exception as e:
                logger.warning(f"Error in batch inference: {e}")
                # Fallback to single crops if batch fails unexpectedly
                for orig_idx, single_t in zip(chunk_indices, chunk_tensors):
                    try:
                        with torch.no_grad():
                            logits = self.model(single_t.unsqueeze(0).to(self.device))
                            probs = torch.softmax(logits, dim=1)[0]
                            top_idx = torch.argmax(probs).item()
                            results[orig_idx] = (self.CLASS_NAMES[top_idx], float(probs[top_idx].item()))
                    except Exception:
                        results[orig_idx] = ("unknown", 0.0)

        return results

    def classify_crop(self, crop_bgr: np.ndarray) -> Tuple[str, float]:
        """Classify a single cropped OpenCV BGR image patch.

        Returns (resin_type, confidence_score).
        """
        res = self.classify_crops_batch([crop_bgr])
        return res[0] if res else ("unknown", 0.0)
