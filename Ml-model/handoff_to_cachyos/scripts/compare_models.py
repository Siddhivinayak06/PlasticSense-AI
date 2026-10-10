from ultralytics import YOLO
from pathlib import Path

# =========================
# MODEL PATHS
# =========================

MODEL_1 = r"C:\WasteSenseAI\runs\yolo11s_wastesense_final\weights\best.pt"

MODEL_2 = r"C:\WasteSenseAI\pretrained_tests\taco_yolo11_seg\best.pt"

FIELD_TEST = r"C:\WasteSenseAI\field_test"

OUTPUT = r"C:\WasteSenseAI\dual_model_test"


# =========================
# LOAD MODELS
# =========================

print("Loading Model 1...")
model1 = YOLO(MODEL_1)

print("Loading Model 2...")
model2 = YOLO(MODEL_2)

print("Models loaded successfully.")


# =========================
# MODEL 1
# =========================

print("\nRunning Model 1...")

model1.predict(
    source=FIELD_TEST,
    imgsz=960,
    conf=0.25,
    save=True,
    project=OUTPUT,
    name="model1_results",
    exist_ok=True
)


# =========================
# MODEL 2
# =========================

print("\nRunning Model 2...")

model2.predict(
    source=FIELD_TEST,
    imgsz=960,
    conf=0.25,
    save=True,
    project=OUTPUT,
    name="model2_results",
    exist_ok=True
)


print("\n================================")
print("Both models finished.")
print("================================")
print(f"Model 1: {OUTPUT}\\model1_results")
print(f"Model 2: {OUTPUT}\\model2_results")