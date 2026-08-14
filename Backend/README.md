# PlasticSense AI — Backend (General Waste Detection)

FastAPI backend for the PlasticSense AI platform, implementing Clean Architecture across four
concentric layers: Domain → Application → Infrastructure → API. It features local YOLO11 inference for general waste detection and automated image annotation.

---

## 📁 Folder Structure

```
Backend/
├── app/
│   ├── main.py                     # FastAPI app entrypoint, routers, lifespan, CORS
│   │
│   ├── core/                       # Cross-cutting concerns (no business logic)
│   │   ├── config.py               # Pydantic BaseSettings — reads .env, exposes settings singleton
│   │   └── logging.py              # Centralized structured logger (plasticsense logger)
│   │
│   ├── domain/                     # ── INNERMOST LAYER — pure Python, zero framework imports ──
│   │   ├── entities/
│   │   │   ├── detection.py        # Detection + DetectionItem dataclasses
│   │   │   └── location.py         # Location value object with coordinate validation
│   │
│   ├── application/                # ── USE CASES — depends only on domain ──
│   │   ├── interfaces/
│   │   │   └── i_detection_repository.py   # Abstract port: save / get_by_id / get_all
│   │   ├── services/
│   │   │   └── detection_service.py        # Orchestrates create / list / get; validates input
│   │   └── dto/
│   │       └── detection_dto.py            # DetectionCreateDTO, DetectionResponseDTO, DetectionItemDTO
│   │
│   ├── infrastructure/             # ── OUTER LAYER — real implementations ──
│   │   ├── database/
│   │   │   ├── session.py          # SQLAlchemy engine + SessionLocal + Base
│   │   │   ├── models/
│   │   │   │   └── detection_model.py  # DetectionModel + DetectionItemModel ORM classes
│   │   │   └── repositories/
│   │   │       └── detection_repository.py # Implements IDetectionRepository via SQLAlchemy
│   │   ├── ml_client/              
│   │   │   └── local_yolo_client.py # LocalYoloMLClient — runs ultralytics locally and plots boxes
│   │   └── external/
│   │       └── storage_client.py   # LocalStorageClient — saves uploaded/annotated images to /media
│   │
│   └── api/                        # ── PRESENTATION LAYER — depends on application ──
│       ├── dependencies.py         # DI wiring: get_db → get_detection_repository → get_detection_service
│       └── v1/
│           ├── routers/
│           │   ├── health.py           # GET /api/v1/health, GET /api/v1/model/info
│           │   ├── detection_router.py # POST + GET /api/v1/detections, GET /api/v1/detections/{id}
│           │   └── statistics_router.py # GET /api/v1/statistics, GET /api/v1/dashboard/summary
│           └── schemas/
│               └── detection_schema.py # Pydantic request/response schemas + response envelope
│
├── alembic/                        # Database migration files
│   ├── env.py                      # Alembic runtime environment (reads settings.database_url)
│   ├── script.py.mako              # Migration file template
│   └── versions/
│       └── 001_initial_detection_schema.py  # Initial migration: creates detections + detection_items
│
├── tests/
│   ├── unit/                       # (Sprint 3+) Domain + Application layer tests, no DB/network
│   └── integration/                # (Sprint 3+) Repository, ML client, API route tests
│
├── media/                          # Local image storage (results and uploads)
├── alembic.ini                     # Alembic configuration
├── requirements.txt                # All production Python dependencies
├── .env                            # Local environment variables (never committed to git)
└── .env.example                    # Template — copy to .env and fill in your values
```

---

## ⚙️ Configuration

All configuration is loaded from `.env` via Pydantic `BaseSettings`. **No credentials are
hardcoded** anywhere in the application.

Copy the template and set your values:
```bash
cp .env.example .env
```

