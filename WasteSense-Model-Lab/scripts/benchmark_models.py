#!/usr/bin/env python3
"""Reproducible inference comparison across candidate models.

Fixes the fairness and reproducibility defects in the original compare_models.py:

1. NATIVE RESOLUTION. The old script forced imgsz=640 on every model, but the
   candidates were trained at 416, 640 and 960. Measured effect of that single
   choice: hf_yolov8m_seg produced 129 detections at 640 and 310 at 960 on the
   same images. Each model is now run at its own training resolution, and
   optionally swept across resolutions with --sweep.

2. PER-IMAGE INFERENCE. The old script passed all 31 paths as one list, which
   triggers Ultralytics' rectangular batch letterboxing. taco_segmentation gave
   293 detections batched vs 371 per-image at identical settings - a 27% swing
   from batching alone. Images are now processed one at a time.

3. WARM-UP EXCLUDED. The first CUDA call includes context and kernel setup.
   A warm-up pass runs before the timer starts.

4. ENVIRONMENT RECORDED. Library versions, GPU and resolution are written
   alongside the results so a run can be reproduced or invalidated later.

IMPORTANT: detection counts are DIAGNOSTIC, not accuracy. Without ground-truth
labels a higher count may mean better recall or merely more false positives -
pLitterFloat emits ~34 detections per image on street scenes, almost all spurious
'debris'. Do not rank models by these numbers. mAP/precision/recall require
model.val() against an annotated set.

Usage
-----
    python scripts/benchmark_models.py
    python scripts/benchmark_models.py --sweep 640 960
"""
from __future__ import annotations

import argparse
import csv
import json
import platform
import time
from pathlib import Path

import numpy as np

LAB = Path(__file__).resolve().parent.parent
REPO = LAB.parent

# (checkpoint, native training imgsz, task family)
CANDIDATES = {
    "github_best_22cls": (LAB / "models/github/best.pt", 640, "detect"),
    "plasticsense_detector": (LAB / "models/github/plasticsense_detector_best.pt", 960, "detect"),
    "taco_segmentation": (LAB / "models/github/taco_segmentation_best.pt", 960, "segment"),
    "hf_yolov8m_seg": (LAB / "models/huggingface/yolov8m-seg.pt", 416, "segment"),
    "biaeye_6cls": (REPO / "ML-service/models/best.pt", 640, "detect"),
}

CONF = 0.25
IOU = 0.45
SEED = 0


def environment() -> dict:
    import torch
    import ultralytics
    return {
        "python": platform.python_version(),
        "platform": platform.platform(),
        "torch": torch.__version__,
        "ultralytics": ultralytics.__version__,
        "cuda_available": torch.cuda.is_available(),
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "conf_threshold": CONF,
        "iou_threshold": IOU,
        "seed": SEED,
    }


def mask_coverage_percent(result) -> float | None:
    """Union of instance masks as a percentage of image pixels."""
    if result.masks is None or len(result.masks) == 0:
        return 0.0
    import cv2
    h, w = result.orig_shape
    union = np.zeros((h, w), dtype=np.uint8)
    for m in result.masks.data.cpu().numpy():
        resized = cv2.resize(m, (w, h), interpolation=cv2.INTER_NEAREST)
        union[resized > 0.5] = 1
    return round(100.0 * float(union.sum()) / (h * w), 3)


def run_model(name: str, path: Path, imgsz: int, task: str, images: list[Path]) -> dict:
    import torch
    from ultralytics import YOLO

    torch.manual_seed(SEED)
    model = YOLO(str(path))

    # Warm-up: excluded from timing.
    model.predict(source=str(images[0]), imgsz=imgsz, conf=CONF, iou=IOU, verbose=False)

    if torch.cuda.is_available():
        torch.cuda.reset_peak_memory_stats()
        torch.cuda.synchronize()

    per_image, coverages = [], []
    total_detections = 0
    images_with_detection = 0

    t0 = time.perf_counter()
    for p in images:
        t_img = time.perf_counter()
        r = model.predict(source=str(p), imgsz=imgsz, conf=CONF, iou=IOU, verbose=False)[0]
        elapsed = time.perf_counter() - t_img

        n = len(r.boxes) if r.boxes is not None else 0
        total_detections += n
        images_with_detection += int(n > 0)

        cov = mask_coverage_percent(r) if task == "segment" else None
        if cov is not None:
            coverages.append(cov)

        per_image.append({
            "model": name, "imgsz": imgsz, "image": p.name,
            "detections": n, "mask_coverage_percent": cov,
            "seconds": round(elapsed, 4),
        })
    wall = time.perf_counter() - t0

    if torch.cuda.is_available():
        torch.cuda.synchronize()
        peak_mb = round(torch.cuda.max_memory_allocated() / (1024 ** 2), 1)
    else:
        peak_mb = None

    n_params = sum(x.numel() for x in model.model.parameters())
    times = [r["seconds"] for r in per_image]

    summary = {
        "model": name,
        "checkpoint": str(path),
        "imgsz": imgsz,
        "task": task,
        "classes": len(model.names),
        "parameters": n_params,
        "images": len(images),
        "total_detections": total_detections,
        "images_with_detection": images_with_detection,
        "mean_sec_per_image": round(wall / len(images), 4),
        "median_sec_per_image": round(float(np.median(times)), 4),
        "peak_vram_mb": peak_mb,
        "mean_mask_coverage_percent": round(float(np.mean(coverages)), 3) if coverages else None,
    }
    return {"summary": summary, "per_image": per_image}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--images", type=Path, default=LAB / "test_images")
    ap.add_argument("--out", type=Path, default=LAB / "reports" / "benchmark")
    ap.add_argument(
        "--sweep", type=int, nargs="*", default=None,
        help="Also run every model at these resolutions (fairness ablation).",
    )
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    images = sorted(
        p for p in args.images.iterdir()
        if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    )
    if not images:
        raise SystemExit(f"No images found in {args.images}")

    env = environment()
    print(json.dumps(env, indent=2))
    print(f"\nImages: {len(images)}  conf={CONF} iou={IOU}\n")

    summaries, rows = [], []
    for name, (path, native, task) in CANDIDATES.items():
        if not path.exists():
            print(f"{name}: MISSING {path} - skipped")
            continue
        resolutions = sorted({native, *(args.sweep or [])})
        for imgsz in resolutions:
            tag = " (native)" if imgsz == native else ""
            print(f"{name} @ {imgsz}{tag} ...", flush=True)
            try:
                res = run_model(name, path, imgsz, task, images)
            except Exception as exc:
                print(f"   FAILED: {type(exc).__name__}: {exc}")
                continue
            s = res["summary"]
            s["is_native_resolution"] = imgsz == native
            summaries.append(s)
            rows.extend(res["per_image"])
            print(
                f"   dets={s['total_detections']:<5} "
                f"hit={s['images_with_detection']}/{len(images)} "
                f"{s['mean_sec_per_image']:.3f}s/img "
                f"vram={s['peak_vram_mb']}MB "
                f"cov={s['mean_mask_coverage_percent']}"
            )

    (args.out / "environment.json").write_text(json.dumps(env, indent=2))

    with (args.out / "summary.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(summaries[0].keys()))
        w.writeheader()
        w.writerows(summaries)

    with (args.out / "per_image.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    print(f"\nWrote {args.out}/summary.csv, per_image.csv, environment.json")
    print(
        "\nREMINDER: detection counts are diagnostic only. They are NOT accuracy.\n"
        "Ranking models by count rewards over-firing. Accuracy requires model.val()\n"
        "against ground-truth annotations, which this project does not yet have."
    )


if __name__ == "__main__":
    main()
