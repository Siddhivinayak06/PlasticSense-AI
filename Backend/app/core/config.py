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

    # ── Database ──────────────────────────────────────────────────────────────
    # Option A (preferred): set DATABASE_URL to a full Supabase / PostgreSQL URI
    # Option B (fallback): set individual POSTGRES_* variables below
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_DB: str = "wastesense_db"
    DATABASE_URL: Optional[str] = None
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_BUCKET_NAME: str = "images"

    # ── Storage / ML ──────────────────────────────────────────────────────────
    UPLOAD_DIR: str = "media/uploads"
    RESULTS_DIR: str = "media/results"
    MAX_UPLOAD_SIZE_MB: int = 10

    # Dual Model Pipeline paths
    DETECTOR_MODEL_PATH: str = "../Ml-model/handoff_to_cachyos/models/wastesense_detector_best.pt"
    SEGMENTER_MODEL_PATH: str = "../Ml-model/handoff_to_cachyos/models/taco_segmentation_best.pt"
    ARCHIVE_MODEL_PATH: str = "best.pt"
    MODEL_WEIGHTS_PATH: str = "best.pt"  # Legacy backwards compatibility

    # Model inference parameters
    DETECTOR_CONF_THRESHOLD: float = 0.10
    SEGMENTER_CONF_THRESHOLD: float = 0.20
    DETECTOR_IOU_THRESHOLD: float = 0.45
    SEGMENTER_IOU_THRESHOLD: float = 0.50
    CONFIDENCE_THRESHOLD: float = 0.25  # Legacy backwards compatibility
    IOU_THRESHOLD: float = 0.50  # Legacy backwards compatibility
    IMAGE_SIZE: int = 960
    INFERENCE_DEVICE: str = "auto"  # 'auto', 'cuda', 'cpu'

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
