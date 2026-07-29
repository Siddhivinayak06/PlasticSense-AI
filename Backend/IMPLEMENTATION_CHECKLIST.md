# PlasticSense AI — Backend Implementation Checklist

## Sprint 1 — Foundation ✅ COMPLETED

- [x] Clean Architecture folder structure created (domain, application, infrastructure, api, core)
- [x] `app/core/config.py` — Pydantic BaseSettings, .env loading
- [x] `app/core/logging.py` — structured logger
- [x] `app/main.py` — FastAPI app, CORS middleware, lifespan context
- [x] `GET /api/v1/health` endpoint
- [x] `requirements.txt`, `.env`, `.env.example`
- [x] All `__init__.py` package markers in place
- [x] Server starts and Health endpoint returns 200

---

## Sprint 2 — Database, Domain, Detection API ✅ COMPLETED

### Database
- [x] PostgreSQL connection configured via environment variables (no hardcoded credentials)
- [x] `app/infrastructure/database/session.py` — SQLAlchemy engine, SessionLocal, Base
- [x] Alembic configured (`alembic.ini`, `alembic/env.py`, `alembic/script.py.mako`)
- [x] Initial migration created: `alembic/versions/001_initial_detection_schema.py`
- [x] Migration runs cleanly: creates `detections` and `detection_items` tables
- [x] Request-scoped session via `get_db()` dependency (not a global session)

### Domain Layer
- [x] `app/domain/enums/waste_type.py` — WasteType enum (PET_bottle, plastic_bag, food_wrapper, styrofoam, multilayer, other)
- [x] `app/domain/entities/location.py` — Location value object with lat/lng validation
- [x] `app/domain/entities/detection.py` — Detection + DetectionItem dataclasses

### Infrastructure Layer
- [x] `app/infrastructure/database/models/detection_model.py` — DetectionModel + DetectionItemModel ORM
- [x] `app/application/interfaces/i_detection_repository.py` — abstract IDetectionRepository port
- [x] `app/infrastructure/database/repositories/detection_repository.py` — concrete SQLAlchemy implementation
- [x] `app/infrastructure/external/storage_client.py` — LocalStorageClient (saves images to /uploads)
- [x] `app/api/dependencies.py` — DI wiring (get_db → repo → service)

### Application Layer
- [x] `app/application/dto/detection_dto.py` — DetectionCreateDTO, DetectionResponseDTO, DetectionItemDTO
- [x] `app/application/services/detection_service.py` — validation (coords, file size, file type) + orchestration
- [x] detection_status set to `"pending"` on creation (state machine groundwork laid)
- [x] No ML logic called (deferred to Sprint 4)
- [x] No RiskService (deferred to Sprint 5)

### API Layer
- [x] `app/api/v1/schemas/detection_schema.py` — Pydantic schemas + response envelope `{ data, meta, error }`
- [x] `POST /api/v1/detections` — multipart image + lat/lng → stores metadata, returns 201 with `detection_status: "pending"`
- [x] `GET /api/v1/detections` — paginated list with `?page=&limit=`
- [x] `GET /api/v1/detections/{id}` — single record, returns 404 if not found
- [x] Static file serving for uploaded images at `/static/uploads/`

### Testing Verified
- [ ] Database connection verified against the configured PostgreSQL instance
- [x] Alembic migration runs cleanly — creates `detections` and `detection_items` tables
- [x] `POST /api/v1/detections` creates row with `detection_status: "pending"` and empty `items: []`
- [x] `GET /api/v1/detections` returns paginated list with `meta` block
- [x] `GET /api/v1/detections/{id}` returns correct single record
- [x] `GET /api/v1/detections/nonexistent` returns 404

---

## Deliberately Deferred (Out of Scope for Sprint 2)

| Item | Reason | Target Sprint |
|---|---|---|
| RiskAssessment, Hotspot, Analytics entities | Architecture specifies these come later | Sprint 5–6 |
| ML client (`YoloMLClient`) wiring | No ML service running yet; interface reserved in `infrastructure/ml_client/` | Sprint 4 |
| `INotificationService`, `IRiskRepository` interfaces | Not needed until Risk Engine | Sprint 5 |
| `risk_router.py`, `analytics_router.py`, `hotspot_router.py` | No services to back them | Sprint 5–6 |
| Authentication / JWT | Architecture document designates `core/security.py` for future | Post-Sprint 6 |
| Unit tests (`tests/unit/`) | Manual verification passed; formal test files in Sprint 3 | Sprint 3 |
| Integration tests (`tests/integration/`) | Same as above | Sprint 3 |

---

## Sprint 3 — ML Client and Risk Engine

- [x] Confirmed no YOLO weights, standalone inference service, or ML HTTP endpoint exists in this repository; only a Colab training notebook is present.
- [x] `IMLClient` plus HTTP-only `YoloMLClient` adapter for the architecture's `/predict` contract.
- [x] ML contract normalization isolated in the client (`[x1,y1,x2,y2]` → `bbox_x/y/w/h`).
- [x] Synchronous detection lifecycle: `pending` → `completed` or `failed` with persisted `failure_reason`.
- [x] `RiskAssessment`, `IRiskRepository`, PostgreSQL repository, migration, and `GET /api/v1/risk/{detection_id}`.
- [x] Strategy-based RiskService: plastic type, item-count density, and a no-op proximity extension point.
- [x] Unit tests cover ML contract normalization, completed/failed transitions, and pure RiskService scoring without database or ML calls.
- [ ] Deploy the separate ML service with a real trained model, then set `ML_SERVICE_URL` before expecting completed live detections.
