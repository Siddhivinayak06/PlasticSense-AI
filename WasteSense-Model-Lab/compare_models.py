
from pathlib import Path
import csv
import time
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent
IMAGES = ROOT / "test_images"
OUTPUT = ROOT / "comparison_results"
OUTPUT.mkdir(exist_ok=True)

MODELS = {
    "github_best": ROOT / "models/github/best.pt",
    "plasticsense_detector": ROOT / "models/github/plasticsense_detector_best.pt",
    "taco_segmentation": ROOT / "models/github/taco_segmentation_best.pt",
    "huggingface_segmentation": ROOT / "models/huggingface/yolov8m-seg.pt",
}

image_files = sorted(
    p for p in IMAGES.iterdir()
    if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
)

if not image_files:
    raise SystemExit(f"No images found in {IMAGES}")

rows = []

for model_name, model_path in MODELS.items():
    print(f"\n{'=' * 55}\nModel: {model_name}")

    if not model_path.exists():
        print(f"SKIPPED: checkpoint not found: {model_path}")
        continue

    try:
        model = YOLO(str(model_path))
        print(f"Task: {model.task}; classes: {model.names}")

        save_dir = OUTPUT / model_name
        start = time.perf_counter()

        results = model.predict(
            source=[str(p) for p in image_files],
            imgsz=640,
            conf=0.25,
            save=True,
            project=str(OUTPUT),
            name=model_name,
            exist_ok=True,
            verbose=False,
        )

        elapsed = time.perf_counter() - start
        detections = 0
        masks = 0

        for image_path, result in zip(image_files, results):
            count = len(result.boxes) if result.boxes is not None else 0
            mask_count = len(result.masks) if result.masks is not None else 0
            detections += count
            masks += mask_count

            rows.append({
                "model": model_name,
                "image": image_path.name,
                "task": model.task,
                "detections_or_instances": count,
                "instances_with_masks": mask_count,
            })

        print(f"Images processed: {len(results)}")
        print(f"Total detected instances: {detections}")
        print(f"Instances with masks: {masks}")
        print(f"Total elapsed time: {elapsed:.2f} seconds")
        print(f"Average elapsed time/image: {elapsed / len(image_files):.3f} seconds")
        print(f"Saved prediction images under: {save_dir}")

    except Exception as exc:
        print(f"MODEL FAILED: {type(exc).__name__}: {exc}")

csv_path = OUTPUT / "per_image_results.csv"
with csv_path.open("w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(
        f,
        fieldnames=[
            "model", "image", "task",
            "detections_or_instances", "instances_with_masks"
        ],
    )
    writer.writeheader()
    writer.writerows(rows)

print(f"\nComparison summary saved to: {csv_path}")
print("Reminder: these are preliminary predictions, not accuracy metrics.")
