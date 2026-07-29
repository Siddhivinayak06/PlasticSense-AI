# PlasticSense AI — System Architecture Document

**Document type:** Pre-Development Architecture Specification
**Prepared as:** Senior Architecture Review
**Scope:** Backend-centric system design for an IEEE-level Final Year Project
**Audience:** Beginner-to-intermediate developers implementing a production-grade system

---

## 1. Purpose of This Document

Before a single line of code is written, this document defines **how PlasticSense AI is structured, why it is structured that way, and how every module communicates with every other module**. It is written so that:

- A backend developer knows exactly which folder a piece of logic belongs in.
- A frontend/Flutter developer knows the system will never break under them.
- An ML engineer can retrain, replace, or swap the YOLO11 model without touching backend code.
- An examiner or panel member can look at this document and see clear evidence of Clean Architecture and SOLID design — this is what differentiates an IEEE-level project from a typical student project.

---

## 2. Guiding Design Philosophy

PlasticSense AI is **not** "a web app that calls a model." It is a **decision-support platform** where object detection is just one data source feeding into higher-level reasoning (Risk Engine, Analytics, Hotspot Detection). Because of this, the architecture treats **ML as a replaceable plugin**, not as the core of the system.

Three non-negotiable design rules govern everything below:

1. **The backend must never import YOLO, PyTorch, Ultralytics, or any ML library directly.** It only talks to an ML service over HTTP (or a message queue later). This is what makes the ML model "completely independent."
2. **The Risk Engine and Analytics Engine must never look at an image or a model.** They only consume structured detection results (JSON) already produced by the ML layer. This is what makes the Risk Engine "independent from ML."
3. **The frontend (Next.js today, Flutter tomorrow) must never know the database exists.** It only knows REST endpoints and JSON contracts. This is what makes the backend "Flutter-ready without modification."

---

## 3. High-Level System Architecture

There are four independently deployable systems that talk to each other only through well-defined network contracts (REST APIs). None of them share code or a database connection directly.

```
┌─────────────────────┐        ┌──────────────────────┐
│   Web Dashboard      │        │  Flutter Mobile App   │
│   (Next.js)          │        │  (Future)             │
└──────────┬───────────┘        └───────────┬──────────┘
           │        REST / JSON over HTTPS               │
           └───────────────────┬─────────────────────────┘
                                ▼
                  ┌───────────────────────────┐
                  │     FastAPI Backend        │
                  │  (Clean Architecture Core) │
                  └─────┬───────────────┬───────┘
                        │               │
             REST call  │               │  SQL (ORM)
                        ▼               ▼
            ┌────────────────────┐   ┌────────────────┐
            │  ML Inference       │   │  PostgreSQL     │
            │  Service (YOLO11)   │   │  Database       │
            └────────────────────┘   └────────────────┘
```

**Key architectural decision:** The ML Inference Service is drawn as a *separate box*, not a sub-folder inside the backend. In the actual implementation it can start as a second FastAPI micro-service (recommended) or, at minimum, a completely isolated Python package invoked only through an internal HTTP call — never a direct function import. This single decision is what satisfies requirements #4 and #7 simultaneously.

---

## 4. The Four Systems and Their Responsibilities

### 4.1 Web Dashboard (Next.js)
- Displays maps, hotspots, detection galleries, analytics charts, risk scores.
- Sends images/coordinates to backend, renders whatever JSON comes back.
- Contains **zero business logic** — no risk calculation, no scoring, nothing. If logic exists in the frontend, it will have to be duplicated in Flutter later, which violates requirement #6.

### 4.2 Flutter Mobile App (Future)
- Field workers/volunteers capture plastic waste photos + GPS location.
- Uploads to the **exact same REST endpoints** the web dashboard uses.
- Because the backend was never designed "for the web," nothing changes when this is built.

### 4.3 FastAPI Backend (the heart of this document)
- Owns all business logic: validation, orchestration, risk scoring, analytics, hotspot clustering.
- Owns the database schema and all persistence logic.
- Talks to the ML service as a **client**, exactly the way it would talk to any third-party API (e.g., Google Maps API).

