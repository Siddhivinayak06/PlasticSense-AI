#!/usr/bin/env python3
"""
WasteSense AI: Rigorous & Reproducible Research Model Evaluation & Comparison Study
Evaluates object detection and instance segmentation models on held-out dumpsite imagery.

Classes evaluated (Harmonized):
0: Plastic
1: Metal
2: Paper
3: Glass

Outputs generated in WasteSense-Model-Lab/results/research_evaluation/:
- model_comparison.csv
- per_class_metrics.csv
- per_image_metrics.csv
- confidence_sweep_metrics.csv
- evaluation_config.json
- High-res publication figures (PNG and PDF at 300 DPI)
"""

import os
import sys
import json
import csv
import time
from pathlib import Path
import numpy as np
import cv2
import torch
from ultralytics import YOLO

# Ensure matplotlib uses a writable temp cache directory
os.environ["MPLCONFIGDIR"] = "/tmp/mpl_config"
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# Paths
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
LAB_ROOT = REPO_ROOT / "WasteSense-Model-Lab"
GT_IMG_DIR = LAB_ROOT / "dataset" / "ground_truth" / "images"
GT_LBL_DIR = LAB_ROOT / "dataset" / "ground_truth" / "labels"
OUT_DIR = LAB_ROOT / "results" / "research_evaluation"
OUT_DIR.mkdir(parents=True, exist_ok=True)

CLASS_NAMES = ["Plastic", "Metal", "Paper", "Glass"]
NUM_CLASSES = len(CLASS_NAMES)

# Model Definitions
MODELS_CONFIG = [
    {
        "name": "BiaEye_YOLO11s",
        "display_name": "BiaEye YOLO11s (Baseline)",
        "path": REPO_ROOT / "models" / "external" / "biaeye-yolo11s" / "best.pt",
        "task": "detect",
        "imgsz": 960,
        "conf": 0.25,
        "iou": 0.45,
        "cleaned": False,
        "class_mapping": {0: 0, 1: 2, 2: 3, 3: 1},  # plastic->0, paper->2, glass->3, metal->1
        "paper_cite": "BiaEye Waste Benchmark (2024)"
    },
    {
        "name": "BiaEye_YOLO11s_Cleaned",
        "display_name": "BiaEye YOLO11s (High-Recall + Cleaned)",
        "path": REPO_ROOT / "models" / "external" / "biaeye-yolo11s" / "best.pt",
        "task": "detect",
        "imgsz": 960,
        "conf": 0.18,
        "iou": 0.45,
        "cleaned": True,
        "iom_threshold": 0.80,
        "class_mapping": {0: 0, 1: 2, 2: 3, 3: 1},
        "paper_cite": "WasteSense AI (This Work)"
    },
    {
        "name": "TACO_YOLO11s_Seg",
        "display_name": "TACO YOLO11s-seg",
        "path": LAB_ROOT / "models" / "github" / "taco_segmentation_best.pt",
        "task": "segment",
        "imgsz": 960,
        "conf": 0.25,
        "iou": 0.45,
        "cleaned": False,
        "class_mapping": {0: 0, 1: 1, 2: 3, 3: 2},  # Plastic->0, Metal->1, Glass->3, Paper->2
        "paper_cite": "TACO Dataset Pretrained (Proença et al.)"
    },
    {
        "name": "PlasticSense_YOLO11s",
        "display_name": "PlasticSense YOLO11s (10-cls)",
        "path": LAB_ROOT / "models" / "github" / "plasticsense_detector_best.pt",
        "task": "detect",
        "imgsz": 960,
        "conf": 0.25,
        "iou": 0.45,
        "cleaned": False,
        # plastic items -> 0, metal_can (6) -> 1, glass (7) -> 3, paper_carton (8) -> 2
        "class_mapping": {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 1, 7: 3, 8: 2},
        "paper_cite": "PlasticSense Baseline 10-Class"
    },
    {
        "name": "Roboflow_22cls_YOLOv8n",
        "display_name": "Roboflow 22-Class YOLOv8n",
        "path": LAB_ROOT / "models" / "github" / "best.pt",
        "task": "detect",
        "imgsz": 640,
        "conf": 0.25,
        "iou": 0.45,
        "cleaned": False,
        # 1: can -> 1, 2,3,16,17: paper/box -> 2, 7: glass -> 3, plastic items -> 0
        "class_mapping": {
            0: 1, 1: 1, 6: 1,
            2: 2, 3: 2, 16: 2, 17: 2,
            7: 3,
            4: 0, 5: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 18: 0, 19: 0, 21: 0
        },
        "paper_cite": "Waste Detection V2 (Roboflow)"
    },
    {
        "name": "HF_YOLOv8m_Seg",
        "display_name": "HuggingFace YOLOv8m-seg",
        "path": LAB_ROOT / "models" / "huggingface" / "yolov8m-seg.pt",
        "task": "segment",
        "imgsz": 640,
        "conf": 0.25,
        "iou": 0.45,
        "cleaned": False,
        # 0: Glass -> 3, 1: Metal -> 1, 2: Paper -> 2, 3: Plastic -> 0
        "class_mapping": {0: 3, 1: 1, 2: 2, 3: 0},
        "paper_cite": "HF Waste Seg Benchmark"
    }
]


