import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.routers import (
    detection_router,
    health,
    risk_router,
    statistics_router,
    model_router,
    ngo_router,
    assignment_router,
)
from app.core.config import settings
from app.core.logging import logger
from app.infrastructure.database.session import Base, engine, SessionLocal
from app.infrastructure.database.seed_data import seed_ngos_and_assignments
import app.infrastructure.database.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.RESULTS_DIR, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    try:
        with SessionLocal() as db:
            seed_ngos_and_assignments(db)
    except Exception as e:
        logger.error(f"Seeding error in lifespan: {e}")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}")



app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS middleware
# Configure CORS middleware (support localhost, 127.0.0.1, and LAN IPs in dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|0\.0\.0\.0)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploaded images and results
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.RESULTS_DIR, exist_ok=True)
app.mount("/media/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/media/results", StaticFiles(directory=settings.RESULTS_DIR), name="results")

# Include Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(model_router.router, prefix=settings.API_V1_STR)
app.include_router(detection_router.router, prefix=settings.API_V1_STR)
app.include_router(risk_router.router, prefix=settings.API_V1_STR)
app.include_router(statistics_router.router, prefix=settings.API_V1_STR)
app.include_router(ngo_router.router, prefix=settings.API_V1_STR)
app.include_router(assignment_router.router, prefix=settings.API_V1_STR)



@app.get("/", include_in_schema=False)
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "detections": f"{settings.API_V1_STR}/detections",
    }
