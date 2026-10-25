from datetime import datetime
from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.auth import get_current_user, require_admin, sync_user_profile
from app.infrastructure.database.models.user_profile_model import UserProfileModel, RoleAuditLogModel

router = APIRouter(prefix="/auth", tags=["Authentication & Roles"])


class UserProfileSchema(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    google_sub: Optional[str] = None
    role: str
    is_active: bool = True
    last_login_at: Optional[datetime] = None
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
    role: Literal["citizen", "admin", "user"]
    reason: Optional[str] = Field(None, max_length=500)


class StatusUpdateRequest(BaseModel):
    is_active: bool
    reason: Optional[str] = Field(None, max_length=500)


class RoleAuditLogSchema(BaseModel):
    id: str
    user_id: str
    changed_by_admin_id: Optional[str] = None
    old_role: Optional[str] = None
    new_role: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


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

    new_role = "citizen" if payload.role == "user" else payload.role
    old_role = target_user.role

    # Prevent demoting the sole active administrator
    if admin.id == target_user.id and new_role != "admin":
        other_admins = (
            db.query(UserProfileModel)
            .filter(
                UserProfileModel.role == "admin",
                UserProfileModel.is_active == True,
                UserProfileModel.id != admin.id,
            )
            .count()
        )
        if other_admins == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the sole active administrator. Promote another administrator first.",
            )

    target_user.role = new_role
    audit_entry = RoleAuditLogModel(
        user_id=target_user.id,
        changed_by_admin_id=admin.id,
        old_role=old_role,
        new_role=new_role,
        reason=payload.reason or f"Role changed from {old_role} to {new_role} by {admin.email}",
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(target_user)
    return target_user


@router.patch("/users/{user_id}/status", response_model=UserProfileSchema)
async def update_user_status(
    user_id: str,
    payload: StatusUpdateRequest,
    db: Session = Depends(get_db),
    admin: UserProfileModel = Depends(require_admin),
):
    """Activate or deactivate a user account (Municipal Administrator access only)."""
    target_user = db.query(UserProfileModel).filter(UserProfileModel.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent deactivating own account if sole active admin
    if admin.id == target_user.id and not payload.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own administrator account.",
        )

    target_user.is_active = payload.is_active
    audit_entry = RoleAuditLogModel(
        user_id=target_user.id,
        changed_by_admin_id=admin.id,
        old_role=target_user.role,
        new_role=target_user.role,
        reason=payload.reason or f"Account status set to {'active' if payload.is_active else 'inactive'} by {admin.email}",
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(target_user)
    return target_user


@router.get("/audit-logs", response_model=List[RoleAuditLogSchema])
async def list_audit_logs(
    db: Session = Depends(get_db),
    admin: UserProfileModel = Depends(require_admin),
):
    """Retrieve RBAC and account governance audit history (Municipal Administrator only)."""
    return (
        db.query(RoleAuditLogModel)
        .order_by(RoleAuditLogModel.created_at.desc())
        .limit(100)
        .all()
    )
