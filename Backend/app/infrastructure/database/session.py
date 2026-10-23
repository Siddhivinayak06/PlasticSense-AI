from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

database_url = settings.database_url

connect_args = {}
if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    connect_args = {
        "sslmode": "require",
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }


engine_kwargs = {
    "connect_args": connect_args,
}
if not database_url.startswith("sqlite"):
    engine_kwargs.update({
        "pool_size": 15,
        "max_overflow": 15,
        "pool_recycle": 300,
        "pool_pre_ping": True,
        "pool_timeout": 30,
    })

engine = create_engine(database_url, **engine_kwargs)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def ping_database() -> dict:
    """Test database connectivity and return latency and connection info."""
    import time
    from sqlalchemy import text
    t0 = time.perf_counter()
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    latency = (time.perf_counter() - t0) * 1000
    pool = engine.pool
    return {
        "status": "connected",
        "latency_ms": round(latency, 2),
        "pool_size": pool.size() if hasattr(pool, "size") else None,
        "checked_out_connections": pool.checkedout() if hasattr(pool, "checkedout") else None,
    }
