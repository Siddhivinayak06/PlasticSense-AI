from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.infrastructure.database.session import Base


class DetectionModel(Base):
    __tablename__ = "detections"

    id = Column(String(36), primary_key=True)
    image_url = Column(String(512), nullable=False)
    annotated_image_url = Column(String(512), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_source = Column(String(50), nullable=True)
    location_confidence = Column(Float, nullable=True)
    model_version = Column(String(64), nullable=False, default="v1.0")
    detection_status = Column(String(32), nullable=False, default="pending")
    failure_reason = Column(String(512), nullable=True)
    processing_time_ms = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    items = relationship(
        "DetectionItemModel",
        back_populates="detection",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    risk_assessment = relationship(
        "RiskAssessmentModel",
        back_populates="detection",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class DetectionItemModel(Base):
    __tablename__ = "detection_items"

    id = Column(String(36), primary_key=True)
    detection_id = Column(String(36), ForeignKey("detections.id", ondelete="CASCADE"), nullable=False)
    class_name = Column(String(128), nullable=False, default="unknown")
    waste_group = Column(String(64), nullable=False, default="unknown")
    confidence = Column(Float, nullable=False)
    bbox_x = Column(Float, nullable=False)
    bbox_y = Column(Float, nullable=False)
    bbox_w = Column(Float, nullable=False)
    bbox_h = Column(Float, nullable=False)
    waste_type = Column(String(128), nullable=False, default="unknown")

    detection = relationship("DetectionModel", back_populates="items")
