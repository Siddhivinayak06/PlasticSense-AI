
from pathlib import Path
import csv
import time

import torch
from PIL import Image

ROOT = Path(__file__).resolve().parent
IMAGE_DIR = ROOT / "test_images"
MODEL_DIR = ROOT / "models" / "research-papers"
OUT_DIR = ROOT / "comparison_results" / "research_models"
OUT_DIR.mkdir(parents=True, exist_ok=True)

MODELS = {
    "pLitterFloat": MODEL_DIR / "pLitterFloat_800x752_to_640x640.pt",
    "pLitterStreet": MODEL_DIR / "pLitterStreet_YOLOv5l.pt",
}

images = []
for p in sorted(IMAGE_DIR.iterdir()):
    if p.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
        continue
    try:
        with Image.open(p) as im:
            im.verify()
        images.append(p)
    except Exception:
        print(f"Skipping invalid image: {p.name}")

if not images:
    raise SystemExit("No valid test images found.")

print(f"Valid images: {len(images)}")
print(f"CUDA available: {torch.cuda.is_available()}")
rows = []

for name, checkpoint in MODELS.items():
    print(f"\n{'=' * 55}\nModel: {name}")

    if not checkpoint.exists():
        print(f"SKIPPED: checkpoint missing: {checkpoint}")
        continue

    try:
        model = torch.hub.load(
            "ultralytics/yolov5",
            "custom",
            path=str(checkpoint),
            trust_repo=True,
        )
        model.conf = 0.25
        model.iou = 0.45

        print("Classes:", model.names)
        save_dir = OUT_DIR / name
        save_dir.mkdir(parents=True, exist_ok=True)

        total_detections = 0
        start = time.perf_counter()

        for image_path in images:
            results = model(str(image_path), size=640)
            detections = results.xyxy[0].detach().cpu()
            total_detections += len(detections)

            # Save annotated predictions.
            rendered = results.render()[0]
            Image.fromarray(rendered).save(save_dir / image_path.name)

            for det in detections.tolist():
                x1, y1, x2, y2, conf, cls = det
                cls = int(cls)
                names = model.names
                label = names.get(cls, str(cls)) if isinstance(names, dict) else names[cls]

                rows.append({
                    "model": name,
                    "image": image_path.name,
                    "class_id": cls,
                    "class_name": label,
                    "confidence": round(conf, 4),
                    "x1": round(x1, 2),
                    "y1": round(y1, 2),
                    "x2": round(x2, 2),
                    "y2": round(y2, 2),
                })

        elapsed = time.perf_counter() - start
        print(f"Images processed: {len(images)}")
        print(f"Predicted instances: {total_detections}")
        print(f"Elapsed: {elapsed:.2f} seconds")
        print(f"Seconds/image: {elapsed / len(images):.3f}")
        print(f"Saved images: {save_dir}")

    except Exception as exc:
        print(f"MODEL FAILED: {type(exc).__name__}: {exc}")

csv_path = OUT_DIR / "research_predictions.csv"
with csv_path.open("w", newline="", encoding="utf-8") as f:
    fields = [
        "model", "image", "class_id", "class_name",
        "confidence", "x1", "y1", "x2", "y2",
    ]
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)

print(f"\nCSV saved: {csv_path}")
