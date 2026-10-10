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

@router.get("/config", summary="System UI and Data Configuration")
async def system_config():
    """
    Returns system configuration including waste grouping colors and categories mapping.
    """
    return {
        "waste_groups": {
            "plastic": {
                "color": "border-sky-500/30 bg-sky-500/5 text-sky-600 dark:text-sky-400",
                "hex": "#0ea5e9"
            },
            "glass": {
                "color": "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
                "hex": "#10b981"
            },
            "metal": {
                "color": "border-slate-500/30 bg-slate-500/5 text-slate-600 dark:text-slate-400",
                "hex": "#64748b"
            },
            "paper": {
                "color": "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
                "hex": "#f59e0b"
            },
            "cardboard": {
                "color": "border-orange-500/30 bg-orange-500/5 text-orange-600 dark:text-orange-400",
                "hex": "#f97316"
            },
            "hazardous": {
                "color": "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400",
                "hex": "#ef4444"
            },
            "other": {
                "color": "border-border/50 bg-muted/20 text-muted-foreground",
                "hex": "#9ca3af"
            }
        }
    }
