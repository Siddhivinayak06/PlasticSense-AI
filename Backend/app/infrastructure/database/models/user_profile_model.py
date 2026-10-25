import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.infrastructure.database.session import Base


class UserProfileModel(Base):
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True)  # Supabase auth.users UUID
    google_sub = Column(String(255), unique=True, nullable=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(String(512), nullable=True)
    role = Column(String(32), nullable=False, default="citizen", server_default="citizen")  # 'citizen' or 'admin'
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")
    last_login_at = Column(DateTime(timezone=True), nullable=True)
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

    audit_logs = relationship(
        "RoleAuditLogModel",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class RoleAuditLogModel(Base):
    __tablename__ = "role_audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    changed_by_admin_id = Column(String(36), nullable=False, index=True)
    old_role = Column(String(32), nullable=False)
    new_role = Column(String(32), nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    user = relationship("UserProfileModel", back_populates="audit_logs")