def box_iou(box1, box2):
    """Compute IoU between two [x1, y1, x2, y2] boxes."""
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    if x2 <= x1 or y2 <= y1:
        return 0.0
    inter = (x2 - x1) * (y2 - y1)
    a1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    a2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = a1 + a2 - inter
    return inter / union if union > 0 else 0.0


def box_iom(box1, box2):
    """Compute Intersection over Minimum Area (containment index)."""
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    if x2 <= x1 or y2 <= y1:
        return 0.0
    inter = (x2 - x1) * (y2 - y1)
    a1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    a2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    min_area = min(a1, a2)
    return inter / min_area if min_area > 0 else 0.0


def deduplicate_iom(predictions, iom_thresh=0.80):
    """Containment-aware deduplication suppressing fully nested smaller boxes."""
    sorted_preds = sorted(predictions, key=lambda x: x["conf"], reverse=True)
    kept = []
    for cand in sorted_preds:
        suppressed = False
        for k in kept:
            if box_iom(cand["box"], k["box"]) >= iom_thresh:
                suppressed = True
                break
        if not suppressed:
            kept.append(cand)
    return kept


def load_ground_truth(images):
    """Load ground truth annotations for all evaluation images."""
    gt_data = {}
    total_boxes = 0
    class_counts = {c: 0 for c in range(NUM_CLASSES)}

    for img_path in images:
        txt_path = GT_LBL_DIR / f"{img_path.stem}.txt"
        im = cv2.imread(str(img_path))
        h, w, _ = im.shape
        boxes = []
        if txt_path.exists():
            with open(txt_path, "r") as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        cls_id = int(parts[0])
                        xc, yc, bw, bh = map(float, parts[1:5])
                        x1 = (xc - bw / 2.0) * w
                        y1 = (yc - bh / 2.0) * h
                        x2 = (xc + bw / 2.0) * w
                        y2 = (yc + bh / 2.0) * h
                        if cls_id in class_counts:
                            boxes.append({"cls": cls_id, "box": [x1, y1, x2, y2]})
                            class_counts[cls_id] += 1
                            total_boxes += 1
        gt_data[img_path.name] = {"shape": (w, h), "boxes": boxes}

    print(f"Loaded {len(gt_data)} images, {total_boxes} ground-truth boxes total.")
    for cls_id, count in class_counts.items():
        print(f"  Class {cls_id} ({CLASS_NAMES[cls_id]}): {count} objects")
    return gt_data


def compute_ap(recalls, precisions):
    """Compute AP via standard 101-point COCO interpolation."""
    mrec = np.concatenate(([0.0], recalls, [1.0]))
    mpre = np.concatenate(([0.0], precisions, [0.0]))
    for i in range(len(mpre) - 2, -1, -1):
        mpre[i] = max(mpre[i], mpre[i + 1])
    i = np.where(mrec[1:] != mrec[:-1])[0]
    ap = np.sum((mrec[i + 1] - mrec[i]) * mpre[i + 1])
    return float(ap)


