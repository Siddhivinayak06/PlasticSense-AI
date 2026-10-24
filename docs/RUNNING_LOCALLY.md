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

### Database (Supabase)

`Backend/.env` → `DATABASE_URL` must be the **Session pooler** URI from Supabase Dashboard →
Connect → *Session pooler* (host `aws-0-<region>.pooler.supabase.com`, port `5432`, user
`postgres.<project-ref>`). Do **not** use the direct host `db.<ref>.supabase.co`: it is IPv6-only and
fails on IPv4 networks. URL-encode special characters in the password (`@` → `%40`, `#` → `%23`).
`SUPABASE_URL` + `SUPABASE_KEY` (server-side *secret* key) enable image storage in the `images` bucket.

If the database is unreachable the app falls back to `Backend/wastesense.db` (SQLite) and
`/api/v1/health` reports `"status": "degraded"`, `"using_fallback": true`. To use SQLite deliberately
set `DB_FORCE_SQLITE=true`. `alembic upgrade head` refuses to migrate the *fallback* database, so a
broken `DATABASE_URL` can never silently migrate SQLite instead of Supabase.

Supabase hardening (migration `e7c1a9d24f50`): RLS enabled on every public table with no policies and
all `anon`/`authenticated` grants revoked — the browser never talks to Supabase directly; only the
backend does. Seeded demo NGO/assignment rows are flagged `is_sample` (migration `f3d2b8c61a07`) and
labelled "Sample" in the UI. Seeding is off by default (`SEED_SAMPLE_DATA=false`).

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

```bash
cd Backend
.venv/bin/python -m pytest -q --ignore=tests/test_e2e_local.py   # unit + integration + security (36)
```

The end-to-end suite POSTs real images, so run it against an isolated SQLite instance to keep test
records out of Supabase:

```bash
cd Backend
cp wastesense.db /tmp/e2e.db
DB_FORCE_SQLITE=true SQLITE_PATH=/tmp/e2e.db SUPABASE_URL= SUPABASE_KEY= .venv/bin/alembic upgrade head
DB_FORCE_SQLITE=true SQLITE_PATH=/tmp/e2e.db SUPABASE_URL= SUPABASE_KEY= UPLOAD_DIR=/tmp/e2e_up RESULTS_DIR=/tmp/e2e_res \
  .venv/bin/python -m uvicorn app.main:app --port 8001 &
WASTESENSE_API=http://127.0.0.1:8001/api/v1 .venv/bin/python -m pytest -q tests/test_e2e_local.py   # 20
```

Frontend: `npx tsc --noEmit`, `npm run lint` (0 errors), `npm run build`.

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
- With Supabase Storage configured, originals and annotated images go to the `images` bucket;
  otherwise to `UPLOAD_DIR` / `RESULTS_DIR` on disk. The original is never overwritten.
- Uploads are validated by content (decoded image signature), max 10 MB, max 64 MP, 30 analyses/min
  per client IP, batch ≤ 10 files. CORS admits only `http://localhost:3000` and `http://127.0.0.1:3000`.
- No user accounts: this is a single-operator local deployment. Do not expose port 8000 publicly.
