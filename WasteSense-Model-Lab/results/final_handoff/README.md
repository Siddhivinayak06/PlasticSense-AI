# WasteSense AI: Final Handoff & Experiment Results

This directory contains the consolidated evaluation artifacts, benchmarks, training evidence, and validation reports produced during the WasteSense AI optimization and high-recall detection investigation.

---

## 1. Directory Manifest

| Artifact File | Description | Source / Pipeline Origin |
|---|---|---|
| [`WasteSense_Model_Evaluation_and_Validation_Report.md`](./WasteSense_Model_Evaluation_and_Validation_Report.md) | Comprehensive 10-section model evaluation & validation report | Master project report |
| [`phase1_model_selection_report.md`](./phase1_model_selection_report.md) | Detailed Phase 1 candidate model audit and comparison report | Phase 1 deliverable |
| [`high_recall_before_after_comparison.jpg`](./high_recall_before_after_comparison.jpg) | Side-by-side comparison: Baseline (conf=0.32, 23 items) vs High-Recall (conf=0.18, 33 items) | Kalyan dumpsite test |
| [`phase1_4way_candidate_comparison.jpg`](./phase1_4way_candidate_comparison.jpg) | 4-way visual comparison: BiaEye vs Bower vs TACO vs Roboflow 22-class | Kalyan dumpsite test |
| [`high_recall_ensemble_kalyan.jpg`](./high_recall_ensemble_kalyan.jpg) | High-recall BiaEye (conf=0.18) + TACO segmentation mask composite (36 total items) | Multi-model test |
| [`sweep_biaeye_conf_10.jpg`](./sweep_biaeye_conf_10.jpg) | BiaEye detection at confidence threshold 0.10 (47 clean objects) | Threshold sweep |
| [`sweep_biaeye_conf_15.jpg`](./sweep_biaeye_conf_15.jpg) | BiaEye detection at confidence threshold 0.15 (39 clean objects) | Threshold sweep |
| [`sweep_biaeye_conf_20.jpg`](./sweep_biaeye_conf_20.jpg) | BiaEye detection at confidence threshold 0.20 (28 clean objects) | Threshold sweep |
| [`sweep_biaeye_conf_25.jpg`](./sweep_biaeye_conf_25.jpg) | BiaEye detection at confidence threshold 0.25 (26 clean objects) | Threshold sweep |
| [`sweep_biaeye_conf_32.jpg`](./sweep_biaeye_conf_32.jpg) | BiaEye detection at confidence threshold 0.32 (23 clean objects) | Threshold sweep |
| [`final_cleaned_dumpsite_detection.jpg`](./final_cleaned_dumpsite_detection.jpg) | Full dual-model output with containment deduplication and `% conf` labels | Kalyan dumpsite test |
| [`after_biaeye_detection.jpg`](./after_biaeye_detection.jpg) | Raw BiaEye output before containment deduplication | Initial audit |
| [`evaluation_results.json`](./evaluation_results.json) | Full quantitative multi-model evaluation metrics on target dumpsites | Automated benchmark |
| [`benchmark_summary.csv`](./benchmark_summary.csv) | Summary latency, detection counts, and VRAM across all tested models | Benchmark run |
| [`benchmark_per_image.csv`](./benchmark_per_image.csv) | Per-image detection breakdown across 31 target-domain test scenes | Benchmark run |
| [`training_evidence_manifest.json`](./training_evidence_manifest.json) | Verified training parameters, loss series, and best epoch metrics from checkpoints | Extracted metadata |
| [`biaeye_6cls_curves.csv`](./biaeye_6cls_curves.csv) | Original training and validation curves for BiaEye YOLO11s (80 epochs) | Checkpoint extraction |
| [`taco_segmentation_curves.csv`](./taco_segmentation_curves.csv) | Original training curves for TACO YOLO11s-seg (80 epochs) | Checkpoint extraction |
| [`github_best_22cls_curves.csv`](./github_best_22cls_curves.csv) | Training curves for Roboflow 22-class YOLOv8n (20 epochs) | Checkpoint extraction |
| [`plasticsense_detector_curves.csv`](./plasticsense_detector_curves.csv) | Training curves for PlasticSense YOLO11s baseline (120 epochs) | Checkpoint extraction |
| [`model_figure_pack/`](./model_figure_pack/) | Directory containing original PR curves, normalized confusion matrices, and multi-panel figures | Extracted package |

---

## 2. Active Model Checkpoints & Settings

The running application is configured with the following verified settings:

- **Primary Detector**: [`models/external/biaeye-yolo11s/best.pt`](file:///home/bipin/Documents/PlasticSense-AI/models/external/biaeye-yolo11s/best.pt)
  - Architecture: YOLO11s (9.43M params)
  - Native Input Resolution: $960\times 960\text{ px}$
  - Confidence Threshold: `0.18` (High-Recall Mode)
  - NMS IoU Threshold: `0.45`
  - Post-NMS Containment Deduplication: $\text{IoM} \ge 0.80$ (suppresses nested duplicates of the same class)
- **Primary Segmenter**: [`Ml-model/handoff_to_cachyos/models/taco_segmentation_best.pt`](file:///home/bipin/Documents/PlasticSense-AI/Ml-model/handoff_to_cachyos/models/taco_segmentation_best.pt)
  - Architecture: YOLO11s-seg (10.08M params)
  - Confidence Threshold: `0.25`
  - Function: Surface area waste density and polygon boundary segmentation

---

## 3. What Was Verified

1. **High-Recall Visibility Gain**: Lowering the confidence threshold from 0.32 to 0.18 recovers **10 additional genuine physical waste objects** on the Kalyan dumpsite image (increasing clean items from 23 to 33, a +43% gain) with zero false-positive detections on background soil or sky.
2. **Containment Deduplication**: Eliminates nested bounding boxes where a smaller detection is $\ge 80\%$ engulfed within a larger box of the same class, preserving touching, separate physical objects.
3. **End-to-End Pipeline**: Verified via FastAPI TestClient (`test_e2e_inproc.py`). HTTP 201 Created with 33 items, 6.85% surface coverage index, and soft authenticity screening.
4. **Test Suite**: 39 backend pytest unit and integration tests passing; 0 TypeScript errors on frontend.