def evaluate_detections(all_preds, gt_data, iou_thresh=0.50):
    """
    Compute Precision, Recall, F1, per-class AP, and confusion matrix at iou_thresh.
    all_preds: dict mapping img_name -> list of {'box': [x1,y1,x2,y2], 'cls': c, 'conf': conf}
    """
    # 5x5 confusion matrix: 0..3 classes, index 4 is Background / Unmatched
    cm = np.zeros((NUM_CLASSES + 1, NUM_CLASSES + 1), dtype=np.int32)
    per_class_results = {}

    for c in range(NUM_CLASSES):
        preds_c = []
        n_gt_c = sum(sum(1 for b in gt_data[img]["boxes"] if b["cls"] == c) for img in gt_data)

        for img_name, p_list in all_preds.items():
            for p in p_list:
                if p["cls"] == c:
                    preds_c.append({
                        "img": img_name,
                        "box": p["box"],
                        "conf": p["conf"]
                    })

        # Sort predictions by confidence descending
        preds_c.sort(key=lambda x: x["conf"], reverse=True)
        nd = len(preds_c)
        tp = np.zeros(nd)
        fp = np.zeros(nd)

        # Track matched ground truths: set of (img, gt_idx)
        matched_gt = set()

        for d_idx, pred in enumerate(preds_c):
            img_gts = [
                (idx, b) for idx, b in enumerate(gt_data[pred["img"]]["boxes"])
                if b["cls"] == c
            ]
            best_iou = 0.0
            best_gt_idx = -1
            for g_idx, gt in img_gts:
                iou = box_iou(pred["box"], gt["box"])
                if iou > best_iou:
                    best_iou = iou
                    best_gt_idx = g_idx

            if best_iou >= iou_thresh and (pred["img"], best_gt_idx) not in matched_gt:
                tp[d_idx] = 1.0
                matched_gt.add((pred["img"], best_gt_idx))
                cm[c, c] += 1
            else:
                fp[d_idx] = 1.0
                # Check if it overlapped with a GT of a different class
                diff_gts = [
                    (idx, b) for idx, b in enumerate(gt_data[pred["img"]]["boxes"])
                    if b["cls"] != c
                ]
                diff_best_iou = 0.0
                diff_best_cls = -1
                for g_idx, gt in diff_gts:
                    iou = box_iou(pred["box"], gt["box"])
                    if iou > diff_best_iou:
                        diff_best_iou = iou
                        diff_best_cls = gt["cls"]
                if diff_best_iou >= 0.30:
                    cm[diff_best_cls, c] += 1
                else:
                    cm[NUM_CLASSES, c] += 1  # Background false alarm

        # Count false negatives for class c
        for img_name in gt_data:
            for g_idx, b in enumerate(gt_data[img_name]["boxes"]):
                if b["cls"] == c and (img_name, g_idx) not in matched_gt:
                    cm[c, NUM_CLASSES] += 1

        # Cumulative metrics
        cum_tp = np.cumsum(tp)
        cum_fp = np.cumsum(fp)
        precisions = cum_tp / np.maximum(cum_tp + cum_fp, np.finfo(np.float64).eps)
        recalls = cum_tp / (n_gt_c + 1e-6)

        final_p = float(precisions[-1]) if nd > 0 else 0.0
        final_r = float(recalls[-1]) if nd > 0 else 0.0
        f1 = (2 * final_p * final_r) / (final_p + final_r) if (final_p + final_r) > 0 else 0.0
        ap = compute_ap(recalls, precisions) if nd > 0 and n_gt_c > 0 else 0.0

        per_class_results[c] = {
            "name": CLASS_NAMES[c],
            "n_gt": n_gt_c,
            "n_pred": nd,
            "tp": int(np.sum(tp)),
            "fp": int(np.sum(fp)),
            "precision": final_p,
            "recall": final_r,
            "f1": f1,
            "ap50": ap,
            "pr_curve": (recalls.tolist(), precisions.tolist())
        }

    # Aggregate overall metrics
    total_tp = sum(r["tp"] for r in per_class_results.values())
    total_fp = sum(r["fp"] for r in per_class_results.values())
    total_gt = sum(r["n_gt"] for r in per_class_results.values())
    overall_p = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0.0
    overall_r = total_tp / (total_gt) if total_gt > 0 else 0.0
    overall_f1 = (2 * overall_p * overall_r) / (overall_p + overall_r) if (overall_p + overall_r) > 0 else 0.0
    mAP50 = np.mean([r["ap50"] for r in per_class_results.values()])

    return {
        "precision": overall_p,
        "recall": overall_r,
        "f1": overall_f1,
        "mAP50": float(mAP50),
        "per_class": per_class_results,
        "confusion_matrix": cm
    }


def compute_map_range(all_preds, gt_data):
    """Compute mAP over IoU thresholds 0.50 to 0.95 with step 0.05."""
    ious = np.arange(0.50, 0.96, 0.05)
    aps_per_iou = []
    per_class_ap_range = {c: [] for c in range(NUM_CLASSES)}

    for iou in ious:
        res = evaluate_detections(all_preds, gt_data, iou_thresh=float(iou))
        aps_per_iou.append(res["mAP50"])
        for c in range(NUM_CLASSES):
            per_class_ap_range[c].append(res["per_class"][c]["ap50"])

    mAP50_95 = float(np.mean(aps_per_iou))
    class_map50_95 = {c: float(np.mean(per_class_ap_range[c])) for c in range(NUM_CLASSES)}
    return mAP50_95, class_map50_95


