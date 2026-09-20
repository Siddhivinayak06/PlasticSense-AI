from ultralytics import YOLO

MODEL = r"C:\PlasticSenseAI\runs\yolo11s_plasticsense_final\weights\best.pt"
IMAGE = r"C:\PlasticSenseAI\field_test\1.jpg"

print("=" * 60)
print("LOADING MODEL 1")
print("=" * 60)
print(MODEL)

model = YOLO(MODEL)

print("\nTask:")
print(model.task)

print("\nClasses:")
print(model.names)

print("\nRunning prediction at conf=0.10...\n")

results = model.predict(
    source=IMAGE,
    imgsz=960,
    conf=0.10,
    save=True,
    project=r"C:\PlasticSenseAI\dual_model_test",
    name="model1_diagnostic",
    exist_ok=True,
    verbose=True
)

for result in results:

    print("\n" + "=" * 60)
    print("RESULT")
    print("=" * 60)

    print("Image:", result.path)

    if result.boxes is None:
        print("No boxes returned.")
        continue

    n = len(result.boxes)

    print("Number of detections:", n)

    if n == 0:
        print("\nZERO DETECTIONS even at confidence 0.10")
        continue

    classes = result.boxes.cls.cpu().numpy()
    confidences = result.boxes.conf.cpu().numpy()

    print("\nDetections:")

    for cls, conf in zip(classes, confidences):
        print(
            f"  {model.names[int(cls)]}: "
            f"{conf:.4f}"
        )