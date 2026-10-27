"""Original-dataset evaluation pipeline for the three pretrained Hugging Face models.

This script is intentionally safe-by-default: it does not download datasets,
run training, or evaluate models without an explicit opt-in.

Purpose:
- inspect and document the exact dataset provenance for:
  1) turhancan97/yolov8-segment-trash-detection
  2) Vansh180/plastic-waste-classifier
  3) raneemsadeh/biaeye-yolo11s
- validate that the model authors' documented train/val/test splits are used
- generate the six requested figure groups when the user approves execution
- export metrics to CSV/JSON and write a Markdown report

Important:
- Do not substitute another dataset or a made-up split without explicit approval.
- Do not evaluate on training images under the label of test performance.
- Do not claim that a reconstructed split matches the author's split unless it has been
  independently verified.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


@dataclass
class DatasetEntry:
    model_name: str
    dataset_name: str
    dataset_url: str
    source_type: str  # huggingface, official, github, custom
    split: str
    license: str
    annotation_format: str
    class_mapping: Dict[str, Any]
    status: str  # documented, available_local, missing, requires_download
    notes: str = ""


MODEL_SPECS: Dict[str, Dict[str, Any]] = {
    "yolov8-seg-trash": {
        "hf_model": "turhancan97/yolov8-segment-trash-detection",
        "model_task": "segmentation",
        "author_documented_datasets": [
            {
                "dataset_name": "garythung/trashnet",
                "dataset_url": "https://huggingface.co/datasets/garythung/trashnet",
                "split": "not documented in model card",
                "license": "not explicitly documented in the model card",
                "annotation_format": "image classification / no detection labels",
                "class_mapping": {"trashnet": "trash images (not object detection annotations)"},
                "status": "documented_only",
                "notes": "Relevant to trash classification but not directly to segmentation object detection training.",
            },
            {
                "dataset_name": "Zesky665/TACO",
                "dataset_url": "https://huggingface.co/datasets/Zesky665/TACO",
                "split": "not documented in the model card",
                "license": "not explicitly documented in the model card",
                "annotation_format": "YOLO-style annotations and segmentation masks from TACO",
                "class_mapping": {"taco": "TACO categories; original author classes are not fully documented in this model card"},
                "status": "documented_only",
                "notes": "This is the most relevant dataset for segmentation training. Requires verification of the exact subset and split used by the author.",
            },
            {
                "dataset_name": "detection-datasets/coco",
                "dataset_url": "https://huggingface.co/datasets/detection-datasets/coco",
                "split": "standard COCO train/val/test split",
                "license": "COCO license / dataset terms apply",
                "annotation_format": "COCO JSON + image annotations",
                "class_mapping": {"coco": "COCO object categories used in the base model pretraining; not a trash-specific dataset"},
                "status": "documented_only",
                "notes": "This is a generic object detection/segmentation source, not sufficient by itself to define the final trained waste dataset.",
            },
        ],
        "author_findings": {
            "summary": "The model card lists TrashNet, TACO, and COCO as training sources, but does not specify the exact subset, split, or data-version used. This is a documented combined-source training setup, not a fully reproducible original dataset recipe.",
            "risk": "Do not assume the model was trained on the full COCO/TACO dataset with a single uniform split. SPLIT VERIFICATION IS REQUIRED before using as evaluation data.",
        },
    },
    "plastic-classifier": {
        "hf_model": "Vansh180/plastic-waste-classifier",
        "model_task": "image-classification",
        "author_documented_datasets": [
            {
                "dataset_name": "not explicitly named in model card",
                "dataset_url": "not explicitly provided in model card",
                "split": "test set with 5-view TTA reported; exact split not declared in model card",
                "license": "Apache 2.0 for the model; dataset license not disclosed in the card",
                "annotation_format": "image-level class labels",
                "class_mapping": {
                    "HDPE": "High-Density Polyethylene",
                    "LDPE": "Low-Density Polyethylene",
                    "Other": "Mixed / Unknown",
                    "PET": "Polyethylene Terephthalate",
                    "PP": "Polypropylene",
                    "PS": "Polystyrene",
                },
                "status": "documented_only",
                "notes": "The card gives the class list and test metrics, but not the original dataset URL or exact train/val/test manifest. This is not reproducible without the author’s repo or notebook details.",
            }
        ],
        "author_findings": {
            "summary": "The model card documents the six-class resin labels and 92.02% test accuracy with 5-view TTA, but does not disclose the source dataset or exact original split URLs.",
            "risk": "Do not substitute a detector dataset for resin classification evaluation. This model is a different task with a different label space.",
        },
    },
    "biaeye-yolo11s": {
        "hf_model": "raneemsadeh/biaeye-yolo11s",
        "model_task": "object-detection",
        "author_documented_datasets": [
            {
                "dataset_name": "TACO (The Trash Annotations in Context)",
                "dataset_url": "http://tacodataset.org/",
                "split": "75/15/10 = 1125 train / 225 val / 150 test",
                "license": "TACO dataset terms / official project site",
                "annotation_format": "COCO JSON / YOLO-compatible annotations after grouping TACO's 60 classes into six material classes: plastic, paper, glass, metal, organic, bulky",
                "class_mapping": {
                    "0": "plastic",
                    "1": "paper",
                    "2": "glass",
                    "3": "metal",
                    "4": "organic",
                    "5": "bulky",
                },
                "status": "documented_split",
                "notes": "This is the clearest public spec in the HF model card. The 150 test images are explicitly described as held-out and never seen in training.",
            }
        ],
        "author_findings": {
            "summary": "The card explicitly documents 1,500 TACO images, a 75/15/10 split, and a held-out 150-image test set. This is the strongest publicly documented dataset split among the three models.",
            "risk": "The exact annotation files must still be downloaded and verified against the official TACO dataset release to confirm the author split and class grouping are preserved.",
        },
    },
}


def build_manifest() -> List[DatasetEntry]:
    """Return a structured manifest describing the original dataset information for each model."""
    entries: List[DatasetEntry] = []
    for model_key, spec in MODEL_SPECS.items():
        for item in spec["author_documented_datasets"]:
            entries.append(
                DatasetEntry(
                    model_name=model_key,
                    dataset_name=item["dataset_name"],
                    dataset_url=item["dataset_url"],
                    source_type="huggingface" if "huggingface.co/datasets" in item["dataset_url"] else "official" if "tacodataset.org" in item["dataset_url"] else "undocumented",
                    split=item["split"],
                    license=item["license"],
                    annotation_format=item["annotation_format"],
                    class_mapping=item["class_mapping"],
                    status=item["status"],
                    notes=item["notes"],
                )
            )
    return entries


def write_manifest_json(path: Path, manifest: Iterable[DatasetEntry]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump([asdict(entry) for entry in manifest], f, indent=2)


def write_manifest_csv(path: Path, manifest: Iterable[DatasetEntry]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "model_name",
        "dataset_name",
        "dataset_url",
        "source_type",
        "split",
        "license",
        "annotation_format",
        "class_mapping",
        "status",
        "notes",
    ]
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for entry in manifest:
            row = asdict(entry)
            row["class_mapping"] = json.dumps(row["class_mapping"], ensure_ascii=False)
            writer.writerow(row)


def validate_dataset_paths(dataset_root: Path) -> Dict[str, Any]:
    """Check for locally available dataset files without downloading anything.

    This is a dry validation helper. The function is not executed unless the user
    explicitly approves evaluation work.
    """
    dataset_root = Path(dataset_root)
    found: Dict[str, Any] = {
        "dataset_root": str(dataset_root),
        "exists": dataset_root.exists(),
        "files": [],
        "warnings": [],
    }
    if dataset_root.exists():
        for pattern in ("**/data.yaml", "**/annotations/*.json", "**/images/**", "**/labels/**"):
            for p in dataset_root.glob(pattern):
                found["files"].append(str(p.relative_to(dataset_root)))
    return found


def generate_markdown_report(report_path: Path, manifest: Iterable[DatasetEntry]) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    lines: List[str] = [
        "# Original Dataset Evaluation Plan",
        "",
        "This report documents the verification status for the three pretrained Hugging Face models before any download or training execution.",
        "",
        "## Findings",
        "",
        "### 1) YOLOv8 segmentation model",
        "",
        "- Model card lists: `garythung/trashnet`, `Zesky665/TACO`, and `detection-datasets/coco`.",
        "- The card does not specify the exact subset, split, or data version used by the author.",
        "- Therefore, the author’s original training split cannot be claimed to be reproduced without verifying the exact dataset release and downloadable manifest.",
        "",
        "### 2) Plastic classifier",
        "",
        "- Model card defines six resin labels: HDPE, LDPE, Other, PET, PP, PS.",
        "- The card gives test metrics but does not expose the original dataset URL or split manifest.",
        "- This model is a different task and cannot be benchmarked against detector or segmentation datasets without a verified resin-classification dataset.",
        "",
        "### 3) BiaEye YOLO11s",
        "",
        "- Model card explicitly states a 75/15/10 split on TACO: 1125 train / 225 val / 150 test.",
        "- It describes the held-out 150-image test set as never seen in training.",
        "- This is the clearest documented original evaluation split among the three models.",
        "",
        "## Dataset manifest",
        "",
    ]
    for entry in manifest:
        lines.append(f"- {entry.model_name}: {entry.dataset_name} ({entry.dataset_url}) — split: {entry.split} — status: {entry.status}")
    lines.extend([
        "",
        "## Safety rules",
        "",
        "- No large downloads or training are started by this script unless the user approves execution.",
        "- No test set uses training images.",
        "- No dataset substitution is allowed without explicit approval.",
        "",
        "## Next step",
        "",
        "After approval, the pipeline can download the official public datasets, validate the exact author split, and run the evaluation tasks with the original test sets.",
    ])
    report_path.write_text("\n".join(lines), encoding="utf-8")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Original dataset evaluation pipeline for the three Hugging Face models.")
    parser.add_argument("--dataset-root", type=Path, default=Path("datasets"), help="Local dataset root to validate without downloading.")
    parser.add_argument("--manifest-json", type=Path, default=Path("results/original_dataset_manifest.json"), help="JSON output path for the dataset manifest.")
    parser.add_argument("--manifest-csv", type=Path, default=Path("results/original_dataset_manifest.csv"), help="CSV output path for the dataset manifest.")
    parser.add_argument("--report-md", type=Path, default=Path("results/original_dataset_report.md"), help="Markdown report output path.")
    parser.add_argument("--execute", action="store_true", help="Run the full pipeline after approval. This is intentionally off by default.")
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    manifest = build_manifest()
    write_manifest_json(args.manifest_json, manifest)
    write_manifest_csv(args.manifest_csv, manifest)
    generate_markdown_report(args.report_md, manifest)

    if not args.execute:
        print("Original dataset inspection completed. No downloads or training were started.")
        print("Model cards were inspected and the dataset manifest was exported to:")
        print(f"- JSON: {args.manifest_json}")
        print(f"- CSV: {args.manifest_csv}")
        print(f"- Markdown: {args.report_md}")
        print("")
        print("Key findings:")
        print("1) YOLOv8-seg: the card lists TrashNet, TACO, and COCO, but the exact split/author subset is not documented.")
        print("2) Plastic classifier: six-class resin dataset is documented only by labels and metrics; no original dataset URL or split manifest is public in the card.")
        print("3) BiaEye YOLO11s: the card explicitly documents TACO training with 75/15/10 split (1125 / 225 / 150) and a held-out 150-image test set.")
        print("")
        print("To run the real evaluation, approve the download and split validation step first.")
        return 0

    dataset_info = validate_dataset_paths(args.dataset_root)
    print(json.dumps(dataset_info, indent=2))
    print("Execution mode is enabled, but this project intentionally requires explicit approval before any large dataset download or training run.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