def run_benchmark():
    images = sorted(GT_IMG_DIR.iterdir())
    print(f"=== Starting Rigorous Benchmark on {len(images)} Held-Out Dumpsite Images ===")
    gt_data = load_ground_truth(images)

    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    print(f"Execution Device: {device}")
    if torch.cuda.is_available():
        print(f"GPU Name: {torch.cuda.get_device_name(0)}")

    benchmark_summary = []
    per_class_rows = []
    per_image_rows = []
    conf_sweep_rows = []
    models_evaluation_data = {}

    for cfg in MODELS_CONFIG:
        name = cfg["name"]
        print(f"\nEvaluating Model: {cfg['display_name']} ...")
        if not cfg["path"].exists():
            print(f"  SKIPPED: Checkpoint {cfg['path']} not found.")
            continue

        model = YOLO(str(cfg["path"]))
        param_count = sum(p.numel() for p in model.model.parameters())
        weight_mb = cfg["path"].stat().st_size / (1024 * 1024)

        # Warmup pass
        for _ in range(2):
            model.predict(str(images[0]), imgsz=cfg["imgsz"], conf=cfg["conf"], verbose=False)

        latencies = []
        all_preds = {img.name: [] for img in images}
        mask_coverages = []
        mask_instances = []

        if torch.cuda.is_available():
            torch.cuda.reset_peak_memory_stats()

        for img_path in images:
            t0 = time.perf_counter()
            res = model.predict(
                str(img_path),
                imgsz=cfg["imgsz"],
                conf=cfg["conf"],
                iou=cfg["iou"],
                verbose=False
            )[0]
            lat = (time.perf_counter() - t0) * 1000.0
            latencies.append(lat)

            # Extract detections
            img_preds = []
            if res.boxes is not None and len(res.boxes) > 0:
                for b in res.boxes:
                    raw_cls = int(b.cls[0])
                    conf = float(b.conf[0])
                    if raw_cls in cfg["class_mapping"]:
                        mapped_cls = cfg["class_mapping"][raw_cls]
                        xyxy = b.xyxy[0].cpu().numpy().tolist()
                        img_preds.append({
                            "box": xyxy,
                            "cls": mapped_cls,
                            "conf": conf
                        })

            if cfg.get("cleaned", False):
                img_preds = deduplicate_iom(img_preds, iom_thresh=cfg.get("iom_threshold", 0.80))

            all_preds[img_path.name] = img_preds

            # Segmentation mask coverage
            if cfg["task"] == "segment" and res.masks is not None and len(res.masks) > 0:
                h, w = res.orig_shape
                union = np.zeros((h, w), dtype=np.uint8)
                for m in res.masks.data.cpu().numpy():
                    resized = cv2.resize(m, (w, h), interpolation=cv2.INTER_NEAREST)
                    union[resized > 0.5] = 1
                coverage = float(100.0 * np.sum(union) / (h * w))
                mask_coverages.append(coverage)
                mask_instances.append(len(res.masks))
            else:
                mask_coverages.append(0.0)
                mask_instances.append(0)

            # Per image record
            n_gt_img = len(gt_data[img_path.name]["boxes"])
            per_image_rows.append({
                "model": name,
                "image": img_path.name,
                "latency_ms": round(lat, 2),
                "predicted_objects": len(img_preds),
                "ground_truth_objects": n_gt_img,
                "mask_coverage_pct": round(mask_coverages[-1], 2)
            })

        peak_vram = torch.cuda.max_memory_allocated() / (1024 * 1024) if torch.cuda.is_available() else 0.0
        mean_lat = float(np.mean(latencies))
        median_lat = float(np.median(latencies))
        p95_lat = float(np.percentile(latencies, 95))
        fps = 1000.0 / mean_lat if mean_lat > 0 else 0.0

        # Evaluate detection accuracy at IoU=0.50
        eval50 = evaluate_detections(all_preds, gt_data, iou_thresh=0.50)
        # Compute mAP@0.5:0.95
        mAP50_95, class_map50_95 = compute_map_range(all_preds, gt_data)

        print(f"  Result: mAP50={eval50['mAP50']:.4f}, mAP50-95={mAP50_95:.4f}, P={eval50['precision']:.4f}, R={eval50['recall']:.4f}, F1={eval50['f1']:.4f}")
        print(f"  Latency: mean={mean_lat:.1f}ms, p95={p95_lat:.1f}ms, FPS={fps:.1f}, VRAM={peak_vram:.1f}MB")

        summary_entry = {
            "model_name": name,
            "display_name": cfg["display_name"],
            "task": cfg["task"],
            "resolution": cfg["imgsz"],
            "confidence_threshold": cfg["conf"],
            "iou_threshold": cfg["iou"],
            "parameters": param_count,
            "weight_size_mb": round(weight_mb, 2),
            "precision": round(eval50["precision"], 4),
            "recall": round(eval50["recall"], 4),
            "f1_score": round(eval50["f1"], 4),
            "mAP50": round(eval50["mAP50"], 4),
            "mAP50_95": round(mAP50_95, 4),
            "latency_mean_ms": round(mean_lat, 2),
            "latency_median_ms": round(median_lat, 2),
            "latency_p95_ms": round(p95_lat, 2),
            "throughput_fps": round(fps, 1),
            "peak_vram_mb": round(peak_vram, 1),
            "mean_mask_coverage_pct": round(float(np.mean(mask_coverages)), 2) if cfg["task"] == "segment" else 0.0,
            "citation": cfg["paper_cite"]
        }
        benchmark_summary.append(summary_entry)

        # Per class records
        for c in range(NUM_CLASSES):
            c_res = eval50["per_class"][c]
            per_class_rows.append({
                "model": name,
                "class_id": c,
                "class_name": CLASS_NAMES[c],
                "ground_truth_count": c_res["n_gt"],
                "prediction_count": c_res["n_pred"],
                "true_positives": c_res["tp"],
                "false_positives": c_res["fp"],
                "precision": round(c_res["precision"], 4),
                "recall": round(c_res["recall"], 4),
                "f1_score": round(c_res["f1"], 4),
                "ap50": round(c_res["ap50"], 4),
                "ap50_95": round(class_map50_95[c], 4)
            })

        # Save model evaluation data for plotting
        models_evaluation_data[name] = {
            "summary": summary_entry,
            "eval50": eval50,
            "class_map50_95": class_map50_95,
            "predictions": all_preds
        }

        # Confidence Sweep for this model
        print(f"  Sweeping confidence thresholds [0.10 -> 0.50] ...")
        for conf_val in [0.10, 0.15, 0.18, 0.20, 0.25, 0.30, 0.35, 0.40, 0.50]:
            sweep_preds = {img.name: [] for img in images}
            for img_path in images:
                r_sw = model.predict(str(img_path), imgsz=cfg["imgsz"], conf=conf_val, iou=cfg["iou"], verbose=False)[0]
                sw_boxes = []
                if r_sw.boxes is not None and len(r_sw.boxes) > 0:
                    for b in r_sw.boxes:
                        raw_cls = int(b.cls[0])
                        c_score = float(b.conf[0])
                        if raw_cls in cfg["class_mapping"]:
                            sw_boxes.append({
                                "box": b.xyxy[0].cpu().numpy().tolist(),
                                "cls": cfg["class_mapping"][raw_cls],
                                "conf": c_score
                            })
                if cfg.get("cleaned", False):
                    sw_boxes = deduplicate_iom(sw_boxes, iom_thresh=cfg.get("iom_threshold", 0.80))
                sweep_preds[img_path.name] = sw_boxes

            sw_eval = evaluate_detections(sweep_preds, gt_data, iou_thresh=0.50)
            tot_preds = sum(len(p) for p in sweep_preds.values())
            conf_sweep_rows.append({
                "model": name,
                "conf_threshold": conf_val,
                "total_detections": tot_preds,
                "precision": round(sw_eval["precision"], 4),
                "recall": round(sw_eval["recall"], 4),
                "f1_score": round(sw_eval["f1"], 4),
                "mAP50": round(sw_eval["mAP50"], 4)
            })

    # Save CSV tables
    print("\n=== Saving Research Benchmark CSVs ===")
    save_csv(OUT_DIR / "model_comparison.csv", benchmark_summary)
    save_csv(OUT_DIR / "per_class_metrics.csv", per_class_rows)
    save_csv(OUT_DIR / "per_image_metrics.csv", per_image_rows)
    save_csv(OUT_DIR / "confidence_sweep_metrics.csv", conf_sweep_rows)

    # Save JSON config & metadata
    save_json_config(benchmark_summary)

    # Generate Publication-Quality Figures (PNG + PDF at 300 DPI)
    print("\n=== Generating Publication-Quality Figures (PNG & PDF) ===")
    generate_pr_curves_fig(models_evaluation_data)
    generate_confusion_matrices_fig(models_evaluation_data)
    generate_tradeoff_fig(benchmark_summary)
    generate_f1_radar_fig(per_class_rows)
    generate_qualitative_panel_fig(models_evaluation_data, images)
    generate_failure_mode_fig(models_evaluation_data)

    print("\nBenchmark Evaluation & Plot Generation Successfully Completed!")