### 4.4 ML Inference Service (YOLO11)
- A thin, standalone service whose only job is: receive an image → return detections as JSON (class, confidence, bounding box).
- Has no knowledge of users, risk, database, or dashboards.
- Can be retrained, redeployed, or replaced with a completely different model/vendor without the backend team even being informed, as long as the JSON contract doesn't change.

---

## 5. Clean Architecture — Applied to This Project

Clean Architecture organizes code into **concentric layers**, where dependencies always point **inward** (outer layers depend on inner layers, never the reverse). This is what allows the database or the ML service to be swapped without breaking business logic.

```
┌──────────────────────────────────────────────────────┐
│  Frameworks & Drivers (outermost)                      │
│  FastAPI routes, PostgreSQL driver, HTTP clients        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Interface Adapters                                │  │
│  │  Controllers, Presenters/Schemas, Repositories(impl)│  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Application / Use Cases                       │  │  │
│  │  │  Services: DetectionService, RiskService,       │  │  │
│  │  │  AnalyticsService, HotspotService                │  │  │
│  │  │  ┌──────────────────────────────────────────┐  │  │  │
│  │  │  │  Entities / Domain (innermost, pure)        │  │  │  │
│  │  │  │  Detection, RiskAssessment, Hotspot,        │  │  │  │
│  │  │  │  Location, WasteType                        │  │  │  │
│  │  │  └──────────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**Rule of thumb for beginners:** if a file needs to `import fastapi`, `import sqlalchemy`, or make an HTTP call, it does **not** belong in the Domain or Application layers. Those layers should be pure Python — testable with zero infrastructure running.

### Why this matters practically
- Want to switch PostgreSQL → MySQL later? Only the **Repository implementation** changes.
- Want to add a new detection model? Only the **ML Client Adapter** changes.
- Want to change how risk is scored? Only the **RiskService** changes — nothing else even notices.

---

## 6. Backend Folder Structure

```
plasticsense-backend/
│
├── app/
│   ├── main.py                     # FastAPI app entrypoint, wires everything together
│   ├── config.py                   # Environment variables, settings (Pydantic Settings)
│   │
│   ├── domain/                     # ─── ENTITIES (innermost layer, no dependencies) ───
│   │   ├── entities/
│   │   │   ├── detection.py        # Detection entity (class, bbox, confidence)
│   │   │   ├── location.py         # GPS coordinate value object
│   │   │   ├── waste_item.py       # A classified plastic item
│   │   │   ├── risk_assessment.py  # Risk score entity
│   │   │   └── hotspot.py          # Cluster of detections in an area
│   │   └── enums/
│   │       └── waste_type.py       # PET, HDPE, PP, wrapper, etc.
│   │
│   ├── application/                # ─── USE CASES / SERVICES ───
│   │   ├── interfaces/             # Abstract contracts (ports) — SOLID's "D" in action
│   │   │   ├── i_detection_repository.py
│   │   │   ├── i_risk_repository.py
│   │   │   ├── i_ml_client.py
│   │   │   └── i_notification_service.py
│   │   ├── services/
│   │   │   ├── detection_service.py     # Orchestrates image → ML → save
│   │   │   ├── risk_service.py          # Computes risk from stored detections
│   │   │   ├── analytics_service.py     # Aggregations, trends, reports
│   │   │   └── hotspot_service.py       # Geo-clustering logic
│   │   └── dto/
│   │       ├── detection_request_dto.py
│   │       └── detection_response_dto.py
│   │
│   ├── infrastructure/             # ─── OUTER LAYER: real implementations ───
│   │   ├── database/
│   │   │   ├── models/             # SQLAlchemy ORM models
│   │   │   │   ├── detection_model.py
│   │   │   │   ├── risk_model.py
│   │   │   │   ├── hotspot_model.py
│   │   │   │   └── user_model.py
│   │   │   ├── repositories/       # Implements the interfaces above
│   │   │   │   ├── detection_repository.py
│   │   │   │   ├── risk_repository.py
│   │   │   │   └── hotspot_repository.py
│   │   │   └── session.py          # DB engine/session setup
│   │   │
│   │   ├── ml_client/              # ─── ONLY place that knows YOLO exists ───
│   │   │   └── yolo_ml_client.py   # Implements IMLClient, makes HTTP call to ML service
│   │   │
│   │   └── external/
│   │       └── storage_client.py   # Image upload storage (local/S3/Cloud later)
│   │
│   ├── api/                        # ─── PRESENTATION LAYER ───
│   │   ├── v1/
│   │   │   ├── routers/
│   │   │   │   ├── detection_router.py
│   │   │   │   ├── risk_router.py
│   │   │   │   ├── analytics_router.py
│   │   │   │   └── hotspot_router.py
│   │   │   └── schemas/            # Pydantic request/response models
│   │   │       ├── detection_schema.py
│   │   │       ├── risk_schema.py
│   │   │       └── hotspot_schema.py
│   │   └── dependencies.py         # Dependency Injection wiring (get_db, get_ml_client)
│   │
│   └── core/
│       ├── exceptions.py           # Custom domain exceptions
│       ├── logging.py
│       └── security.py             # Auth/JWT (future)
│
├── tests/
│   ├── unit/                       # Test domain + application layers, no DB/network
│   └── integration/                # Test repositories, ML client, API routes
│
├── alembic/                        # Database migrations
├── requirements.txt
└── .env

