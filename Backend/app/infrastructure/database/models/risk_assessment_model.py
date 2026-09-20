from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.infrastructure.database.session import Base


class RiskAssessmentModel(Base):
    __tablename__ = "risk_assessments"

    id = Column(String(36), primary_key=True)
    detection_id = Column(
        String(36),
        ForeignKey("detections.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    score = Column(Float, nullable=False)
    level = Column(String(16), nullable=False)
    strategy_breakdown = Column(JSONB().with_variant(JSON(), "sqlite"), nullable=False)
    computed_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    detection = relationship("DetectionModel", back_populates="risk_assessment")
