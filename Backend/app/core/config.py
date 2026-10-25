from typing import List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "WasteSense AI Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    # Optional extra origins matched by regex. Empty by default: only the explicit
    # CORS_ORIGINS above may call the API from a browser.
    CORS_ORIGIN_REGEX: Optional[str] = None

    # ── Abuse protection ──────────────────────────────────────────────────────
    # Per-client-IP limit on endpoints that run model inference (GPU-bound).
    INFERENCE_RATE_LIMIT_PER_MINUTE: int = 30
    MAX_BATCH_FILES: int = 10
    # Reject images whose decoded size exceeds this many pixels (decompression bombs).
    MAX_IMAGE_PIXELS: int = 64_000_000
    # Seed fictional NGO teams/assignments into an EMPTY database at startup.
    # Off by default so demo records are never mixed into real data silently.
    SEED_SAMPLE_DATA: bool = False

    # ── Database ──────────────────────────────────────────────────────────────
    # Option A (preferred): set DATABASE_URL to a full Supabase / PostgreSQL URI
    # Option B (fallback): set individual POSTGRES_* variables below
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_DB: str = "wastesense_db"
    DATABASE_URL: Optional[str] = None
    # Set true to always use the local SQLite file, ignoring DATABASE_URL.
    # When false, an unreachable DATABASE_URL falls back to SQLite automatically.
    DB_FORCE_SQLITE: bool = False
    # Location of the SQLite fallback/forced database. Defaults to Backend/wastesense.db.
    SQLITE_PATH: Optional[str] = None
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_JWT_SECRET: Optional[str] = None
    SUPABASE_BUCKET_NAME: str = "images"
    # Municipal Administrator emails with elevated management privileges.
    ADMIN_EMAILS: List[str] = ["bipinkuruvilla134@gmail.com"]

    # ── Storage / ML ──────────────────────────────────────────────────────────
    UPLOAD_DIR: str = "media/uploads"
    RESULTS_DIR: str = "media/results"
    MAX_UPLOAD_SIZE_MB: int = 10

    # ── Model pipeline paths ──────────────────────────────────────────────────
    # Model selection rationale and evidence: docs/MODEL_SELECTION.md
    # Detector  = BiaEye YOLO11s (6-class: plastic/paper/glass/metal/organic/bulky).
    #             Produces 30+ detections per dumpsite image vs 2-4 for the previous
    #             22-class YOLOv8n which also mislabelled plastic as scrap_paper.
    #             Rollback: change DETECTOR_MODEL_PATH to "best_22cls_original.pt".
    # Segmenter = YOLO11s-seg TACO 5-material model, run at its native 960px.
    DETECTOR_MODEL_PATH: str = "models/external/biaeye-yolo11s/best.pt"
    SEGMENTER_MODEL_PATH: str = "taco_segmentation_best.pt"
    ARCHIVE_MODEL_PATH: str = "best.pt"
    MODEL_WEIGHTS_PATH: str = "best.pt"  # Legacy backwards compatibility

    # Model inference parameters
    # High-recall configuration: 0.18 captures dense, weathered dumpsite waste
    # that clusters in the 0.18-0.30 confidence band, while containment deduplication
    # (IoM >= 0.80) suppresses redundant duplicate boxes without losing separate items.
    DETECTOR_CONF_THRESHOLD: float = 0.18
    SEGMENTER_CONF_THRESHOLD: float = 0.25
    DETECTOR_IOU_THRESHOLD: float = 0.45
    SEGMENTER_IOU_THRESHOLD: float = 0.50
    CONFIDENCE_THRESHOLD: float = 0.25  # Legacy backwards compatibility
    IOU_THRESHOLD: float = 0.45  # Legacy backwards compatibility
    IMAGE_SIZE: int = 960
    INFERENCE_DEVICE: str = "auto"  # 'auto', 'cuda', 'mps', 'cpu'

    # ── Risk Engine Parameters (Phase 5) ──────────────────────────────────────
    RISK_WEIGHT_COVERAGE: float = 0.35
    RISK_WEIGHT_DENSITY: float = 0.25
    RISK_WEIGHT_COMPOSITION: float = 0.20
    RISK_WEIGHT_HAZARD: float = 0.20

    RISK_COVERAGE_SATURATION_PCT: float = 30.0  # 30% coverage = 100 pts
    RISK_DENSITY_SATURATION_COUNT: int = 25     # 25 objects = 100 pts

    # Severity score cutoffs (0-100 scale)
    RISK_THRESHOLD_MODERATE: float = 25.0
    RISK_THRESHOLD_HIGH: float = 50.0
    RISK_THRESHOLD_CRITICAL: float = 75.0


    @property
    def database_url(self) -> str:
        """Return a ready-to-use SQLAlchemy connection URL."""
        if self.DATABASE_URL:
            # Supabase (and other cloud providers) sometimes give a URL starting
            # with "postgres://" — SQLAlchemy 2.x requires "postgresql://".
            url = self.DATABASE_URL
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+psycopg2://", 1)
            elif url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
            elif url.startswith("postgresql+psycopg://"):
                url = url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)

            # Ensure sslmode=require for Supabase cloud connections
            if "supabase.com" in url or "supabase.co" in url:
                if "sslmode" not in url:
                    sep = "&" if "?" in url else "?"
                    url = f"{url}{sep}sslmode=require"
            return url

        # Fallback: build URL from individual vars
        if not self.POSTGRES_PASSWORD:
            raise RuntimeError(
                "No database configured. Set DATABASE_URL (Supabase URI) "
                "or POSTGRES_PASSWORD in your .env file."
            )
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    @field_validator("ADMIN_EMAILS", mode="before")
    @classmethod
    def assemble_admin_emails(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip().lower() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(i).strip().lower() for i in v if str(i).strip()]
        return ["bipinkuruvilla134@gmail.com"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()


def resolve_model_path(target_path: str) -> str:
    """Resolve a model path relative to CWD, Backend root, or project root."""
    from pathlib import Path
    p = Path(target_path)
    if p.is_absolute() and p.exists():
        return str(p)
    if p.exists():
        return str(p.resolve())

    # Path relative to Backend directory
    backend_dir = Path(__file__).resolve().parent.parent.parent
    cand1 = backend_dir / target_path
    if cand1.exists():
        return str(cand1.resolve())

    # Path relative to project root
    repo_dir = backend_dir.parent
    cand2 = repo_dir / target_path
    if cand2.exists():
        return str(cand2.resolve())

    # Search by filename in known model directories
    filename = p.name
    cand3 = repo_dir / "Ml-model" / "handoff_to_cachyos" / "models" / filename
    if cand3.exists():
        return str(cand3.resolve())

    cand4 = backend_dir / filename
    if cand4.exists():
        return str(cand4.resolve())

    cand5 = backend_dir / "models" / filename
    if cand5.exists():
        return str(cand5.resolve())

    return str(p)


def resolve_inference_device(preferred: Optional[str] = None) -> str:
    """Resolve the optimal device for PyTorch / YOLO inference (CUDA, Apple Silicon MPS, or CPU)."""
    import torch
    target = preferred or settings.INFERENCE_DEVICE
    if not target or target.lower() == "auto":
        if torch.cuda.is_available():
            return "cuda:0"
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
        return "cpu"
    return target

