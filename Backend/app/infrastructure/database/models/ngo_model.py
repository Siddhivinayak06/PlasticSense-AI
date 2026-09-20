from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON
from sqlalchemy.dialects.postgresql import JSONB

from app.infrastructure.database.session import Base


class NGOTeamModel(Base):
    __tablename__ = "ngo_teams"

    id = Column(String(36), primary_key=True)
    name = Column(String(128), nullable=False)
    city = Column(String(64), nullable=False)
    state = Column(String(64), nullable=False)
    contact_person = Column(String(128), nullable=False)
    email = Column(String(128), nullable=False)
    phone = Column(String(32), nullable=False)
    team_size = Column(Integer, nullable=False, default=10)
    active_assignments = Column(Integer, nullable=False, default=0)
    completed_cleanups = Column(Integer, nullable=False, default=0)
    availability = Column(String(32), nullable=False, default="available")  # available, busy, unavailable
    current_workload = Column(String(32), nullable=False, default="light")  # light, moderate, heavy, overloaded
    performance_score = Column(Integer, nullable=False, default=85)
    avg_completion_days = Column(Float, nullable=False, default=3.0)
    specializations = Column(JSONB().with_variant(JSON(), "sqlite"), nullable=False, default=list)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
