#!/usr/bin/env python3
"""Recover training/validation curves that are already embedded in checkpoints.

Ultralytics stores the full per-epoch metric history inside each checkpoint under
``train_results``, plus the best-epoch validation scalars under ``train_metrics``.
That means loss curves, mAP curves and final metrics for models trained elsewhere
are recoverable OFFLINE - no retraining, no dataset, no GPU.

What this does NOT do
---------------------
It cannot produce precision-recall curves, per-class AP or confusion matrices.
Those require running validation against ground-truth labels (``model.val()``),
which needs an annotated evaluation set this project does not yet have.

Every number emitted here was measured by the ORIGINAL training run on ITS OWN
dataset's validation split. These are NOT measurements on WasteSense target-domain
imagery and must never be presented as such.

Usage
-----
    python scripts/extract_training_curves.py
    python scripts/extract_training_curves.py --out reports/curves
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path

import torch

LAB = Path(__file__).resolve().parent.parent
REPO = LAB.parent

# Checkpoints known to carry embedded training history.
CHECKPOINTS = {
    "github_best_22cls": LAB / "models/github/best.pt",
    "plasticsense_detector": LAB / "models/github/plasticsense_detector_best.pt",
    "taco_segmentation": LAB / "models/github/taco_segmentation_best.pt",
    "biaeye_6cls": REPO / "ML-service/models/best.pt",
    # Carries train_args but NO train_results (Ultralytics 8.0.20 predates it).
    "hf_yolov8m_seg": LAB / "models/huggingface/yolov8m-seg.pt",
}

TRAIN_ARG_KEYS = [
    "task", "mode", "model", "data", "epochs", "batch", "imgsz", "patience",
    "optimizer", "lr0", "lrf", "momentum", "weight_decay", "warmup_epochs",
    "pretrained", "single_cls", "rect", "cos_lr", "close_mosaic", "amp",
    "fraction", "seed", "device", "workers", "hsv_h", "hsv_v", "degrees",
    "translate", "scale", "fliplr", "flipud", "mosaic", "mixup", "copy_paste",
    "erasing", "auto_augment", "iou",
]


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def load_checkpoint(path: Path):
    """Load a checkpoint, tolerating older Ultralytics module layouts."""
    try:
        return torch.load(path, map_location="cpu", weights_only=False)
    except ModuleNotFoundError:
        # e.g. "ultralytics.yolo" from 8.0.x. The YOLO wrapper remaps these.
        from ultralytics import YOLO
        return YOLO(str(path)).ckpt


def plot_curves(name: str, results: dict, out_dir: Path) -> list[Path]:
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        print("   matplotlib not available; skipping plots")
        return []

    epochs = results.get("epoch") or list(range(1, len(next(iter(results.values()))) + 1))
    loss_keys = [k for k in results if k.startswith(("train/", "val/")) and "loss" in k]
    metric_keys = [k for k in results if k.startswith("metrics/")]
    written = []

    for group, keys, ylabel in (
        ("losses", loss_keys, "loss"),
        ("metrics", metric_keys, "value"),
    ):
        if not keys:
            continue
        fig, ax = plt.subplots(figsize=(9, 5))
        for k in sorted(keys):
            ax.plot(epochs, results[k], label=k, linewidth=1.5)
        ax.set_xlabel("epoch")
        ax.set_ylabel(ylabel)
        ax.set_title(f"{name} - {group} (source dataset, not WasteSense imagery)")
        ax.legend(fontsize=7, ncol=2)
        ax.grid(alpha=0.3)
        fig.tight_layout()
        path = out_dir / f"{name}_{group}.png"
        fig.savefig(path, dpi=140)
        plt.close(fig)
        written.append(path)
    return written


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, default=LAB / "reports" / "training_curves")
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    manifest = []

    for name, path in CHECKPOINTS.items():
        print(f"\n{'=' * 70}\n{name}\n  path: {path}")
        if not path.exists():
            print("  MISSING - skipped")
            manifest.append({"model": name, "path": str(path), "status": "missing"})
            continue

        ckpt = load_checkpoint(path)
        if not isinstance(ckpt, dict):
            print("  unexpected checkpoint format - skipped")
            continue

        entry = {
            "model": name,
            "path": str(path),
            "sha256": sha256_of(path),
            "size_bytes": path.stat().st_size,
            "ultralytics_version": ckpt.get("version"),
            "checkpoint_date": str(ckpt.get("date")) if ckpt.get("date") else None,
            "status": "ok",
        }

        train_args = ckpt.get("train_args")
        if isinstance(train_args, dict):
            entry["train_args"] = {k: train_args[k] for k in TRAIN_ARG_KEYS if k in train_args}
            print(f"  trained: {train_args.get('epochs')} epochs @ imgsz {train_args.get('imgsz')}")
            print(f"  dataset: {train_args.get('data')}")

        metrics = ckpt.get("train_metrics")
        if isinstance(metrics, dict):
            entry["best_epoch_metrics"] = metrics
            print("  best-epoch metrics (SOURCE dataset val split):")
            for k, v in metrics.items():
                if isinstance(v, (int, float)):
                    print(f"      {k:28s} {v:.4f}")

        results = ckpt.get("train_results")
        if isinstance(results, dict) and results:
            n_epochs = len(next(iter(results.values())))
            entry["epochs_logged"] = n_epochs
            entry["series"] = sorted(results.keys())
            print(f"  curves: {n_epochs} epochs x {len(results)} series")

            csv_path = args.out / f"{name}_curves.csv"
            keys = sorted(results.keys())
            with csv_path.open("w", newline="") as f:
                w = csv.writer(f)
                w.writerow(keys)
                for i in range(n_epochs):
                    w.writerow([results[k][i] for k in keys])
            entry["curves_csv"] = str(csv_path)
            print(f"  wrote {csv_path.name}")

            for p in plot_curves(name, results, args.out):
                print(f"  wrote {p.name}")

            if "metrics/mAP50(B)" in results:
                v = results["metrics/mAP50(B)"]
                best_i = max(range(len(v)), key=lambda i: v[i])
                entry["map50_peak"] = {"value": round(v[best_i], 4), "epoch": best_i + 1}
                entry["map50_final"] = round(v[-1], 4)
                if best_i < len(v) - 1 and v[-1] < v[best_i] * 0.97:
                    entry["note"] = (
                        f"mAP50 peaked at epoch {best_i + 1} ({v[best_i]:.4f}) and ended "
                        f"lower ({v[-1]:.4f}): consistent with overfitting after the peak."
                    )
                    print(f"  NOTE: {entry['note']}")
        else:
            entry["epochs_logged"] = 0
            entry["note"] = (
                "No embedded train_results. This Ultralytics version did not store "
                "per-epoch history; curves are unrecoverable from the checkpoint."
            )
            print(f"  NOTE: {entry['note']}")

        manifest.append(entry)

    manifest_path = args.out / "training_evidence_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, default=str))
    print(f"\n{'=' * 70}\nManifest: {manifest_path}")
    print(
        "\nREMINDER: every metric above was produced by the original training run on\n"
        "its own dataset's validation split. They are NOT comparable across models\n"
        "(different datasets, classes and splits) and are NOT measurements on\n"
        "WasteSense target-domain imagery."
    )


if __name__ == "__main__":
    main()
