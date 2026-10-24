
from pathlib import Path
import csv
import sys
import time

import cv2
import torch
import timm
import torchvision.transforms as T
from PIL import Image
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent
IMAGE_DIR = ROOT / "test_images"
OUT_DIR = ROOT / "comparison_results" / "plastic_classifier"
OUT_DIR.mkdir(parents=True, exist_ok=True)

DETECTOR_PATH = ROOT / "models/github/best.pt"
CLASSIFIER_PATH = ROOT / "models/huggingface/plastic_classifier_best.pt"
CLASSES = ["HDPE", "LDPE", "Other", "PET", "PP", "PS"]

device = "cuda" if torch.cuda.is_available() else "cpu"

classifier = timm.create_model(
    "convnext_base", num_classes=6, pretrained=False
)
state = torch.load(
    CLASSIFIER_PATH, map_location="cpu", weights_only=True
)
classifier.load_state_dict(state)
classifier.to(device).eval()

transform = T.Compose([
    T.ToPILImage(),
    T.Resize((224, 224)),
    T.ToTensor(),
    T.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])

detector = YOLO(str(DETECTOR_PATH))
rows = []
start = time.perf_counter()
crop_count = 0

images = sorted(
    p for p in IMAGE_DIR.iterdir()
    if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
)

for image_path in images:
    image = cv2.imread(str(image_path))
    if image is None:
        print("Skipping unreadable image:", image_path.name)
        continue

    prediction = detector.predict(
        source=image, conf=0.25, imgsz=640, verbose=False
    )[0]

    boxes = prediction.boxes
    if boxes is None:
        continue

    for i, box in enumerate(boxes):
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        h, w = image.shape[:2]

        x1, x2 = max(0, x1), min(w, x2)
        y1, y2 = max(0, y1), min(h, y2)
        crop = image[y1:y2, x1:x2]

        if crop.size == 0 or crop.shape[0] < 8 or crop.shape[1] < 8:
            continue

        crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
        tensor = transform(crop_rgb).unsqueeze(0).to(device)

        with torch.inference_mode():
            probabilities = torch.softmax(classifier(tensor), dim=1)[0]

        confidence, index = probabilities.max(dim=0)
        detector_class_id = int(box.cls[0].item())
        detector_class = detector.names[detector_class_id]

        rows.append({
            "image": image_path.name,
            "crop_id": i,
            "detector_class": detector_class,
            "resin_prediction": CLASSES[index.item()],
            "resin_confidence": round(confidence.item(), 4),
            "x1": x1, "y1": y1, "x2": x2, "y2": y2,
        })
        crop_count += 1

        # Save crop for visual inspection.
        cv2.imwrite(
            str(OUT_DIR / f"{image_path.stem}_crop{i}.jpg"), crop
        )

csv_path = OUT_DIR / "classifier_predictions.csv"
with csv_path.open("w", newline="", encoding="utf-8") as f:
    fields = [
        "image", "crop_id", "detector_class", "resin_prediction",
        "resin_confidence", "x1", "y1", "x2", "y2",
    ]
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)

print("Device:", device)
print("Images found:", len(images))
print("Object crops classified:", crop_count)
print("Elapsed seconds:", round(time.perf_counter() - start, 2))
print("CSV:", csv_path)
print("NOTE: predictions are exploratory, not accuracy metrics.")
