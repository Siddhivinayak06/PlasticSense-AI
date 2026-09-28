"""
PlasticSense AI — ML Inference Service
Thin FastAPI micro-service that exposes a single /predict endpoint.
The backend calls this over HTTP; it never imports any ML library directly.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException

from app.core.config import settings
from app.inference.detector import PlasticDetector
from app.schemas.predict import PredictResponse

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("plasticsense_ml")

# ── Global detector instance (loaded once at startup) ────────────────────────
detector: PlasticDetector | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global detector
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    detector = PlasticDetector(
        model_path=settings.MODEL_PATH,
        conf_threshold=settings.CONFIDENCE_THRESHOLD,
        iou_threshold=settings.IOU_THRESHOLD,
    )
    logger.info("ML model ready — service accepting requests.")
    yield
    logger.info("Shutting down ML service.")


# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "model_version": settings.MODEL_VERSION,
        "status": "running",
        "predict_endpoint": "/predict",
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": detector is not None,
        "model_version": settings.MODEL_VERSION,
    }


@app.post("/predict", response_model=PredictResponse)
async def predict(file: UploadFile = File(...)):
    """
    Accept a multipart image upload and return YOLO plastic-waste detections.

    Response contract (matches backend YoloMLClient expectations):
    {
        "model_version": "yolo11-plastic-v1.2",
        "detections": [
            {"class_name": "PET_bottle", "confidence": 0.91, "bbox": [x1, y1, x2, y2]}
        ],
        "processing_time_ms": 142
    }
    """
    if detector is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet — try again shortly.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        detections, processing_time_ms = detector.predict(contents)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("Inference failed")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    return PredictResponse(
        model_version=settings.MODEL_VERSION,
        detections=detections,
        processing_time_ms=processing_time_ms,
    )