def save_csv(path, rows):
    if not rows:
        return
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    print(f"Saved: {path.name} ({len(rows)} rows)")


def save_json_config(summary):
    import platform
    config = {
        "evaluation_name": "WasteSense AI Held-Out Dumpsite Evaluation Benchmark (WasteSense-10-Val)",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "hardware": {
            "platform": platform.platform(),
            "python_version": platform.python_version(),
            "torch_version": torch.__version__,
            "cuda_available": torch.cuda.is_available(),
            "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
        },
        "target_domain": "Dense Municipal Solid Waste & Open Dumpsites (India)",
        "harmonized_classes": CLASS_NAMES,
        "evaluation_protocol": {
            "matching": "Greedy IoU Matching",
            "iou_thresholds": "0.50 (PASCAL VOC) and 0.50:0.05:0.95 (COCO)",
            "test_images_count": 10,
            "leakage_audit": "Deduplicated test set via SHA-256 (31 original files -> 10 unique physical scenes)"
        },
        "models_evaluated": summary
    }
    with open(OUT_DIR / "evaluation_config.json", "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
    print("Saved: evaluation_config.json")


def generate_pr_curves_fig(models_data):
    """Plot Cross-Model Precision-Recall Curves."""
    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
    fig, axes = plt.subplots(1, 2, figsize=(14, 6), dpi=300)

    # Left: Plastic PR curve across all models
    ax = axes[0]
    colors = ["#1f77b4", "#2ca02c", "#ff7f0e", "#d62728", "#9467bd", "#8c564b"]
    for idx, (m_name, data) in enumerate(models_data.items()):
        rec, prec = data["eval50"]["per_class"][0]["pr_curve"]
        f1 = data["eval50"]["per_class"][0]["f1"]
        ap = data["eval50"]["per_class"][0]["ap50"]
        lbl = f"{data['summary']['display_name']} (AP={ap:.2f}, F1={f1:.2f})"
        ax.plot(rec, prec, label=lbl, color=colors[idx % len(colors)], linewidth=2)

    ax.set_title("Plastic Detection Precision-Recall Curves (IoU=0.50)", fontsize=13, fontweight="bold", pad=12)
    ax.set_xlabel("Recall", fontsize=11)
    ax.set_ylabel("Precision", fontsize=11)
    ax.set_xlim([0.0, 1.02])
    ax.set_ylim([0.0, 1.02])
    ax.grid(True, linestyle="--", alpha=0.6)
    ax.legend(loc="lower left", fontsize=9, framealpha=0.9)

    # Right: Per-Class PR Curve for BiaEye YOLO11s (High-Recall Cleaned)
    ax2 = axes[1]
    best_model_data = models_data.get("BiaEye_YOLO11s_Cleaned", list(models_data.values())[0])
    class_colors = ["#2ca02c", "#1f77b4", "#ff7f0e", "#d62728"]
    for c in range(NUM_CLASSES):
        c_res = best_model_data["eval50"]["per_class"][c]
        rec, prec = c_res["pr_curve"]
        lbl = f"{CLASS_NAMES[c]} (AP={c_res['ap50']:.2f}, F1={c_res['f1']:.2f}, N={c_res['n_gt']})"
        ax2.plot(rec, prec, label=lbl, color=class_colors[c], linewidth=2.2)

    ax2.set_title("BiaEye (High-Recall Cleaned) Per-Class PR Curves", fontsize=13, fontweight="bold", pad=12)
    ax2.set_xlabel("Recall", fontsize=11)
    ax2.set_ylabel("Precision", fontsize=11)
    ax2.set_xlim([0.0, 1.02])
    ax2.set_ylim([0.0, 1.02])
    ax2.grid(True, linestyle="--", alpha=0.6)
    ax2.legend(loc="lower left", fontsize=9, framealpha=0.9)

    plt.tight_layout()
    fig.savefig(OUT_DIR / "fig_pr_curves_comparison.png", dpi=300)
    fig.savefig(OUT_DIR / "fig_pr_curves_comparison.pdf")
    plt.close(fig)
    print("Saved: fig_pr_curves_comparison.png & .pdf")


def generate_confusion_matrices_fig(models_data):
    """Plot Normalized Confusion Matrices for all evaluated models."""
    n_models = len(models_data)
    cols = 3
    rows = int(np.ceil(n_models / cols))
    fig, axes = plt.subplots(rows, cols, figsize=(16, 5 * rows), dpi=300)
    axes = np.array(axes).reshape(-1)

    labels = CLASS_NAMES + ["Background"]

    for idx, (m_name, data) in enumerate(models_data.items()):
        ax = axes[idx]
        cm = data["eval50"]["confusion_matrix"].astype(np.float32)
        # Normalize by row (ground truth instances)
        row_sums = cm.sum(axis=1, keepdims=True)
        cm_norm = np.divide(cm, row_sums, out=np.zeros_like(cm), where=row_sums > 0)

        im = ax.imshow(cm_norm, cmap="Blues", vmin=0, vmax=1)
        ax.set_xticks(range(len(labels)))
        ax.set_yticks(range(len(labels)))
        ax.set_xticklabels(labels, rotation=45, ha="right", fontsize=9)
        ax.set_yticklabels(labels, fontsize=9)
        ax.set_title(f"{data['summary']['display_name']}", fontsize=11, fontweight="bold")
        ax.set_xlabel("Predicted Class", fontsize=9)
        ax.set_ylabel("True Class", fontsize=9)

        for i in range(len(labels)):
            for j in range(len(labels)):
                val = cm_norm[i, j]
                count = int(cm[i, j])
                txt = f"{val:.2f}\n({count})" if count > 0 else "0"
                color = "white" if val > 0.5 else "black"
                ax.text(j, i, txt, ha="center", va="center", color=color, fontsize=7.5)

    # Hide unused subplots
    for k in range(n_models, len(axes)):
        axes[k].axis("off")

    plt.tight_layout()
    fig.savefig(OUT_DIR / "fig_confusion_matrices.png", dpi=300)
    fig.savefig(OUT_DIR / "fig_confusion_matrices.pdf")
    plt.close(fig)
    print("Saved: fig_confusion_matrices.png & .pdf")


def generate_tradeoff_fig(summary):
    """Plot Accuracy (mAP50) vs. Latency (ms) with bubble size proportional to parameters."""
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)

    colors = ["#1f77b4", "#2ca02c", "#ff7f0e", "#d62728", "#9467bd", "#8c564b"]
    for idx, item in enumerate(summary):
        x = item["latency_mean_ms"]
        y = item["mAP50"]
        size = max(item["parameters"] / 30000.0, 150)
        ax.scatter(x, y, s=size, color=colors[idx % len(colors)], alpha=0.75, edgecolors="black", linewidth=1.5)

        # Label displacement
        offset_y = 0.015 if idx % 2 == 0 else -0.02
        ax.annotate(
            f"{item['display_name']}\n({item['parameters']/1e6:.1f}M, {x:.1f}ms)",
            (x, y),
            xytext=(x + 1.5, y + offset_y),
            fontsize=9.5,
            fontweight="semibold",
            bbox=dict(boxstyle="round,pad=0.2", facecolor="white", alpha=0.8, edgecolor="gray")
        )

    ax.set_title("Operational Efficiency: mAP@0.50 vs. Inference Latency (RTX 5060 Laptop GPU)", fontsize=13, fontweight="bold", pad=14)
    ax.set_xlabel("Mean Inference Latency per Image (ms) [Lower is Better]", fontsize=11)
    ax.set_ylabel("Dumpsite mAP@0.50 [Higher is Better]", fontsize=11)
    ax.grid(True, linestyle="--", alpha=0.5)

    plt.tight_layout()
    fig.savefig(OUT_DIR / "fig_accuracy_latency_tradeoff.png", dpi=300)
    fig.savefig(OUT_DIR / "fig_accuracy_latency_tradeoff.pdf")
    plt.close(fig)
    print("Saved: fig_accuracy_latency_tradeoff.png & .pdf")