Key variables:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | *(see below)* | Full database URL (overrides individual POSTGRES_* vars) |
| `POSTGRES_SERVER` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_USER` | `postgres` | Database user |
| `POSTGRES_PASSWORD` | *(required)* | Database password |
| `POSTGRES_DB` | `plasticsense_db` | Database name |
| `ENVIRONMENT` | `development` | `development` or `production` |
| `LOG_LEVEL` | `INFO` | Logging level |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed frontend origins |
| `UPLOAD_DIR` | `media/uploads` | Local folder for uploaded images |
| `RESULTS_DIR` | `media/results` | Local folder for annotated output images |
| `MODEL_PATH` | `models/best.pt` | Path to trained YOLO11 weights |
| `MAX_UPLOAD_SIZE_MB` | `10` | Maximum upload size limit |

**PostgreSQL (required for Sprint 2):**
```
DATABASE_URL="postgresql://user:password@host:5432/plasticsense_db"
```

---

## 🚀 Setup & Running

### 1. Create virtual environment
```powershell
cd Backend
py -m venv .venv
.\.venv\Scripts\activate        # Windows PowerShell
```

### 2. Install dependencies
```powershell
.\.venv\Scripts\pip.exe install -r requirements.txt
```

### 3. Configure environment
```powershell
copy .env.example .env
# Edit .env with your database credentials
```

### 4. Run database migrations
```powershell
.\.venv\Scripts\alembic.exe upgrade head
```
This creates the `detections` and `detection_items` tables in PostgreSQL.

### 5. Start the server
```powershell
.\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
```

**API is live at:** http://127.0.0.1:8000  
**Swagger UI:** http://127.0.0.1:8000/docs  
**ReDoc:** http://127.0.0.1:8000/redoc  

---

## 🗄️ Database Migrations (Alembic)

All schema changes are version-controlled through Alembic migrations.

```powershell
# Apply all pending migrations
.\venv\Scripts\alembic.exe upgrade head

# Check current revision
.\venv\Scripts\alembic.exe current

# View migration history
.\venv\Scripts\alembic.exe history

# Create a new migration (auto-detect changes from models)
.\venv\Scripts\alembic.exe revision --autogenerate -m "your description"

# Rollback one step
.\venv\Scripts\alembic.exe downgrade -1
```

---

## 📡 API Endpoints (Sprint 2)

All endpoints follow the response envelope `{ data, meta, error }`.

### Health Check
```
GET /api/v1/health
```
Returns service name, version, environment, and server timestamp.

### Create Detection
```
POST /api/v1/detections
Content-Type: multipart/form-data

Fields:
  latitude    float   required   GPS latitude (-90 to 90)
  longitude   float   required   GPS longitude (-180 to 180)
  image       file    required   JPG, PNG, or WEBP image

Response 201:
{
  "data": {
    "id": "uuid",
    "image_url": "/static/uploads/filename.jpg",
    "annotated_image_url": "/static/results/filename_annotated.jpg",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "model_version": "v1.0",
    "detection_status": "completed",
    "processing_time_ms": 254,
    "summary": {
      "total_objects": 2,
      "plastic": 1,
      "metal": 1
    },
    "items": [
      {
        "id": "uuid",
        "class_name": "PET_bottle",
        "waste_group": "plastic",
        "confidence": 0.95,
        "bbox_x": 100.0,
        "bbox_y": 150.0,
        "bbox_w": 50.0,
        "bbox_h": 200.0
      }
    ],
    "created_at": "2026-07-26T08:51:04.934799"
  },
  "meta": null,
  "error": null
}
```

### List Detections
```
GET /api/v1/detections?page=1&limit=10

Response 200:
{
  "data": [ ...DetectionSchema... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total_items": 42,
    "total_pages": 5
  },
  "error": null
}
```

### Get Single Detection
```
GET /api/v1/detections/{id}

Response 200: { "data": DetectionSchema, "meta": null, "error": null }
Response 404: { "detail": "Detection '{id}' not found" }
```

---

## 🔄 POST /api/v1/detections — Request Lifecycle

```
HTTP Request (multipart/form-data: latitude, longitude, image file)
        │
        ▼
[FastAPI Router: detection_router.py]
  • Deserializes form fields and UploadFile
  • Calls get_detection_service() via DI
        │
        ▼
[DI: api/dependencies.py]
  • get_db()          → opens SQLAlchemy Session (request-scoped)
  • get_detection_repository(db)  → DetectionRepository(db)
  • get_detection_service(repo)   → DetectionService(repository, storage_client)
        │
        ▼
