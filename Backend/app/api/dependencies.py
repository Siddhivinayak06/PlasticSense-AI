from typing import Generator
from functools import lru_cache
from fastapi import Depends
from sqlalchemy.orm import Session
from app.application.interfaces.i_ml_client import IMLClient
from app.application.interfaces.i_waste_detector import IWasteDetector
from app.application.interfaces.i_waste_segmenter import IWasteSegmenter
from app.application.services.detection_service import DetectionService
from app.application.services.risk_service import RiskService
from app.core.logging import logger
from app.infrastructure.database.session import SessionLocal
from app.infrastructure.database.repositories.detection_repository import DetectionRepository
from app.infrastructure.database.repositories.risk_repository import RiskRepository
from app.infrastructure.ml_client import DualModelMLClient, WasteDetector, WasteSegmenter


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_detection_repository(db: Session = Depends(get_db)) -> DetectionRepository:
    return DetectionRepository(db)


def get_risk_repository(db: Session = Depends(get_db)) -> RiskRepository:
    return RiskRepository(db)


def get_risk_service(repo: RiskRepository = Depends(get_risk_repository)) -> RiskService:
    return RiskService(repository=repo)


@lru_cache()
def get_waste_detector() -> IWasteDetector:
    return WasteDetector()


@lru_cache()
def get_waste_segmenter() -> IWasteSegmenter:
    return WasteSegmenter()


@lru_cache()
def get_ml_client() -> IMLClient:
    detector = get_waste_detector()
    segmenter = get_waste_segmenter()
    return DualModelMLClient(detector=detector, segmenter=segmenter)


class LazyMLClient:
    """Defers loading the YOLO models until an analysis actually needs them.

    Read-only endpoints (history, map, statistics) depend on DetectionService too.
    Resolving the ML client eagerly made the first GET of any of them load both
    models onto the GPU, and a missing checkpoint turned them into 500s. The service
    checks ``unavailable_reason`` before inference and returns 503 when it is set.
    """

    _MESSAGE = (
        "AI model weights could not be loaded on the server. Check DETECTOR_MODEL_PATH "
        "and SEGMENTER_MODEL_PATH in Backend/.env."
    )

    @property
    def unavailable_reason(self):
        try:
            get_ml_client()  # cached after the first success; failures are retried
            return None
        except Exception as exc:
            logger.error("ML models unavailable: %s", exc)
            return self._MESSAGE

    def predict(self, *args, **kwargs):
        return get_ml_client().predict(*args, **kwargs)


def model_status() -> dict:
    """Report model state for /health without forcing a (slow) model load."""
    from pathlib import Path
    from app.core.config import resolve_model_path, settings

    detector_path = resolve_model_path(settings.DETECTOR_MODEL_PATH)
    segmenter_path = resolve_model_path(settings.SEGMENTER_MODEL_PATH)
    return {
        "loaded": get_ml_client.cache_info().currsize > 0,
        "detector_weights_present": Path(detector_path).is_file(),
        "segmenter_weights_present": Path(segmenter_path).is_file(),
    }


def get_detection_service(
    repo: DetectionRepository = Depends(get_detection_repository),
    ml_client: IMLClient = Depends(LazyMLClient),
    risk_service: RiskService = Depends(get_risk_service),
) -> DetectionService:
    return DetectionService(repository=repo, ml_client=ml_client, risk_service=risk_service)
