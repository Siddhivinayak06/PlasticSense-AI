from datetime import datetime
from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.auth import get_current_user, require_admin, sync_user_profile
from app.infrastructure.database.models.user_profile_model import UserProfileModel

router = APIRouter(prefix="/auth", tags=["Authentication & Roles"])


class UserProfileSchema(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProfileSyncRequest(BaseModel):
    user_id: str
    email: str = Field(min_length=3, max_length=255, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class RoleUpdateRequest(BaseModel):
    role: Literal["user", "admin"]


@router.get("/me", response_model=UserProfileSchema)
async def get_my_profile(
    current_user: UserProfileModel = Depends(get_current_user),
):
    """Return the profile and role of the currently authenticated user."""
    return current_user


@router.post("/sync", response_model=UserProfileSchema)
async def sync_profile(
    payload: ProfileSyncRequest,
    db: Session = Depends(get_db),
    current_user: UserProfileModel = Depends(get_current_user),
):
    """Sync user metadata after first Google OAuth login."""
    # Ensure a user cannot overwrite another user's profile unless admin
    if current_user.id != payload.user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update another user's profile.",
        )

    profile = sync_user_profile(
        db=db,
        user_id=payload.user_id,
        email=payload.email,
        full_name=payload.full_name,
        avatar_url=payload.avatar_url,
    )
    return profile


@router.get("/users", response_model=List[UserProfileSchema])
async def list_users(
    db: Session = Depends(get_db),
    admin: UserProfileModel = Depends(require_admin),
):
    """List all registered users (Municipal Administrator access only)."""
    return db.query(UserProfileModel).order_by(UserProfileModel.created_at.desc()).all()


@router.patch("/users/{user_id}/role", response_model=UserProfileSchema)
async def update_user_role(
    user_id: str,
    payload: RoleUpdateRequest,
    db: Session = Depends(get_db),
    admin: UserProfileModel = Depends(require_admin),
):
    """Promote or demote a user role (Municipal Administrator access only)."""
    target_user = db.query(UserProfileModel).filter(UserProfileModel.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.role = payload.role
    db.commit()
    db.refresh(target_user)
    return target_user