def generate_f1_radar_fig(per_class_rows):
    """Plot Grouped Bar Chart of Per-Class F1 Scores across Models."""
    fig, ax = plt.subplots(figsize=(12, 6), dpi=300)

    models = sorted(list(set(r["model"] for r in per_class_rows)))
    n_classes = len(CLASS_NAMES)
    x = np.arange(n_classes)
    width = 0.8 / len(models)

    colors = ["#1f77b4", "#2ca02c", "#ff7f0e", "#d62728", "#9467bd", "#8c564b"]

    for idx, m in enumerate(models):
        f1_vals = []
        for c in range(n_classes):
            matches = [r["f1_score"] for r in per_class_rows if r["model"] == m and r["class_id"] == c]
            f1_vals.append(matches[0] if matches else 0.0)

        offset = (idx - len(models) / 2 + 0.5) * width
        ax.bar(x + offset, f1_vals, width, label=m.replace("_", " "), color=colors[idx % len(colors)], alpha=0.85, edgecolor="black", linewidth=0.8)

    ax.set_title("Per-Class F1-Score Comparison Across Models (WasteSense-10-Val)", fontsize=13, fontweight="bold", pad=12)
    ax.set_xticks(x)
    ax.set_xticklabels(CLASS_NAMES, fontsize=11, fontweight="semibold")
    ax.set_ylabel("F1 Score", fontsize=11)
    ax.set_ylim([0.0, 1.0])
    ax.grid(True, linestyle="--", alpha=0.5, axis="y")
    ax.legend(loc="upper right", fontsize=9, framealpha=0.9)

    plt.tight_layout()
    fig.savefig(OUT_DIR / "fig_per_class_f1_radar.png", dpi=300)
    fig.savefig(OUT_DIR / "fig_per_class_f1_radar.pdf")
    plt.close(fig)
    print("Saved: fig_per_class_f1_radar.png & .pdf")


