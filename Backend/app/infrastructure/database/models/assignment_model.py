from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.infrastructure.database.session import Base


class CleanupAssignmentModel(Base):
    __tablename__ = "cleanup_assignments"

    id = Column(String(36), primary_key=True)
    title = Column(String(256), nullable=False)
    detection_id = Column(String(36), ForeignKey("detections.id", ondelete="SET NULL"), nullable=True)
    hotspot_id = Column(String(64), nullable=True)
    location_name = Column(String(256), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    priority = Column(String(32), nullable=False, default="medium")  # low, medium, high, urgent
    severity = Column(String(32), nullable=False, default="medium")  # low, medium, high, critical
    risk_score = Column(Float, nullable=False, default=50.0)
    waste_count = Column(Integer, nullable=False, default=0)
    waste_before = Column(Integer, nullable=False, default=0)
    waste_after = Column(Integer, nullable=True)
    waste_reduction_percent = Column(Float, nullable=True)
    status = Column(String(32), nullable=False, default="pending")  # pending, assigned, in_progress, completed, verified, rejected
    ngo_team_id = Column(String(36), ForeignKey("ngo_teams.id", ondelete="SET NULL"), nullable=True)
    ngo_team_name = Column(String(128), nullable=True)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    completed_date = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    before_image_url = Column(String(512), nullable=True)
    after_image_url = Column(String(512), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    detection = relationship("DetectionModel", lazy="selectin")
    ngo_team = relationship("NGOTeamModel", lazy="selectin")
