import tempfile
import unittest

from app.application.interfaces.i_ml_client import MLClientError, MLPrediction
from app.application.services.detection_service import DetectionService
from app.application.services.risk_service import RiskService
from app.domain.entities.detection import DetectionItem
from app.domain.enums.waste_type import WasteType
from app.infrastructure.external.storage_client import LocalStorageClient
from app.application.dto.detection_dto import DetectionCreateDTO


class _DetectionRepository:
    def __init__(self):
        self.records, self.status_history = {}, []

    def save(self, detection):
        self.records[detection.id] = detection
        self.status_history.append(detection.detection_status)
        return detection

    def update(self, detection):
        self.records[detection.id] = detection
        self.status_history.append(detection.detection_status)
        return detection

    def get_by_id(self, detection_id):
        return self.records.get(detection_id)

    def get_all(self, skip=0, limit=10):
        values = list(self.records.values())
        return values[skip:skip + limit], len(values)


class _RiskRepository:
    def save(self, assessment):
        return assessment

    def get_by_detection_id(self, detection_id):
        return None


class _SuccessMLClient:
    def predict(self, *_):
        return MLPrediction("contract-model-v1", [
            DetectionItem("item", WasteType.PET_BOTTLE, 0.9, 1, 2, 3, 4)
        ])


class _UnavailableMLClient:
    def predict(self, *_):
        raise MLClientError("ML service unavailable: connection refused")


class DetectionServiceTests(unittest.TestCase):
    def _dto(self):
        return DetectionCreateDTO(12.9, 77.5, "image.jpg", "image/jpeg", b"image")

    def _service(self, ml_client, repository, directory):
        return DetectionService(repository, ml_client, RiskService(_RiskRepository()), LocalStorageClient(directory))

    def test_transitions_pending_to_completed_when_ml_contract_succeeds(self):
        repository = _DetectionRepository()
        with tempfile.TemporaryDirectory() as directory:
            result = self._service(_SuccessMLClient(), repository, directory).create_detection(self._dto())
        self.assertEqual(repository.status_history, ["pending", "completed"])
        self.assertEqual(result.detection_status, "completed")
        self.assertEqual(result.model_version, "contract-model-v1")
        self.assertEqual(len(result.items), 1)

    def test_transitions_pending_to_failed_when_ml_service_is_unavailable(self):
        repository = _DetectionRepository()
        with tempfile.TemporaryDirectory() as directory:
            result = self._service(_UnavailableMLClient(), repository, directory).create_detection(self._dto())
        self.assertEqual(repository.status_history, ["pending", "failed"])
        self.assertEqual(result.detection_status, "failed")
        self.assertIn("connection refused", result.failure_reason)
