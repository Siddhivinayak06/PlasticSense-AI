#!/usr/bin/env python3
"""Load and run the Bower multi-head YOLO checkpoint on PyTorch >= 2.6.

Why this exists
---------------
The checkpoint is a *full pickled nn.Module* (ckpt["model"] is a DetectionModel
object), not a plain state_dict. ultralytics_bower (a fork of Ultralytics 8.1.34,
May 2024) loads it with a bare `torch.load(file, map_location="cpu")`. Since
PyTorch 2.6 that defaults to weights_only=True, which refuses to rebuild
arbitrary Python objects, so the failure is expected and allowlisting one class
at a time can never be reliably finished. Upstream Ultralytics solved the same
problem by defaulting to weights_only=False for its own checkpoints.

What this script does instead
-----------------------------
1. Verifies the file's size and SHA-256 against the values published by the
   Hugging Face repo (BowerApp/bowie-yolov8-multihead-trash-detection).
2. Scans the pickle opcodes WITHOUT executing anything and lists every global
   (module.name) the file would import. Anything outside a narrow allowlist
   stops the run and is printed for you to review.
3. Only then imports torch/seegull and loads with weights_only=False, scoped to
   the model construction only (torch.load is restored afterwards).

Usage
-----
    python test_bower.py --scan-only          # steps 1-2 only, no torch import
    python test_bower.py                      # steps 1-3 + one prediction
    python test_bower.py --allow some.module.Name   # accept a reviewed extra
"""
from __future__ import annotations

import argparse
import hashlib
import pickletools
import sys
import time
import zipfile
from contextlib import contextmanager
from pathlib import Path

ROOT = Path.home() / "Desktop" / "WasteSense-Model-Lab"

# Published by Hugging Face for yolov8m_object_material_best.pt
# (revision 0a671f60878aec90d181ca455bc8080303d55ef3, updated 2025-01-30).
EXPECTED_SHA256 = (
    "991a827c81d30627cd5504e40fb967499cb844c8f24fb686fd5dada9af506dac"
)
EXPECTED_SIZE = 58_071_599

# Globals a plain YOLOv8 full-model checkpoint is expected to need.
ALLOWED_EXACT = {
    "collections.OrderedDict",
    "builtins.set",
    "__builtin__.set",  # torch.save uses pickle protocol 2, which spells it this way
    "dill._dill._load_type",  # resolves a type from the stdlib `types` module
    "torch._utils._rebuild_tensor_v2",
    "torch._utils._rebuild_parameter",
    "torch.nn.parameter.Parameter",
    "torch.device",
    "torch.Size",
    "torch.FloatStorage",
    "torch.HalfStorage",
    "torch.LongStorage",
    "torch.IntStorage",
    "torch.BoolStorage",
    "torch.storage._load_from_bytes",
    "ultralytics_bower.nn.tasks.DetectionModel",
    "ultralytics_bower.utils.IterableSimpleNamespace",
}
ALLOWED_PREFIXES = (
    "torch.nn.modules.",
    "ultralytics_bower.nn.modules.",
)


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def pickle_globals(data: bytes) -> set[str]:
    """Return every module.name a pickle would import. Nothing is executed."""
    found: set[str] = set()
    memo: dict[int, object] = {}
    strs: list[object] = []
    last: object = None
    for op, arg, _pos in pickletools.genops(data):
        n = op.name
        if n in ("GLOBAL", "INST"):
            module, name = arg.split(" ", 1)
            found.add(f"{module}.{name}")
        elif n in ("SHORT_BINUNICODE", "BINUNICODE", "BINUNICODE8", "UNICODE"):
            strs.append(arg)
            last = arg
        elif n in ("BINGET", "LONG_BINGET", "GET"):
            last = memo.get(arg)
            strs.append(last)
        elif n == "MEMOIZE":
            memo[len(memo)] = last
        elif n in ("BINPUT", "LONG_BINPUT", "PUT"):
            memo[arg] = last
        elif n == "STACK_GLOBAL":
            if len(strs) >= 2 and all(isinstance(s, str) for s in strs[-2:]):
                found.add(f"{strs[-2]}.{strs[-1]}")
            else:
                found.add("<unresolved STACK_GLOBAL>")
            last = None
        else:
            last = None
    return found


def checkpoint_globals(path: Path) -> set[str]:
    if not zipfile.is_zipfile(path):
        raise SystemExit(
            "Checkpoint is not in torch's zip format; this scanner does not "
            "support the legacy format."
        )
    found: set[str] = set()
    with zipfile.ZipFile(path) as z:
        pkls = [n for n in z.namelist() if n.endswith(".pkl")]
        if not pkls:
            raise SystemExit("No .pkl member found inside the checkpoint zip.")
        for name in pkls:
            found |= pickle_globals(z.read(name))
    return found


