# Model selection — decision record

Date: 2026-10-24. Hardware: NVIDIA RTX 5060 Laptop GPU, CUDA 13.0, torch 2.14.1, ultralytics 8.4.185.

Evidence behind this document is reproducible with:

```bash
cd WasteSense-Model-Lab
.venv/bin/python scripts/extract_training_curves.py   # recovers embedded curves
.venv/bin/python scripts/benchmark_models.py --sweep 640 960
```

Raw outputs: `WasteSense-Model-Lab/reports/training_curves/`, `WasteSense-Model-Lab/reports/benchmark/`.

---

## 1. The decisive context

The target imagery is **dense aggregated Indian municipal dumpsites** (GPS Map Camera photos,
Kalyan, Maharashtra). In these scenes 80–95% of pixels are waste and individual items number in
the thousands. This single fact drives every decision below, because instance-based detection and
segmentation only fire on visually separable, intact, object-like items. The aggregated waste
matrix is effectively invisible to them.

Measured consequence: the TACO segmenter reports **6.85% mean mask coverage** at its native 960px
on scenes that are visually ~85–90% waste — roughly a **10× undercount**. This is the known,
documented limitation of the current architecture, not a bug to be tuned away.

---

## 2. Architecture decision

**Chosen: modular, task-specific (Option E), without a new research model as a prerequisite.**

| Task | Model | Why |
|---|---|---|
| **A. Item detection** | `best.pt` — YOLOv8n, 22 classes, 3.0M params | Only detector that fires reliably on target imagery (103 detections, 31/31 images @960). Supplies the fine-grained classes the hazard logic reads (battery, cigarette-adjacent, spray can). Fastest candidate at 0.027 s/img. |
| **B. Material segmentation** | `taco_segmentation_best.pt` — YOLO11s-seg, 5 materials, 10.1M params | Only retained model producing pixel masks mapped to the Plastic/Metal/Glass/Paper/Other taxonomy the risk engine consumes. Run at its native 960px. |
| **C. Dense waste-area estimation** | **Not implemented.** Falls back to a labelled heuristic | No validated dense-coverage model exists. The system exposes a `bbox_mask_hybrid_union` heuristic labelled "Detected Waste Index (indicative)" and never calls it a measurement. See §5. |
| **D. Geolocation** | EXIF → pixel-overlay OCR (tesseract 5.5.3) → manual entry | Only **2 of 31** field images carry EXIF GPS; 29 have coordinates burned into the image overlay. OCR is essential here, not a nicety. |
| **E. Risk & prioritisation** | Deterministic `RiskEngine` (no ML) | Transparent weighted sum over four components, fully explainable, no forecasting. |

Models are **not** ensembled. Each has a distinct, non-overlapping job; nothing was retained
merely because it exists.

---

## 3. Candidate evaluation

Detection counts below are **diagnostic, not accuracy**. Without ground-truth annotations a higher
count can mean better recall *or* more false positives. No mAP/precision/recall comparison across
models is possible or presented.

| Model | Params | Native | Dets @native | Images hit | s/img | Peak VRAM | Decision |
|---|---|---|---|---|---|---|---|
| `best.pt` (22-class) | 3,015,138 | 640 | 54 (103 @960) | 31/31 | 0.027 | 63 MB | **Integrated** — primary detector @960 |
| `taco_segmentation_best.pt` | 10,084,223 | 960 | 283 | 31/31 | 0.060 | 245 MB | **Integrated** — segmenter |
| `plasticsense_detector_best.pt` | 9,431,662 | 960 | **5** | **3/31** | 0.030 | 188 MB | **Demoted** — see §4 |
| `yolov8m-seg.pt` | 27,242,543 | 416 | 78 | 27/31 | 0.035 | 205 MB | **Excluded** — trained from scratch, 30 epochs @416, no embedded metrics, weakest provenance |
| `ML-service/models/best.pt` (BiaEye) | 9,430,114 | 640 | 384 (687 @960) | 31/31 | 0.025 | 206 MB | **Excluded pending licensing** — third-party, undocumented, high count is unverified (may be over-firing) |
| `pLitterStreet_YOLOv5l.pt` | not extracted | — | 55 | 30/31 | — | — | **Benchmark only** — best domain fit (`Pile` class), but YOLOv5 hub dependency is costly to integrate |
| `pLitterFloat_*.pt` | not extracted | — | 1046 | 31/31 | — | — | **Excluded** — water domain; 898 spurious `debris` detections (~34/image) |
| `yolov8m_object_material_best.pt` (Bower) | 28,862,557 | 640 | 29 | 23/31 | 0.097 | — | **Excluded from production** — see §4 |
| `plastic_classifier_best.pt` | ~87.6M | 224 | — | — | — | — | **Removed from code** — see §4 |

### Resolution fairness

The previous `compare_models.py` forced `imgsz=640` on every model regardless of training
resolution. Measured impact of that one choice:

| Model | @640 | @960 | Δ |
|---|---|---|---|
| `github_best_22cls` | 54 | 103 | +91% |
| `hf_yolov8m_seg` | 128 | 292 | +128% |
| `biaeye_6cls` | 384 | 687 | +79% |
| `taco_segmentation` | 328 | 283 | −14% |

Any ranking drawn from the old CSV is invalid. `benchmark_models.py` runs each model at its native
resolution and records the environment.

---

## 4. Exclusions, in detail

### `plasticsense_detector_best.pt` — demoted from primary detector
This was the model the application ran in production. On 31 target-domain images it produced
**5 detections across 3 images** at its own native 960px — resolution was not the excuse. Its
embedded best-epoch metrics on its own validation split are mAP50 0.171, precision 0.236,
recall 0.280.

The recovered 120-epoch curve (`reports/training_curves/plasticsense_detector_metrics.png`) shows
mAP50 **still rising at epoch 120** and never plateauing: the model is under-trained or
data-starved, not converged. `batch=4` at 960px indicates severe VRAM constraints during training.

It is **retained as an honest research baseline** — it is the project's own model and its curve is
legitimate evidence of how hard this domain is.

### `plastic_classifier_best.pt` — removed from the codebase
Three independent disqualifiers:
1. **Class ordering unverified.** `test_plastic_classifier.py` hardcoded an *assumed alphabetical*
   order `["HDPE","LDPE","Other","PET","PP","PS"]`. If training used any other order, every label
   is silently wrong and there is no way to detect it without the original model card, which could
   not be located.
2. **No abstention class.** It assigned resin types to 13 `cardboard_box` and 12 `can` crops.
3. **Collapsed outputs.** 68 of 70 predictions fell into just LDPE/HDPE.

Worse, the production code (`waste_detector.py`) used its output to **overwrite the detector's
class name** with synthesised labels like `"Bottle (PET)"` derived from resin code *plus bounding
box geometry*, and **replaced the detection confidence** with the classifier's. All of that is
removed. The API now reports `resin_polymer_identification: false`.

### Bower multi-head (`yolov8m_object_material_best.pt`) — excluded from production
Verified authentic (SHA-256 `991a827c…` matches the published value) and it does run on this
hardware at 0.097 s/img with the richest material taxonomy available (19 object × 12 material
classes, including Plastic-Hard/Soft/Other). Excluded because:
- Requires the `ultralytics_bower` 8.1.34 fork, which conflicts with the 8.4.185 the app uses.
- `seegull` is pip-installed editable from `~/Desktop/WasteSense-Model-Lab/bower-seegull`, a path
  that **no longer exists**; it only loads via an explicit `PYTHONPATH` override.
- No embedded training curves, no metrics, and **licensing unconfirmed**.
- Domain-shifted: 20 of 29 detections were `Box/Card/Tray/Crate`, a signature of a model trained
  on clean single items photographed against a plain background.

Worth revisiting as a benchmark row once licensing is settled.

---

## 5. What the system must never claim

Enforced by `GET /api/v1/model/info` → `capabilities`, and asserted in
`Backend/tests/test_e2e_local.py`:

| Claim | Status |
|---|---|
| Waste **mass** or volume | ❌ Not implemented, not measurable from a single uncalibrated photo |
| **Resin/polymer** type | ❌ Classifier removed; ordering unverifiable |
| **Hotspot forecasting** | ❌ No repeated observations over time; clusters are descriptive only |
| Validated waste **coverage** | ❌ The index is an indicative heuristic, never validated against human annotation |
| mAP / precision / recall on WasteSense imagery | ❌ Requires a labelled evaluation set that does not yet exist |

Checkpoint metrics surfaced via `/model/info` are tagged with an explicit caveat stating they were
measured by the original training run on its own dataset, not on WasteSense imagery.

---

## 6. Coverage: exactly what is computed

`FeatureEngine` emits `coverage_method` with every response. The three possible values:

| Method | Formula | Bias |
|---|---|---|
| `segmentation_mask_union` | Union of instance masks ÷ image pixels | **Understates** heavily on aggregated waste |
| `bbox_mask_hybrid_union` | `max(mask union, union(masks ∪ detector bboxes))` | Bounding boxes include background inside each rectangle, so this **overstates** object area while partially compensating for missed masks |
| `detector_bbox_union` | Union of detector bboxes only | Overstates per-object; used only when no segmenter output exists |

The hybrid is a **heuristic with no validation**. It is surfaced as
`"Detected Waste Index (indicative)"` with a caveat string in every payload.

---

## 7. Open work

1. **Annotate 300–500 images** (coarse waste polygons + 5-class material + scene type). This gates
   every real accuracy metric, PR curve and confusion matrix.
2. Train a **dense coverage head** to replace the heuristic; validate against human-annotated
   coverage, stratified by scene type.
3. Resolve **Bower and BiaEye licensing**.
4. Extract parameter counts and configuration for the two pLitter checkpoints (YOLOv5 format).
