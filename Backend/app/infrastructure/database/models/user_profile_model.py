from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from app.infrastructure.database.session import Base


class UserProfileModel(Base):
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True)  # Supabase auth.users UUID
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(String(512), nullable=True)
    role = Column(String(32), nullable=False, default="user", server_default="user")  # 'user' or 'admin'
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