ml-service/                          # ─── COMPLETELY SEPARATE PROJECT/REPO ───
├── main.py                          # FastAPI app exposing /predict
├── model/
│   └── yolo11_plastic_finetuned.pt
├── inference/
│   └── detector.py                  # Loads model, runs prediction, formats output
└── requirements.txt                  # ultralytics, torch — NEVER installed in backend
```

This physical separation (two `requirements.txt`, two deployable services) is what makes requirement #4 ("ML model must be completely independent from backend") verifiable, not just a claim.

---

## 7. Layered Responsibilities in Detail

| Layer | Responsibility | Depends On | Knows About |
|---|---|---|---|
| **Domain (Entities)** | Pure business objects and rules (e.g., what makes a risk score valid) | Nothing | Nothing external |
| **Application (Services + Interfaces)** | Orchestrates use cases, defines *what* it needs (via interfaces) without knowing *how* | Domain only | Abstractions (interfaces), never concrete classes |
| **Infrastructure** | Concrete implementations: talks to PostgreSQL, talks to ML service over HTTP | Application interfaces | SQLAlchemy, requests/httpx, YOLO API contract |
| **API/Presentation** | HTTP routing, request validation, response formatting | Application services | FastAPI, Pydantic schemas |

This table is the direct implementation of the **Dependency Inversion Principle**: `DetectionService` depends on `IMLClient` (an abstract interface), not on `YoloMLClient` (the concrete class). At startup, `dependencies.py` injects the concrete implementation. Swapping YOLO for another model, or swapping PostgreSQL for another database, requires editing exactly one file in `infrastructure/`.

---

## 8. SOLID Principles Mapped to Real Files

| Principle | How PlasticSense AI Applies It |
|---|---|
| **S — Single Responsibility** | `DetectionService` only orchestrates detection; `RiskService` only computes risk; `HotspotService` only clusters — each service has exactly one reason to change. |
| **O — Open/Closed** | New waste-risk rules can be added to `RiskService` via new strategy classes without editing existing ones (see Risk Engine section below). |
| **L — Liskov Substitution** | Any class implementing `IMLClient` (YOLO today, a future custom model tomorrow) can replace `YoloMLClient` without breaking `DetectionService`. |
| **I — Interface Segregation** | Separate interfaces (`IDetectionRepository`, `IRiskRepository`) instead of one giant `IRepository` — services depend only on what they actually use. |
| **D — Dependency Inversion** | Application layer defines interfaces; Infrastructure layer implements them; wiring happens only in `dependencies.py`. |

---

## 9. End-to-End Data Flow (A Single Detection Request)

1. **User (web or Flutter)** uploads an image + GPS coordinates → `POST /api/v1/detections`.
2. **API Router** (`detection_router.py`) validates the request shape using a Pydantic schema and calls `DetectionService`.
3. **DetectionService** (Application layer):
   a. Sends the image to `IMLClient.predict(image)`.
   b. `YoloMLClient` (Infrastructure) makes an HTTP POST to the ML Inference Service (`ml-service/main.py`).
   c. ML service runs YOLO11, returns JSON: `[{class: "PET_bottle", confidence: 0.91, bbox: [...]}, ...]`.
4. **DetectionService** converts this raw JSON into domain `Detection` entities, then calls `IDetectionRepository.save()` to persist them via PostgreSQL.
5. **DetectionService** then calls `RiskService.assess(detections, location)` — the Risk Engine.
6. **RiskService** applies rules (waste density, plastic type hazard weight, proximity to water bodies) and produces a `RiskAssessment` entity, saved via `IRiskRepository`.
7. **HotspotService** (can run async/on a schedule) periodically re-clusters nearby detections into `Hotspot` entities.
8. **API layer** converts the final result into a response DTO/schema and returns clean JSON to the frontend.
9. **Frontend** (Next.js or Flutter) simply renders what it receives — no computation happens client-side.

Notice: the ML service is called **once**, at step 3b, through plain HTTP — exactly like calling any external API. The rest of the system doesn't know or care that YOLO exists.

---

## 10. Core Services and Their Single Responsibility

### 10.1 DetectionService
Orchestrates the "upload → detect → persist" use case. Talks to `IMLClient` and `IDetectionRepository`. Does **not** compute risk itself — it delegates.

### 10.2 RiskService — The Risk Engine
This is the intelligence layer that turns raw detections into decision-support insight. Structured as a **Strategy pattern** so new risk factors can be added without modifying existing logic (Open/Closed Principle):

- `PlasticTypeRiskStrategy` — different plastics (PET vs. multilayer plastic) carry different environmental hazard weights.
- `DensityRiskStrategy` — number of items detected per unit area.
- `ProximityRiskStrategy` — distance to water bodies/drains (future GIS integration point).
- `RiskEngine` combines strategy outputs into a final composite score (e.g., Low/Medium/High/Critical) plus a numeric score for analytics.

**Critical isolation point:** `RiskService` receives only structured `Detection` entities (already saved in the DB) — never an image, never a model output format. This is what satisfies "Risk Engine should be independent from ML." If YOLO is replaced by a completely different detection system tomorrow, `RiskService` code does not change at all, as long as the `Detection` entity shape stays the same.

### 10.3 AnalyticsService
Produces aggregated insights: trends over time, waste-type distribution, cleanup priority rankings, comparison across regions. Reads from repositories, performs no persistence itself (read-only orchestration).

### 10.4 HotspotService
Applies spatial clustering (e.g., DBSCAN or grid-based clustering) over stored `Location` + `Detection` data to identify geographic hotspots. This is the natural extension point for **future GIS integration** — a `GISAdapter` interface can later be introduced without touching this service's core logic.

---

## 11. API Design (REST Contract)

All endpoints are versioned (`/api/v1/...`) so that future breaking changes (v2) never break the current Flutter or web clients — critical for requirement #6.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/detections` | POST | Upload image + location, run detection pipeline |
| `/api/v1/detections/{id}` | GET | Retrieve a single detection record |
| `/api/v1/detections` | GET | List/filter detections (by date, region, waste type) |
| `/api/v1/risk/{detection_id}` | GET | Get risk assessment for a detection |
| `/api/v1/risk/summary` | GET | Aggregated risk summary for a region/date range |
| `/api/v1/hotspots` | GET | Retrieve current hotspot clusters (for map rendering) |
| `/api/v1/analytics/trends` | GET | Time-series waste trend data |
| `/api/v1/analytics/dashboard` | GET | Composite dashboard summary payload |
| `/api/v1/auth/*` | POST/GET | Authentication (future — needed once Flutter + multiple field agents exist) |

