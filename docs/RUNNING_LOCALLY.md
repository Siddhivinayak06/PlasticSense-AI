# Running WasteSense AI locally

Verified on Linux (CachyOS), NVIDIA RTX 5060 Laptop GPU, 2026-10-24.

## Prerequisites

| Requirement | Verified version | Notes |
|---|---|---|
| Python (backend venv) | 3.11 | `Backend/.venv` |
| Python (model lab venv) | 3.14 | `WasteSense-Model-Lab/.venv`, torch 2.14.1+cu130 |
| Node.js | 24.20.0 | |
| tesseract-ocr | 5.5.3 | **Required** for GPS overlay extraction (`which tesseract`) |
| CUDA | 13.0 | Optional; falls back to CPU automatically |

## 1. Backend

```bash
cd Backend
.venv/bin/alembic upgrade head        # idempotent; safe on an existing database
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

- API: <http://127.0.0.1:8000/api/v1>
- Interactive docs: <http://127.0.0.1:8000/docs>
- Health (includes which database is actually in use): <http://127.0.0.1:8000/api/v1/health>

### Database

`Backend/.env` may point `DATABASE_URL` at a remote PostgreSQL instance. If that host is
unreachable the app **automatically falls back to the local SQLite file**
`Backend/wastesense.db` and logs the fallback loudly. `/api/v1/health` always reports which
backend is live:

```json
{"database": {"backend": "sqlite-fallback", "using_fallback": true, "fallback_reason": "OperationalError"}}
```

To force local SQLite and skip the connection attempt, set `DB_FORCE_SQLITE=true` in `.env`.

### Active models

Configured in `Backend/.env`; rationale in [`MODEL_SELECTION.md`](./MODEL_SELECTION.md).

| Role | Checkpoint | Architecture | Classes | Resolution |
|---|---|---|---|---|
| Detector | `Backend/best.pt` | YOLOv8n | 22 | 960 |
| Segmenter | `Ml-model/handoff_to_cachyos/models/taco_segmentation_best.pt` | YOLO11s-seg | 5 | 960 |

Both load on `cuda:0` when available. Confirm with `GET /api/v1/model/info`.

## 2. Frontend

```bash
cd Frontend
npm install        # required: node_modules ships incomplete (three.js was missing)
npm run dev
```

Opens on <http://localhost:3000>. API base URL comes from `Frontend/.env.local`
(`NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`).

## 3. Tests

Start the backend first — the end-to-end tests exercise the real HTTP API, real model inference
and real persistence. They skip automatically if the server is not running.

```bash
cd Backend
.venv/bin/python -m pytest tests/test_e2e_local.py -v
```

## 4. Research evidence scripts

Separate from production inference; they never touch the application database.

```bash
cd WasteSense-Model-Lab

# Recover training/validation curves embedded in the checkpoints (no GPU, no retraining)
.venv/bin/python scripts/extract_training_curves.py
#   -> reports/training_curves/*.csv, *.png, training_evidence_manifest.json

# Reproducible inference comparison at native resolutions, with latency and VRAM
.venv/bin/python scripts/benchmark_models.py --sweep 640 960
#   -> reports/benchmark/summary.csv, per_image.csv, environment.json
```

## 5. Known operational notes

- **GPS**: only 2 of 31 field images carry EXIF GPS. The remainder rely on OCR of the burned-in
  GPS Map Camera overlay. If tesseract is absent, OCR silently degrades and images fall through to
  manual coordinate entry — analysis still proceeds.
- **First inference is slow** (~2 s) because of CUDA context setup; subsequent requests are
  ~0.1–0.3 s.
- Uploads are written to `Backend/media/uploads`; annotated derivatives to `Backend/media/results`.
  The original is never overwritten.
