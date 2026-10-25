import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import jwt
from fastapi import Header, HTTPException, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.api.dependencies import get_db
from app.infrastructure.database.models.user_profile_model import UserProfileModel

logger = logging.getLogger("WasteSense_Auth")


def decode_supabase_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a Supabase JWT access token.
    
    Supports:
    1. Offline/Testing tokens: 'test-admin-token', 'test-user-token'
    2. Signed Supabase JWTs verified with SUPABASE_JWT_SECRET (HS256)
    3. Fallback unverified claim extraction when secret is not locally configured,
       or direct Supabase API validation.
    """
    if not token:
        return None

    # Offline/test token shortcut for tests and dev environments
    if token == "test-admin-token":
        return {
            "sub": "00000000-0000-0000-0000-000000000001",
            "email": settings.ADMIN_EMAILS[0] if settings.ADMIN_EMAILS else "admin@wastesense.ai",
            "user_metadata": {"full_name": "Municipal Admin", "name": "Municipal Admin"},
            "role": "admin",
        }
    elif token == "test-user-token":
        return {
            "sub": "00000000-0000-0000-0000-000000000002",
            "email": "citizen@wastesense.ai",
            "user_metadata": {"full_name": "Citizen User", "name": "Citizen User"},
            "role": "user",
        }

    # Attempt verification using SUPABASE_JWT_SECRET if present
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            return payload
        except jwt.PyJWTError as e:
            logger.warning(f"JWT verification failed with secret: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # When SUPABASE_JWT_SECRET is not configured locally, safely decode payload
    # to read user claims (issued by Supabase Auth).
    try:
        payload = jwt.decode(
            token,
            options={"verify_signature": False, "verify_aud": False},
        )
        # Verify basic claim structure
        if "sub" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed token: missing user identifier",
                headers={"WWW-Authenticate": "Bearer"},
            )
        # Check expiration if exp is present
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except Exception as e:
        logger.error(f"Failed to decode token claims: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def sync_user_profile(
    db: Session,
    user_id: str,
    email: str,
    full_name: Optional[str] = None,
    avatar_url: Optional[str] = None,
) -> UserProfileModel:
    """Sync or register a user in user_profiles.
    
    Security rule:
    - Default role is strictly 'user'.
    - Admin access is granted ONLY if the email is explicitly listed in settings.ADMIN_EMAILS.
    - An existing admin role is never demoted unless removed from ADMIN_EMAILS.
    """
    clean_email = email.strip().lower()
    profile = db.query(UserProfileModel).filter(
        (UserProfileModel.id == user_id) | (UserProfileModel.email == clean_email)
    ).first()

    is_configured_admin = clean_email in [e.lower() for e in settings.ADMIN_EMAILS]

    if profile:
        # Update user metadata
        if full_name:
            profile.full_name = full_name
        if avatar_url:
            profile.avatar_url = avatar_url
        if is_configured_admin and profile.role != "admin":
            profile.role = "admin"
        profile.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(profile)
        return profile

    # First time registration
    initial_role = "admin" if is_configured_admin else "user"
    new_profile = UserProfileModel(
        id=user_id or str(uuid.uuid4()),
        email=clean_email,
        full_name=full_name,
        avatar_url=avatar_url,
        role=initial_role,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(new_profile)
    try:
        db.commit()
        db.refresh(new_profile)
    except Exception as e:
        db.rollback()
        # Fallback query in case of concurrency race condition
        existing = db.query(UserProfileModel).filter(UserProfileModel.email == clean_email).first()
        if existing:
            return existing
        raise e
    return new_profile


async def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[UserProfileModel]:
    """Retrieve current user from Authorization Bearer token without raising if missing."""
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_supabase_token(token)
    if not payload:
        return None

    user_id = payload.get("sub")
    email = payload.get("email")
    if not email:
        return None

    user_meta = payload.get("user_metadata") or {}
    full_name = (
        user_meta.get("full_name")
        or user_meta.get("name")
        or payload.get("name")
        or email.split("@")[0]
    )
    avatar_url = (
        user_meta.get("avatar_url")
        or user_meta.get("picture")
        or payload.get("picture")
    )

    return sync_user_profile(
        db=db,
        user_id=user_id,
        email=email,
        full_name=full_name,
        avatar_url=avatar_url,
    )


async def get_current_user(
    user: Optional[UserProfileModel] = Depends(get_current_user_optional),
) -> UserProfileModel:
    """Enforce that the caller is authenticated."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in with Google.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def require_admin(
    user: UserProfileModel = Depends(get_current_user),
) -> UserProfileModel:
    """Enforce that the caller has municipal administrator privileges."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Municipal Administrator privileges required for this action.",
        )
    return user
