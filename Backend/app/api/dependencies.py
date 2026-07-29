from typing import Generator
from fastapi import Depends
from sqlalchemy.orm import Session
from app.application.services.detection_service import DetectionService
from app.application.services.risk_service import RiskService
from app.infrastructure.database.repositories.detection_repository import DetectionRepository
from app.infrastructure.database.repositories.risk_repository import RiskRepository
from app.infrastructure.database.session import SessionLocal
from app.infrastructure.ml_client.yolo_ml_client import YoloMLClient


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


def get_ml_client() -> YoloMLClient:
    return YoloMLClient()


def get_detection_service(
    repo: DetectionRepository = Depends(get_detection_repository),
    ml_client: YoloMLClient = Depends(get_ml_client),
    risk_service: RiskService = Depends(get_risk_service),
) -> DetectionService:
    return DetectionService(repository=repo, ml_client=ml_client, risk_service=risk_service)
