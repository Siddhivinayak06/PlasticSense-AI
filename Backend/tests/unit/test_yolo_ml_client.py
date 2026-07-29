import unittest
from unittest.mock import patch

from app.infrastructure.ml_client.yolo_ml_client import YoloMLClient


class _Response:
    def __init__(self, body: bytes):
        self.body = body

    def read(self):
        return self.body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class YoloMLClientTests(unittest.TestCase):
    @patch("app.infrastructure.ml_client.yolo_ml_client.urlopen")
    def test_normalizes_documented_ml_contract(self, mock_urlopen):
        mock_urlopen.return_value = _Response(
            b'{"model_version":"yolo11-plastic-v1.2","detections":[{"class":"PET_bottle","confidence":0.91,"bbox":[10,20,40,70]}]}'
        )
        prediction = YoloMLClient("http://ml.test").predict(b"image", "sample.jpg", "image/jpeg")
        self.assertEqual(prediction.model_version, "yolo11-plastic-v1.2")
        self.assertEqual(len(prediction.items), 1)
        self.assertEqual(prediction.items[0].bbox_x, 10.0)
        self.assertEqual(prediction.items[0].bbox_y, 20.0)
        self.assertEqual(prediction.items[0].bbox_w, 30.0)
        self.assertEqual(prediction.items[0].bbox_h, 50.0)
        self.assertEqual(mock_urlopen.call_args.args[0].full_url, "http://ml.test/predict")