Design rules followed:
- **Stateless** — no server-side session; every request is self-contained (JWT later). This is required for both web and mobile clients to share the backend safely.
- **Resource-oriented nouns**, not verbs (`/detections`, not `/getDetections`).
- **Consistent envelope** — every response follows the same JSON shape (`{ data, meta, error }`) so frontend parsing logic is identical for Next.js and Flutter.
- **Pagination** on all list endpoints (`?page=&limit=`) — required for scalability (#9) once thousands of detections accumulate.

---

## 12. Database Design (PostgreSQL, Normalized)

Normalized to 3NF — no repeated groups, no derived data stored redundantly.

**Core tables:**

- `users` — id, name, role (volunteer/admin/analyst), email, created_at
- `locations` — id, latitude, longitude, region_id (FK), captured_at
- `regions` — id, name, boundary_geometry (for future GIS/PostGIS)
- `detections` — id, user_id (FK), location_id (FK), image_url, model_version, created_at
- `detection_items` — id, detection_id (FK), waste_type (FK enum table or lookup), confidence, bbox_x, bbox_y, bbox_w, bbox_h
- `waste_types` — id, name, hazard_weight (lookup table, avoids magic strings)
- `risk_assessments` — id, detection_id (FK), score, level, computed_at, strategy_breakdown (JSONB for explainability)
- `hotspots` — id, region_id (FK), center_lat, center_lng, severity, item_count, updated_at
- `hotspot_detections` — join table (hotspot_id, detection_id) — many-to-many

**Why this shape:**
- `detection_items` is a separate table from `detections` because one image can contain multiple plastic items (one-to-many) — avoids repeating groups.
- `waste_types` is a lookup table, not a free-text column — enforces referential integrity and lets hazard weights be tuned without code changes.
- `hotspot_detections` as a join table allows a detection to belong to zero, one, or multiple hotspot recalculations over time without data loss.

This structure is ready for **PostGIS extension** later (for real GIS geometry queries) by simply altering `locations`/`regions` columns to `geometry` types — no redesign needed.

---

## 13. Backend ↔ Frontend Communication

- Communication is **exclusively REST + JSON over HTTPS**. No server-rendered coupling, no shared code, no GraphQL (kept simple deliberately, per requirement #10).
- Next.js calls the same endpoints a Flutter app will call later — verified by designing the API contract **before** the Next.js dashboard, not after.
- CORS is configured at the FastAPI layer to whitelist the dashboard's domain; Flutter mobile apps don't need CORS (native HTTP), which is one more reason mobile support requires zero backend changes.
- Authentication (future): JWT bearer tokens — same mechanism works identically for browser and mobile clients.

---

## 14. Backend ↔ ML Communication

- The backend never loads a model, never imports `ultralytics`, and never touches GPU/CPU inference code.
- `YoloMLClient` (in `infrastructure/ml_client/`) makes a plain HTTP POST (multipart image upload) to the ML service's `/predict` endpoint.
- The ML service's response contract is fixed and versioned, e.g.:
  ```json
  {
    "model_version": "yolo11-plastic-v1.2",
    "detections": [
      {"class": "PET_bottle", "confidence": 0.91, "bbox": [x1, y1, x2, y2]}
    ]
  }
  ```
- Because this is a *contract*, the ML team can retrain and redeploy the model independently, any time, as long as this JSON shape is honored — true decoupling.
- In production, this call can later be swapped for an async message queue (e.g., Redis/RabbitMQ) if inference needs to be batched — again, only `YoloMLClient` changes.

---

## 15. Backend ↔ PostgreSQL Communication

- SQLAlchemy ORM models live only in `infrastructure/database/models/` — the Domain layer never imports SQLAlchemy.
- Repositories (e.g., `DetectionRepository`) implement the Application layer's interfaces (`IDetectionRepository`) and are the **only** classes allowed to write SQL/ORM queries.
- `session.py` manages connection pooling — important for scalability once concurrent Flutter + web traffic hits the same backend.
- Alembic manages schema migrations, so schema changes are version-controlled, not manual.

---

## 16. Where the Risk Engine Fits (Summary View)

```
Detection Data (from DB, NOT from ML directly)
        │
        ▼
 ┌─────────────────┐
 │  RiskService     │◄── Strategy plugins (PlasticType, Density, Proximity)
 └─────────────────┘
        │
        ▼
 RiskAssessment entity → saved via IRiskRepository → exposed via /api/v1/risk
```

The Risk Engine sits entirely in the **Application layer**, consuming only domain entities that already exist in the database — it is a downstream consumer of detection data, not a component wired to the ML pipeline. This satisfies requirement #7 structurally, not just by convention.

---

## 17. Future Scalability Plan

| Concern | Current Design | Scalability Path |
|---|---|---|
| **Traffic growth** | Single FastAPI instance | Stateless design allows horizontal scaling behind a load balancer (no session state to break) |
| **ML load** | Synchronous HTTP call | Move to async task queue (Celery/RQ + Redis) so image uploads don't block API threads |
| **Database growth** | Normalized PostgreSQL | Add read replicas; partition `detections` by date/region as volume grows |
| **GIS features** | Lat/lng columns | Migrate to PostGIS geometry types; add spatial indexes (GIST) |
| **Mobile rollout** | REST contract already client-agnostic | Zero backend changes needed — just point Flutter at `/api/v1` |
| **Cloud deployment** | Two independently deployable services (backend, ML) | Containerize each with Docker; deploy separately (e.g., backend on Cloud Run, ML service on a GPU-backed instance) so ML scaling doesn't force backend to scale, and vice versa |
| **New model versions** | `model_version` stored per detection | Old detections remain traceable to the model that produced them; A/B testing of model versions becomes possible |
| **Authentication/roles** | Not yet implemented | `core/security.py` and `users` table already reserved for JWT + role-based access |

---

## 18. Why This Is Beginner-Understandable

Despite following Clean Architecture and SOLID, a beginner can navigate this system with one mental rule:

> **"Follow the arrow: API → Service → Repository/Client → Database/ML."**

Every request enters through `api/`, gets orchestrated in `application/services/`, and only touches real infrastructure (database or ML) at the very last step, through `infrastructure/`. A new contributor only needs to understand one layer at a time — they never need to read the entire codebase to make one change.

---

## 19. Summary Checklist Against Original Requirements

| # | Requirement | How It's Satisfied |
|---|---|---|
| 1 | Clean Architecture | 4-layer structure: domain → application → infrastructure → api |
| 2 | SOLID | Mapped explicitly per principle in Section 8 |
| 3 | Modular backend | Feature-based service separation, no monolithic files |
| 4 | ML independent from backend | Separate repo/service, communicates only via HTTP contract |
| 5 | Frontend via REST only | No shared code/DB access; JSON contract only |
| 6 | Flutter-ready without changes | Versioned, stateless, client-agnostic REST API |
| 7 | Risk Engine independent from ML | Consumes only stored `Detection` entities, never raw model output |
| 8 | Normalized database | 3NF schema with lookup and join tables (Section 12) |
| 9 | Scalable APIs | Stateless, paginated, versioned, horizontally scalable |
| 10 | Beginner understandable | Single dependency-flow rule; one responsibility per file |

---

*This document is intended to be finalized and reviewed before implementation begins. Once approved, the recommended build order is: (1) domain entities, (2) application interfaces + services with mocked repositories, (3) database models + repositories, (4) ML client + standalone ML service, (5) API routers, (6) Next.js dashboard against the live API contract.*
