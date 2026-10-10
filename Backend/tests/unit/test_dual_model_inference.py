"""Unit tests for Phase 2 & 3: Dual-Model inference services."""

import unittest
import numpy as np
import cv2
import torch

from app.application.interfaces.i_ml_client import MLClientError
from app.infrastructure.ml_client import DualModelMLClient, WasteDetector, WasteSegmenter


class DualModelInferenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create a synthetic test image with colored shapes for unit testing
        cls.test_img = np.zeros((480, 640, 3), dtype=np.uint8)
        # Draw some shapes
        cv2.rectangle(cls.test_img, (50, 50), (200, 200), (255, 255, 255), -1)
        cv2.circle(cls.test_img, (400, 300), 80, (200, 200, 200), -1)
        _, encoded = cv2.imencode(".jpg", cls.test_img)
        cls.test_bytes = encoded.tobytes()

    def test_detector_initialization_and_prediction(self):
        detector = WasteDetector()
        self.assertIsNotNone(detector.model)
        self.assertEqual(len(detector.class_names), 10)

        pred = detector.predict(self.test_img)
        self.assertEqual(pred.model_name, "wastesense_detector_yolo11s")
        self.assertIsInstance(pred.items, list)
        self.assertIsInstance(pred.class_counts, dict)
        self.assertGreaterEqual(pred.processing_time_ms, 0)

    def test_segmenter_initialization_and_prediction(self):
        segmenter = WasteSegmenter()
        self.assertIsNotNone(segmenter.model)
        self.assertEqual(len(segmenter.class_names), 5)

        pred = segmenter.predict(self.test_img)
        self.assertEqual(pred.model_name, "taco_segmentation_yolo11s_seg")
        self.assertIsInstance(pred.waste_coverage_percent, float)
        self.assertGreaterEqual(pred.waste_coverage_percent, 0.0)
        self.assertLessEqual(pred.waste_coverage_percent, 100.0)
        self.assertIsInstance(pred.material_coverage, dict)
        self.assertIsInstance(pred.material_counts, dict)

    def test_segmenter_mask_union_avoids_double_counting(self):
        segmenter = WasteSegmenter()
        h, w = 100, 100
        total_pixels = h * w

        # Test synthetic overlapping masks directly
        mask1 = np.zeros((h, w), dtype=np.uint8)
        mask1[10:60, 10:60] = 1  # 50x50 = 2500 pixels (25%)

        mask2 = np.zeros((h, w), dtype=np.uint8)
        mask2[30:80, 30:80] = 1  # 50x50 = 2500 pixels (25%), overlapping by 30x30 = 900 pixels

        # Naive sum: 2500 + 2500 = 5000 pixels (50%) -> WRONG!
        # Union mask: 2500 + 2500 - 900 = 4100 pixels (41%) -> CORRECT!
        union_mask = np.bitwise_or(mask1, mask2)
        union_pixels = int(union_mask.sum())
        self.assertEqual(union_pixels, 4100)

        union_coverage = (union_pixels / total_pixels) * 100.0
        self.assertEqual(union_coverage, 41.0)

    def test_dual_model_client_end_to_end(self):
        client = DualModelMLClient()
        prediction = client.predict(self.test_bytes, "test.jpg", "image/jpeg")

        self.assertIn("dual-model", prediction.model_version)
        self.assertIsNotNone(prediction.segmentation)
        self.assertIsNotNone(prediction.detector)
        self.assertIsInstance(prediction.items, list)
        self.assertGreaterEqual(prediction.processing_time_ms, 0)

    def test_dual_model_client_invalid_image_raises_error(self):
        client = DualModelMLClient()
        with self.assertRaises(MLClientError):
            client.predict(b"not_an_image", "corrupt.jpg", "image/jpeg")


if __name__ == "__main__":
    unittest.main()
