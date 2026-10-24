
from pathlib import Path
from collections import defaultdict
import hashlib

ROOT = Path.cwd()

MODEL_EXTENSIONS = {
    ".pt", ".pth", ".onnx", ".safetensors",
    ".pb", ".tflite", ".engine", ".bin", ".ckpt"
}

SKIP_DIRS = {
    ".git", ".venv", "venv", "node_modules",
    "__pycache__"
}


def sha256_file(path):
    digest = hashlib.sha256()

    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()


hash_groups = defaultdict(list)
total = 0

for path in ROOT.rglob("*"):
    if not path.is_file():
        continue

    if any(part in SKIP_DIRS for part in path.parts):
        continue

    if path.suffix.lower() not in MODEL_EXTENSIONS:
        continue

    try:
        file_hash = sha256_file(path)
        hash_groups[file_hash].append(path)
        total += 1

        print(f"{file_hash}  {path.relative_to(ROOT)}")

    except OSError as error:
        print(f"Could not read {path}: {error}")

print(f"\nTotal model files checked: {total}")

duplicates = [
    paths for paths in hash_groups.values()
    if len(paths) > 1
]

if duplicates:
    print("\nEXACT DUPLICATES FOUND:")
    for group in duplicates:
        print("\nSame SHA-256:")
        for path in group:
            print(f"  {path.relative_to(ROOT)}")
else:
    print("\nNo exact duplicate model files found.")
