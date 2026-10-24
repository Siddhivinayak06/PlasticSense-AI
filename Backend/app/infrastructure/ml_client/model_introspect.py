"""Read real architecture/provenance facts out of a loaded Ultralytics model.

Everything here is derived from the checkpoint itself rather than hardcoded, so the
reported metadata cannot drift when a model is swapped in configuration. Values that
cannot be established are returned as None rather than guessed.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

logger = logging.getLogger("WasteSense_AI")


def describe(yolo_model: Any) -> Dict[str, Optional[Any]]:
    """Return {architecture, param_count, provenance} for an ultralytics YOLO wrapper."""
    architecture: Optional[str] = None
    param_count: Optional[int] = None
    provenance: Dict[str, Optional[Any]] = {}

    try:
        inner = getattr(yolo_model, "model", None)
        if inner is not None:
            yaml_cfg = getattr(inner, "yaml", None)
            if isinstance(yaml_cfg, dict):
                # e.g. "yolo11s-seg.yaml" -> "YOLO11s-seg"; falls back to scale + nc.
                yaml_file = yaml_cfg.get("yaml_file")
                if isinstance(yaml_file, str) and yaml_file:
                    architecture = yaml_file.replace(".yaml", "")
                scale = yaml_cfg.get("scale")
                if architecture and scale and scale not in architecture:
                    architecture = f"{architecture}{scale}"
            try:
                param_count = sum(p.numel() for p in inner.parameters())
            except Exception:
                param_count = None

        # Ultralytics stores the training invocation on the checkpoint.
        ckpt = getattr(yolo_model, "ckpt", None)
        if isinstance(ckpt, dict):
            provenance["trained_with_ultralytics"] = ckpt.get("version")
            provenance["checkpoint_date"] = str(ckpt.get("date")) if ckpt.get("date") else None
            train_args = ckpt.get("train_args")
            if isinstance(train_args, dict):
                provenance["source_dataset"] = train_args.get("data")
                provenance["train_imgsz"] = train_args.get("imgsz")
                provenance["train_epochs"] = train_args.get("epochs")
                provenance["base_weights"] = train_args.get("model")
            # Checkpoints from older Ultralytics releases (<= 8.0.x) carry no
            # yaml_file, so fall back to the base weights the run started from
            # (e.g. "yolov8n.pt" -> "yolov8n") rather than reporting "unknown".
            if architecture in (None, "unknown"):
                base = provenance.get("base_weights")
                if isinstance(base, str) and base:
                    stem = base.replace("\\", "/").rsplit("/", 1)[-1]
                    if stem.endswith(".pt"):
                        architecture = stem[:-3]

            metrics = ckpt.get("train_metrics")
            if isinstance(metrics, dict):
                # These are the model's own source-dataset validation numbers. They are
                # NOT measurements on WasteSense imagery and must be labelled as such
                # wherever they are displayed.
                provenance["source_dataset_metrics"] = {
                    k: round(v, 4) for k, v in metrics.items()
                    if isinstance(v, (int, float)) and k.startswith("metrics/")
                }
                provenance["metrics_caveat"] = (
                    "Reported by the checkpoint on its own training dataset's validation "
                    "split. Not measured on WasteSense target-domain imagery."
                )
    except Exception as exc:  # pragma: no cover - introspection must never break startup
        logger.warning("Model introspection failed: %s", exc)

    if not architecture:
        architecture = "unknown"

    return {
        "architecture": architecture,
        "param_count": param_count,
        "provenance": provenance or None,
    }
