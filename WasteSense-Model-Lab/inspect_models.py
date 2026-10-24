
from pathlib import Path
from ultralytics import YOLO

for path in sorted(Path("models").rglob("*.pt")):
    print(f"\n{'=' * 60}\nMODEL: {path}")
    try:
        model = YOLO(str(path))
        print("Task:", model.task)
        print("Classes:", model.names)
    except Exception as e:
        print("LOAD ERROR:", repr(e))
