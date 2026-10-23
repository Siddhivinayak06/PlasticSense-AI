"""Lightweight in-memory TTL cache for expensive aggregate endpoints."""

import time
import threading
from typing import Any, Optional, Dict, Tuple

_lock = threading.Lock()
_cache: Dict[str, Tuple[Any, float]] = {}


def cache_get(key: str) -> Optional[Any]:
    """Retrieve value from cache if present and not expired."""
    with _lock:
        entry = _cache.get(key)
        if not entry:
            return None
        val, expiry = entry
        if time.time() > expiry:
            del _cache[key]
            return None
        return val


def cache_set(key: str, val: Any, ttl_seconds: int = 30) -> None:
    """Store value in cache with time-to-live in seconds."""
    with _lock:
        _cache[key] = (val, time.time() + ttl_seconds)


def cache_clear() -> None:
    """Clear all cached entries (called when new detection or assignment is created)."""
    with _lock:
        _cache.clear()
