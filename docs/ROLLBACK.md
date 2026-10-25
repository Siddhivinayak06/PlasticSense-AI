# Rollback procedure

All work from the 2026-10-24 rework is on the branch `feat/wastesense-rework`.
The pre-change state is tagged `pre-wastesense-rework` (commit `801671e` on `main`).

## 1. Backups taken before any schema change

Directory: `/home/bipin/Documents/PlasticSense-AI-backup-20261024/`

| File | Contents |
|---|---|
| `wastesense.db.bak` | Database as it was before any change (17 detections, 38 items, 17 risk assessments) |
| `wastesense.db.pre-migration` | Before the schema-sync migration `b1f4c7a2d9e0` |
| `wastesense.db.pre-capturedat` | Before `c2a8e5b31f47` (captured_at) |
| `wastesense.db.pre-nullable` | Before `d3b9f6c04e18` (nullable coordinates) |
| `.env.bak` | Original backend environment file, including the original model paths |
| `alembic.bak/` | Original migration directory |

No model checkpoint, dataset or upload was modified or deleted at any point.

## 2. Full rollback (code + data)

```bash
cd /home/bipin/Documents/PlasticSense-AI

# Code
git checkout main                      # or: git checkout pre-wastesense-rework

# Data + configuration
cp /home/bipin/Documents/PlasticSense-AI-backup-20261024/wastesense.db.bak Backend/wastesense.db
cp /home/bipin/Documents/PlasticSense-AI-backup-20261024/.env.bak          Backend/.env
```

Note: after restoring `main`, the backend will again fail to start unless the `supabase` and
`timm` packages are installed, because those hard imports are what the rework removed.

## 3. Database-only rollback

Restore the appropriate snapshot and stamp Alembic back:

```bash
cd Backend
cp /home/bipin/Documents/PlasticSense-AI-backup-20261024/wastesense.db.pre-nullable wastesense.db
.venv/bin/alembic stamp c2a8e5b31f47
```

Downgrade targets:

```bash
.venv/bin/alembic downgrade c2a8e5b31f47   # undo nullable coordinates (no-op by design)
.venv/bin/alembic downgrade b1f4c7a2d9e0   # drop captured_at
.venv/bin/alembic downgrade 6d878019c7c3   # drop the synced columns
```

`d3b9f6c04e18.downgrade()` is deliberately a no-op: reinstating `NOT NULL` on
`latitude`/`longitude` would fail against rows that legitimately have no location.
Restore from a snapshot instead if you truly need the old constraint.

## 4. Reverting the BiaEye model swap (2026-10-25)

The production detector was upgraded from the 22-class YOLOv8n (`Backend/best.pt`) to BiaEye YOLO11s (`models/external/biaeye-yolo11s/best.pt`) because the 22-class model produced only 2-4 detections per image and mislabelled plastic as `scrap_paper`.

Backup files created:
- Model checkpoint: `Backend/best_22cls_original.pt`
- Env file: `Backend/.env.backup.20261025`

To revert to the 22-class YOLOv8n detector:

```bash
cd /home/bipin/Documents/PlasticSense-AI/Backend
# Revert DETECTOR_MODEL_PATH in Backend/.env
sed -i 's|DETECTOR_MODEL_PATH=.*|DETECTOR_MODEL_PATH="best_22cls_original.pt"|' .env
```

To revert to the older `plasticsense_detector_best.pt` baseline:

```ini
DETECTOR_MODEL_PATH="../Ml-model/handoff_to_cachyos/models/plasticsense_detector_best.pt"
DETECTOR_CONF_THRESHOLD=0.10
```

Expect the previous behaviour: roughly 5 detections across 31 dumpsite images.

## 5. Restoring the removed resin classifier

`Backend/app/infrastructure/ml_client/plastic_classifier.py` was deleted via `git rm`, so it is
recoverable:

```bash
git show pre-wastesense-rework:Backend/app/infrastructure/ml_client/plastic_classifier.py \
  > Backend/app/infrastructure/ml_client/plastic_classifier.py
pip install timm
```

Restoring it also requires reinstating the call sites in `waste_detector.py`. Read
`docs/MODEL_SELECTION.md` §4 first — the classifier's class ordering is unverified, so its labels
may all be wrong.
