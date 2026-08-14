from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", summary="System Health Check")
async def health_check():
    """
    Health check endpoint returning system status and metadata.
    """
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "model_loaded": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

