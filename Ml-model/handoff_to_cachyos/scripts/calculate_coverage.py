from ultralytics import YOLO
from pathlib import Path
import json
import numpy as np

MODEL_2 = r"C:\WasteSenseAI\pretrained_tests\taco_yolo11_seg\best.pt"

FIELD_TEST = Path(r"C:\WasteSenseAI\field_test")

OUTPUT = Path(r"C:\WasteSenseAI\dual_model_test\coverage_results")
OUTPUT.mkdir(exist_ok=True)

model = YOLO(MODEL_2)

results = model.predict(
    source=str(FIELD_TEST),
    imgsz=960,
    conf=0.25,
    verbose=False
)

all_results = []

for result in results:

    image_path = Path(result.path)

    # Original image dimensions
    height, width = result.orig_shape

    total_pixels = height * width

    # Empty mask
    combined_mask = np.zeros(
        (height, width),
        dtype=np.uint8
    )

    class_counts = {}

    if result.masks is not None:

        masks = result.masks.data.cpu().numpy()

        classes = result.boxes.cls.cpu().numpy().astype(int)

        for mask, cls in zip(masks, classes):

            # Resize mask to original image size
            import cv2

            mask = cv2.resize(
                mask,
                (width, height),
                interpolation=cv2.INTER_NEAREST
            )

            # Add this object's area to union mask
            combined_mask[mask > 0.5] = 1

            class_name = model.names[cls]

            class_counts[class_name] = (
                class_counts.get(class_name, 0) + 1
            )

    waste_pixels = int(combined_mask.sum())

    coverage_percent = (
        waste_pixels / total_pixels
    ) * 100

    output = {
        "image": image_path.name,
        "width": width,
        "height": height,
        "waste_coverage_percent": round(
            coverage_percent, 2
        ),
        "detections": class_counts
    }

    all_results.append(output)

    print(
        f"{image_path.name}: "
        f"{coverage_percent:.2f}% waste coverage"
    )


with open(
    OUTPUT / "coverage_results.json",
    "w"
) as f:

    json.dump(
        all_results,
        f,
        indent=4
    )

print("\nSaved:")
print(OUTPUT / "coverage_results.json")