from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/model", tags=["Model"])

@router.get(
    "/info",
    summary="Get current ML model configuration and parameters",
)
async def get_model_info():
    # In a real scenario, you could query the MLClient for actual loaded model classes.
    # We will return the configured parameters.
    return {
        "model": "YOLO11",
        "version": "v1.0-yolov11",
        "classes": [], # the client could populate this
        "confidence_threshold": settings.CONFIDENCE_THRESHOLD,
        "image_size": settings.IMAGE_SIZE,
        "device": "cpu" # Defaulting to cpu unless checking torch.cuda
    }
