"""Live (webcam) detection endpoint.

Accepts a single base64-encoded JPEG/PNG frame, runs the same YOLO pipeline used
by the image-upload endpoint, and returns an annotated result.  The endpoint is
intentionally kept lightweight: it does not persist results to the database by
default (to avoid flooding the DB with per-frame records).
"""

import base64
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.dependencies import get_detection_service
from app.api.upload_guard import inference_rate_limit
from app.application.dto.detection_dto import DetectionCreateDTO
from app.application.services.detection_service import DetectionService, ModelUnavailableError
from app.api.v1.routers.detection_router import _to_detection_schema
from app.api.v1.schemas.detection_schema import DetectionSchema
from app.core.logging import logger

router = APIRouter(prefix="/detections/live", tags=["Live Detection"])


class LiveFrameRequest(BaseModel):
    """Payload sent from the browser for each captured frame."""
    frame: str = Field(
        ...,
        description="Base64-encoded image (JPEG or PNG). Data-URL prefix like "
                    "'data:image/jpeg;base64,' is stripped automatically.",
    )
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    persist: bool = Field(
        False,
        description="If true, the detection is saved to the database like a normal upload.",
    )


class LiveDetectionResponse(BaseModel):
    """Slimmed-down response for live mode."""
    detection: DetectionSchema
    frame_id: str


def _decode_frame(raw: str) -> bytes:
    """Strip optional data-URL prefix and decode base64."""
    if "," in raw:
        raw = raw.split(",", 1)[1]
    try:
        return base64.b64decode(raw)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid base64 frame: {exc}",
        )


@router.post(
    "/frame",
    response_model=LiveDetectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyse a single webcam frame",
)
async def analyse_frame(
    body: LiveFrameRequest,
    service: DetectionService = Depends(get_detection_service),
    _limited: None = Depends(inference_rate_limit),
):
    frame_bytes = _decode_frame(body.frame)
    if len(frame_bytes) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Frame payload is too small to be a valid image.",
        )

    frame_id = uuid.uuid4().hex[:12]

    # Determine content type from first bytes
    content_type = "image/jpeg"
    if frame_bytes[:8] == b"\x89PNG\r\n\x1a\n":
        content_type = "image/png"

    dto = DetectionCreateDTO(
        latitude=body.latitude,
        longitude=body.longitude,
        filename=f"live_frame_{frame_id}.jpg",
        content_type=content_type,
        file_bytes=frame_bytes,
        user_id=None,
    )

    try:
        result = service.create_detection(dto)
    except ModelUnavailableError as err:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(err))
    except ValueError as err:
        logger.warning(f"Rejected live frame: {err}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
    except Exception as err:
        logger.error(f"Live detection error: {err}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not process this frame. Please try again.",
        )

    return LiveDetectionResponse(
        detection=_to_detection_schema(result),
        frame_id=frame_id,
    )
