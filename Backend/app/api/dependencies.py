from typing import Generator
from functools import lru_cache
from fastapi import Depends
from sqlalchemy.orm import Session
from app.application.services.detection_service import DetectionService
from app.application.services.risk_service import RiskService
from app.infrastructure.database.session import SessionLocal
from app.infrastructure.database.repositories.mock_repositories import MockDetectionRepository, MockRiskRepository
from app.infrastructure.ml_client.yolo_ml_client import LocalYoloMLClient


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Instantiate mock repositories globally so data persists in memory across requests
_mock_detection_repo = MockDetectionRepository()
_mock_risk_repo = MockRiskRepository()

def get_detection_repository() -> MockDetectionRepository:
    return _mock_detection_repo


def get_risk_repository() -> MockRiskRepository:
    return _mock_risk_repo


def get_risk_service(repo: MockRiskRepository = Depends(get_risk_repository)) -> RiskService:
    return RiskService(repository=repo)


@lru_cache()
def get_ml_client() -> LocalYoloMLClient:
    return LocalYoloMLClient()


def get_detection_service(
    repo: MockDetectionRepository = Depends(get_detection_repository),
    ml_client: LocalYoloMLClient = Depends(get_ml_client),
    risk_service: RiskService = Depends(get_risk_service),
) -> DetectionService:
    return DetectionService(repository=repo, ml_client=ml_client, risk_service=risk_service)