[DetectionService.create_detection(dto)]  ← Application Layer
  1. Validates coordinates via Location value object (raises ValueError if out of range)
  2. Validates file size (raises ValueError if > MAX_UPLOAD_SIZE_MB)
  3. Validates file extension / MIME type (raises ValueError if not JPG/PNG/WEBP)
  4. Calls LocalStorageClient.save_file() → writes bytes to media/uploads/ folder
  5. Synchronously calls YoloMLClient.predict(image_path) which performs inference and saves annotated image to media/results/
  6. Constructs Detection domain entity with status="completed" and items
  7. Calls IDetectionRepository.save(detection)
        │
        ▼
[DetectionRepository.save(detection)]  ← Infrastructure Layer
  • Maps Detection domain entity → DetectionModel ORM object
  • Maps DetectionItem list → DetectionItemModel list (empty in this sprint)
  • db.add(model), db.commit(), db.refresh(model)
  • Maps ORM result back to domain entity and returns it
        │
        ▼
[DetectionService._to_dto(detection)]
  • Converts domain entity → DetectionResponseDTO
        │
        ▼
[detection_router.py]
  • Converts DTO → DetectionSchema (Pydantic model for serialization)
  • Wraps in SingleDetectionEnvelope { data, meta: null, error: null }
  • Returns HTTP 201 Created
```

---

## 🖼️ Image Storage

Images are stored **locally** in the `media/` folder under the `Backend/` directory.

- Each uploaded file is saved with a UUID-based filename (e.g. `media/uploads/c9114b2a.jpg`).
- The YOLO model produces an annotated image which is saved to `media/results/c9114b2a.jpg`.
- The stored `image_url` and `annotated_image_url` paths are served as static files by FastAPI via `StaticFiles`.
- This is a **placeholder implementation**. In a later sprint, `storage_client.py` will be replaced by a cloud provider adapter (e.g., AWS S3, Google Cloud Storage) — only this one file changes, nothing else.

---

## 🗃️ Schema

### `detections` table
| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(36) | UUID primary key |
| `image_url` | VARCHAR(512) | Relative path to stored image |
| `annotated_image_url` | VARCHAR(512) | Relative path to backend-annotated image |
| `latitude` | FLOAT | GPS latitude |
| `longitude` | FLOAT | GPS longitude |
| `model_version` | VARCHAR(64) | ML model version tag |
| `detection_status` | VARCHAR(32) | State machine: `pending` → `processing` → `completed` / `failed` |
| `processing_time_ms` | INTEGER | Milliseconds taken for YOLO inference |
| `summary` | JSONB | Summary breakdown of detected waste |
| `created_at` | DATETIME | UTC timestamp |

### `detection_items` table
| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(36) | UUID primary key |
| `detection_id` | VARCHAR(36) | FK → `detections.id` (CASCADE DELETE) |
| `class_name` | VARCHAR(100) | YOLO specific class name (e.g. `PET_bottle`, `can`) |
| `waste_group` | VARCHAR(50) | Mapped generic category (e.g. `plastic`, `metal`) |
| `confidence` | FLOAT | Model confidence score (0.0–1.0) |
| `bbox_x/y/w/h` | FLOAT | Bounding box coordinates |

---

## 📦 Dependencies

| Package | Purpose |
|---|---|
| `fastapi` | Web framework + automatic OpenAPI docs |
| `uvicorn[standard]` | ASGI server |
| `pydantic` + `pydantic-settings` | Data validation + settings from `.env` |
| `python-dotenv` | `.env` file loading |
| `sqlalchemy` | ORM and database abstraction |
| `alembic` | Database migration management |
| `psycopg2-binary` | PostgreSQL adapter (for production) |
| `python-multipart` | Multipart form data parsing for file uploads |

---

## ML Pipeline (YOLO Integration)

The backend natively runs YOLO11 via the `ultralytics` package. `LocalYoloMLClient` handles inference and bounding box plotting directly in the `application` layer.

The client normalizes `[x1, y1, x2, y2]` into the persisted `bbox_x`, `bbox_y`, `bbox_w`, and `bbox_h` fields, while automatically mapping granular YOLO class names (like `PET_bottle`) into generic frontend categories (`plastic`, `metal`, `glass`) via `waste_mapping.json`.

`POST /api/v1/detections` is fully synchronous. It receives an image, saves it, performs ML inference, plots bounding boxes to a new image file, saves the new image, updates all metadata, calculates summaries, and persists to PostgreSQL before returning a `201 Created` response.

The backend acts as the single source of truth for detections and classifications, ensuring any Next.js frontend or Mobile app does not have to reproduce complex logic.
