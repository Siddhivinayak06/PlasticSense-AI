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
        "pipeline": "Modular Waste Inference Pipeline",
        "device": f"cuda ({device_name})" if cuda_available else "cpu",
        "detector": {
            # Architecture is read from the loaded checkpoint, never hardcoded: the
            # previous static "YOLO11s" string survived a model swap and misreported
            # a YOLOv8n checkpoint for weeks.
            "name": getattr(detector, "model_name", "detector"),
            "architecture": getattr(detector, "architecture", "unknown"),
            "task": "object_detection",
            "model_path": getattr(detector, "model_path", settings.DETECTOR_MODEL_PATH),
            "classes": getattr(detector, "class_names", {}),
            "parameters": getattr(detector, "param_count", None),
            "confidence_threshold": settings.DETECTOR_CONF_THRESHOLD,
            "iou_threshold": settings.DETECTOR_IOU_THRESHOLD,
            "provenance": getattr(detector, "provenance", None),
        },
        "segmenter": {
            "name": getattr(segmenter, "model_name", "segmenter"),
            "architecture": getattr(segmenter, "architecture", "unknown"),
            "task": "instance_segmentation",
            "model_path": getattr(segmenter, "model_path", settings.SEGMENTER_MODEL_PATH),
            "classes": getattr(segmenter, "class_names", {}),
            "parameters": getattr(segmenter, "param_count", None),
            "confidence_threshold": settings.SEGMENTER_CONF_THRESHOLD,
            "iou_threshold": settings.SEGMENTER_IOU_THRESHOLD,
            "provenance": getattr(segmenter, "provenance", None),
        },
        "image_size": settings.IMAGE_SIZE,
        "capabilities": {
            "item_detection": True,
            "material_instance_segmentation": True,
            "waste_area_estimation": "indicative_heuristic",
            "resin_polymer_identification": False,
            "waste_mass_estimation": False,
            "hotspot_forecasting": False,
        },
    }
