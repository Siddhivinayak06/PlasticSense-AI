"""Request-level protection for endpoints that accept images and run inference.

* ``read_upload_limited`` reads at most MAX_UPLOAD_SIZE_MB + 1 bytes, so an oversized
  upload is rejected with 413 instead of being pulled fully into memory.
* ``inference_rate_limit`` is a per-client-IP sliding-window limiter. Inference is
  GPU-bound; without a limit one client can monopolise the model. It is in-memory,
  which is correct for this single-process local deployment; a multi-worker
  deployment would need a shared store (e.g. Redis) instead.
"""
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, UploadFile, status

from app.core.config import settings

_WINDOW_SECONDS = 60.0
_lock = threading.Lock()
_hits: dict = defaultdict(deque)


def _max_upload_bytes() -> int:
    return settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


async def read_upload_limited(upload: UploadFile) -> bytes:
    limit = _max_upload_bytes()
    data = await upload.read(limit + 1)
    if len(data) > limit:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB upload limit",
        )
    return data


def _check(key: str, cost: int = 1) -> None:
    limit = settings.INFERENCE_RATE_LIMIT_PER_MINUTE
    if limit <= 0:
        return
    now = time.monotonic()
    with _lock:
        window = _hits[key]
        while window and now - window[0] > _WINDOW_SECONDS:
            window.popleft()
        if len(window) + cost > limit:
            retry_after = max(1, int(_WINDOW_SECONDS - (now - window[0]))) if window else 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many analysis requests. Limit is {limit} images per minute.",
                headers={"Retry-After": str(retry_after)},
            )
        window.extend([now] * cost)


def inference_rate_limit(request: Request) -> None:
    client = request.client.host if request.client else "unknown"
    _check(client)


def charge_rate_limit(request: Request, cost: int) -> None:
    """Charge additional units, e.g. one per extra image in a batch."""
    if cost > 0:
        client = request.client.host if request.client else "unknown"
        _check(client, cost)


def reset_rate_limits() -> None:
    """Test hook."""
    with _lock:
        _hits.clear()
