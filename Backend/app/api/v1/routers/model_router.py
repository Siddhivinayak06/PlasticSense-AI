from fastapi import APIRouter, Depends
import torch
from app.api.dependencies import get_waste_detector, get_waste_segmenter
from app.application.interfaces.i_waste_detector import IWasteDetector
from app.application.interfaces.i_waste_segmenter import IWasteSegmenter
from app.core.config import settings

router = APIRouter(prefix="/model", tags=["Model"])


@router.get(
    "/info",
    summary="Get current ML dual-model configuration and parameters",
)
async def get_model_info(
    detector: IWasteDetector = Depends(get_waste_detector),
    segmenter: IWasteSegmenter = Depends(get_waste_segmenter),
):
    cuda_available = torch.cuda.is_available()
    device_name = torch.cuda.get_device_name(0) if cuda_available else "CPU"

    return {
        "pipeline": "Dual-Model Waste Inference Pipeline",
        "device": f"cuda ({device_name})" if cuda_available else "cpu",
        "detector": {
            "name": "Custom PlasticSense Detector",
            "architecture": "YOLO11s",
            "task": "object_detection",
            "model_path": getattr(detector, "model_path", settings.DETECTOR_MODEL_PATH),
            "classes": getattr(detector, "class_names", {}),
            "confidence_threshold": settings.DETECTOR_CONF_THRESHOLD,
            "iou_threshold": settings.DETECTOR_IOU_THRESHOLD,
        },
        "segmenter": {
            "name": "Pretrained TACO Waste Segmenter",
            "architecture": "YOLO11s-seg",
            "task": "instance_segmentation",
            "model_path": getattr(segmenter, "model_path", settings.SEGMENTER_MODEL_PATH),
            "classes": getattr(segmenter, "class_names", {}),
            "confidence_threshold": settings.SEGMENTER_CONF_THRESHOLD,
            "iou_threshold": settings.SEGMENTER_IOU_THRESHOLD,
        },
        "image_size": settings.IMAGE_SIZE,
    }