def gate(model: Path, extra_allowed: set[str], skip_hash: bool) -> None:
    if not model.exists():
        raise SystemExit(f"Model not found: {model}")

    size = model.stat().st_size
    print(f"Size   : {size:,} bytes (expected {EXPECTED_SIZE:,})")
    if not skip_hash:
        digest = sha256_of(model)
        print(f"SHA-256: {digest}")
        if size != EXPECTED_SIZE or digest != EXPECTED_SHA256:
            raise SystemExit(
                "STOP: file does not match the hash published on Hugging Face. "
                "Re-download it (huggingface_hub.hf_hub_download) or, if you "
                "intentionally use a different file, re-run with --skip-hash "
                "after reviewing it yourself."
            )
        print("Hash   : matches the published value")

    globs = checkpoint_globals(model)
    allowed = ALLOWED_EXACT | extra_allowed
    bad = sorted(
        g for g in globs
        if g not in allowed and not g.startswith(ALLOWED_PREFIXES)
    )
    print(f"\nPickle globals found ({len(globs)}):")
    for g in sorted(globs):
        print(f"  {'REVIEW' if g in bad else 'ok    '}  {g}")
    if bad:
        raise SystemExit(
            "\nSTOP: the checkpoint references globals outside the expected "
            "set (marked REVIEW above). Nothing was loaded. Anything that is "
            "not a model/layer class (os, posix, subprocess, builtins.eval/"
            "exec, dill._dill._create_function/_create_code, ...) means "
            "embedded code: do not load the file. If every REVIEW entry is a "
            "harmless class you recognise, re-run with --allow <name> for each."
        )
    print("\nAll globals are within the expected set.")


@contextmanager
def trusted_torch_load():
    """Default torch.load to weights_only=False, only inside this block."""
    import torch

    original = torch.load

    def patched(*args, **kwargs):
        kwargs.setdefault("weights_only", False)
        return original(*args, **kwargs)

    torch.load = patched
    try:
        yield
    finally:
        torch.load = original


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--model", type=Path,
        default=ROOT / "models/huggingface/yolov8m_object_material_best.pt",
    )
    ap.add_argument("--images", type=Path, default=ROOT / "test_images")
    ap.add_argument("--scan-only", action="store_true")
    ap.add_argument("--skip-hash", action="store_true")
    ap.add_argument("--allow", action="append", default=[], metavar="MODULE.NAME")
    args = ap.parse_args()

    gate(args.model, set(args.allow), args.skip_hash)
    if args.scan_only:
        return

    images = sorted(
        p for p in args.images.iterdir()
        if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    )
    if not images:
        raise SystemExit(f"No test images found: {args.images}")

    # Heavy imports only after the file has been verified.
    import torch
    from seegull import YOLOMultiLabel

    print("\nCUDA available:", torch.cuda.is_available())
    if torch.cuda.is_available():
        print("GPU:", torch.cuda.get_device_name(0))

    print("Loading Bower model (weights_only=False, verified file only)...")
    with trusted_torch_load():
        model = YOLOMultiLabel(str(args.model))

    # YOLOMultiLabel has no .predict(); calling the instance runs inference.
    image = str(images[0])
    print("Testing image:", image)
    start = time.perf_counter()
    results = model(image, verbose=False)
    elapsed = time.perf_counter() - start
    print(f"Inference time (first call, includes warm-up): {elapsed:.3f} s")

    names = model.model.model.names
    if isinstance(names, list):
        names = {i: v for i, v in enumerate(names)}
    boxes = results[0].boxes
    xyxy = boxes.xyxy.cpu().numpy()
    cls = boxes.cls.cpu().numpy().reshape(len(xyxy), -1)    # (N, 2): object, material
    conf = boxes.conf.cpu().numpy().reshape(len(xyxy), -1)  # (N, 2)
    print(f"Detections: {len(xyxy)}")
    for i in range(len(xyxy)):
        obj = names[0][int(cls[i, 0])]
        mat = names[1][int(cls[i, 1])]
        print(
            f"  {obj} / {mat}  "
            f"conf=({conf[i, 0]:.2f}, {conf[i, 1]:.2f})  "
            f"box={[round(float(v), 1) for v in xyxy[i]]}"
        )


if __name__ == "__main__":
    sys.exit(main())