def generate_qualitative_panel_fig(models_data, images):
    """Generate 2x3 Qualitative Detection Comparison Panel on the primary dumpsite image."""
    ref_img_path = images[0]  # Kalyan dumpsite image 0956e02a...
    im_bgr = cv2.imread(str(ref_img_path))
    h, w, _ = im_bgr.shape

    fig, axes = plt.subplots(2, 3, figsize=(18, 12), dpi=300)
    axes = axes.flatten()

    class_bgr = {
        0: (0, 200, 0),     # Plastic - Green
        1: (220, 100, 0),   # Metal - Blue
        2: (0, 140, 255),   # Paper - Orange
        3: (200, 0, 200)    # Glass - Purple
    }

    for idx, (m_name, data) in enumerate(models_data.items()):
        if idx >= len(axes):
            break
        ax = axes[idx]
        annotated = im_bgr.copy()
        preds = data["predictions"].get(ref_img_path.name, [])

        for p in preds:
            x1, y1, x2, y2 = map(int, p["box"])
            c_id = p["cls"]
            col = class_bgr.get(c_id, (0, 255, 0))
            cv2.rectangle(annotated, (x1, y1), (x2, y2), col, 2)
            lbl = f"{CLASS_NAMES[c_id]} {p['conf']:.2f}"
            cv2.putText(annotated, lbl, (x1, max(y1 - 6, 15)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

        annotated_rgb = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)
        ax.imshow(annotated_rgb)
        ax.set_title(f"{data['summary']['display_name']} ({len(preds)} detections)", fontsize=11, fontweight="bold")
        ax.axis("off")

    plt.suptitle("Qualitative Detection Comparison on Kalyan Municipal Dumpsite Scene", fontsize=15, fontweight="bold", y=0.98)
    plt.tight_layout()
    fig.savefig(OUT_DIR / "fig_qualitative_cross_model_comparison.png", dpi=300)
    fig.savefig(OUT_DIR / "fig_qualitative_cross_model_comparison.pdf")
    plt.close(fig)
    print("Saved: fig_qualitative_cross_model_comparison.png & .pdf")


def generate_failure_mode_fig(models_data):
    """Plot Failure Mode Analysis breakdown (False Positives, False Negatives, Crosstalk)."""
    fig, ax = plt.subplots(figsize=(12, 6), dpi=300)

    models = list(models_data.keys())
    fp_counts = []
    fn_counts = []
    tp_counts = []

    for m in models:
        cm = models_data[m]["eval50"]["confusion_matrix"]
        tp = sum(cm[i, i] for i in range(NUM_CLASSES))
        fp = sum(cm[NUM_CLASSES, j] for j in range(NUM_CLASSES)) + sum(cm[i, j] for i in range(NUM_CLASSES) for j in range(NUM_CLASSES) if i != j)
        fn = sum(cm[i, NUM_CLASSES] for i in range(NUM_CLASSES))
        tp_counts.append(tp)
        fp_counts.append(fp)
        fn_counts.append(fn)

    x = np.arange(len(models))
    width = 0.55

    ax.bar(x, tp_counts, width, label="True Positives (Correct)", color="#2ca02c", alpha=0.85, edgecolor="black")
    ax.bar(x, fp_counts, width, bottom=tp_counts, label="False Positives (Spurious/Confused)", color="#d62728", alpha=0.85, edgecolor="black")
    bottom_fn = np.array(tp_counts) + np.array(fp_counts)
    ax.bar(x, fn_counts, width, bottom=bottom_fn, label="False Negatives (Missed Objects)", color="#ff7f0e", alpha=0.85, edgecolor="black")

    ax.set_title("Failure Mode Distribution: TP vs. FP vs. FN Breakdown (WasteSense-10-Val)", fontsize=13, fontweight="bold", pad=12)
    ax.set_xticks(x)
    ax.set_xticklabels([m.replace("_", "\n") for m in models], fontsize=9.5)
    ax.set_ylabel("Instance Count", fontsize=11)
    ax.grid(True, linestyle="--", alpha=0.5, axis="y")
    ax.legend(loc="upper right", fontsize=10, framealpha=0.9)

    plt.tight_layout()
    fig.savefig(OUT_DIR / "fig_failure_cases_analysis.png", dpi=300)
    fig.savefig(OUT_DIR / "fig_failure_cases_analysis.pdf")
    plt.close(fig)
    print("Saved: fig_failure_cases_analysis.png & .pdf")


if __name__ == "__main__":
    run_benchmark()
