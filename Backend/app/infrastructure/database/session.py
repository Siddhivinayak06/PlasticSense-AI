import logging
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

logger = logging.getLogger("WasteSense_AI")

# Local SQLite file that already holds this project's development data.
_SQLITE_PATH = Path(settings.SQLITE_PATH or Path(__file__).resolve().parents[3] / "wastesense.db").resolve()
SQLITE_URL = f"sqlite:///{_SQLITE_PATH}"


def _build_engine(url: str):
    """Create an engine with transport-appropriate pooling/connect args."""
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False})
    return create_engine(
        url,
        connect_args={
            "sslmode": "require",
            "connect_timeout": 10,
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
        },
        # Supabase's session-mode pooler (port 5432) caps clients per project at the
        # plan's pool size (15 on the smallest tiers). 15+15 could exhaust it and fail
        # with "MaxClientsInSessionMode"; a single local server needs far fewer.
        pool_size=5,
        max_overflow=5,
        pool_recycle=300,
        pool_pre_ping=True,
        pool_timeout=30,
    )


def _resolve_engine():
    """Use the configured database, falling back to local SQLite if unreachable.

    The remote Postgres credentials are frequently absent or expired on a developer
    machine. Previously that aborted application startup entirely. For local work we
    verify connectivity once and fall back to the on-disk SQLite database rather than
    refusing to boot. The failure is logged loudly and surfaced via /health so it can
    never be mistaken for a healthy remote connection.
    """
    if settings.DB_FORCE_SQLITE:
        logger.info("DB_FORCE_SQLITE is set; using local SQLite at %s", _SQLITE_PATH)
        return _build_engine(SQLITE_URL), SQLITE_URL, "sqlite-forced", None

    try:
        configured = settings.database_url
    except RuntimeError as exc:
        logger.warning("No database configured (%s); using local SQLite at %s", exc, _SQLITE_PATH)
        return _build_engine(SQLITE_URL), SQLITE_URL, "sqlite-fallback", str(exc)

    candidate = _build_engine(configured)
    if configured.startswith("sqlite"):
        return candidate, configured, "sqlite", None

    try:
        with candidate.connect() as conn:
            conn.execute(text("SELECT 1"))
        return candidate, configured, "postgres", None
    except Exception as exc:
        # Never log the DSN itself - it carries credentials.
        reason = type(exc).__name__
        logger.error(
            "Configured PostgreSQL database is unreachable (%s). "
            "Falling back to local SQLite at %s. Remote data is NOT in use.",
            reason,
            _SQLITE_PATH,
        )
        candidate.dispose()
        return _build_engine(SQLITE_URL), SQLITE_URL, "sqlite-fallback", reason


engine, database_url, DB_BACKEND, DB_FALLBACK_REASON = _resolve_engine()


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def ping_database() -> dict:
    """Test database connectivity and return latency and connection info."""
    import time
    t0 = time.perf_counter()
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    latency = (time.perf_counter() - t0) * 1000
    pool = engine.pool
    host = engine.url.host  # never the full URL: it carries the password
    return {
        "status": "connected",
        "backend": DB_BACKEND,
        "provider": "supabase" if host and "supabase" in host else ("sqlite" if DB_BACKEND.startswith("sqlite") else "postgresql"),
        "host": host,
        "using_fallback": DB_BACKEND == "sqlite-fallback",
        "fallback_reason": DB_FALLBACK_REASON,
        "latency_ms": round(latency, 2),
        "pool_size": pool.size() if hasattr(pool, "size") else None,
        "checked_out_connections": pool.checkedout() if hasattr(pool, "checkedout") else None,
    }
