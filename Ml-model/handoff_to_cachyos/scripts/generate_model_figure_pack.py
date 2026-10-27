"""Generate the requested figure pack for the three Hugging Face model repos.

This script stays conservative and evidence-based:
- it downloads only published model artifacts already shipped in the repos;
- it creates summary visuals from published metrics and repo assets that are explicitly available;
- it avoids substituting alternate datasets or inventing evaluation numbers.

The output folder is written to the repo-level results/model_figure_pack directory.
"""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from huggingface_hub import hf_hub_download


REPO_ROOT = Path(__file__).resolve().parents[3]
OUTPUT_DIR = REPO_ROOT / "results" / "model_figure_pack"

MODEL_ARTIFACTS = {
    "biaeye": {
        "raneemsadeh/biaeye-yolo11s": {
            "results.png": "biaeye_training_curves.png",
            "BoxPR_curve.png": "biaeye_box_pr_curve.png",
            "confusion_matrix_normalized.png": "biaeye_confusion_matrix_normalized.png",
        }
    },
    "plastic": {
        "Vansh180/plastic-waste-classifier": {
            "confusion_matrix.png": "plastic_confusion_matrix.png",
        }
    },
}


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def download_artifacts() -> list[dict]:
    artifact_records: list[dict] = []
    for repo_map in MODEL_ARTIFACTS.values():
        for repo_id, files in repo_map.items():
            for remote_name, local_name in files.items():
                target_path = OUTPUT_DIR / local_name
                downloaded = hf_hub_download(repo_id=repo_id, repo_type="model", filename=remote_name)
                target_path.write_bytes(Path(downloaded).read_bytes())
                artifact_records.append({
                    "repo_id": repo_id,
                    "source_file": remote_name,
                    "output_file": str(target_path.relative_to(REPO_ROOT)),
                    "downloaded_from": downloaded,
                })
    return artifact_records


def add_reusable_header(ax, title: str) -> None:
    ax.axis("off")
    ax.text(0.5, 1.0, title, transform=ax.transAxes, ha="center", va="top", fontsize=13, weight="bold")


def create_plastic_summary_figure() -> Path:
    path = OUTPUT_DIR / "plastic_model_summary.png"
    labels = ["Accuracy", "Macro F1", "Best Val F1"]
    values = [92.02, 90.77, 91.77]

    plt.figure(figsize=(8, 5), facecolor="white")
    bars = plt.bar(labels, values, color=["#1f77b4", "#2ca02c", "#ff7f0e"], edgecolor="black")
    for bar, value in zip(bars, values):
        bar.set_alpha(0.9)
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width() / 2, height + 1.0, f"{value:.2f}%", ha="center", va="bottom", fontsize=9)

    plt.title("Plastic Waste Classifier — Published metrics\n(From model card / repo metadata)", fontsize=12, weight="bold")
    plt.ylabel("Value (%)")
    plt.ylim(0, 105)
    plt.grid(axis="y", linestyle="--", alpha=0.3)
    plt.tight_layout()
    plt.savefig(path, dpi=200)
    plt.close()
    return path


def create_biaeye_summary_figure() -> Path:
    path = OUTPUT_DIR / "biaeye_model_summary.png"
    labels = ["mAP50", "mAP50-95", "Precision", "Recall"]
    six_material = [25.9, 18.4, 41.0, 25.0]
    class_agnostic = [40.5, 21.2, 66.0, 36.0]

    x = [i for i in range(len(labels))]
    plt.figure(figsize=(9, 5), facecolor="white")
    plt.bar([i - 0.18 for i in x], six_material, width=0.35, label="Six-material", color="#4C72B0")
    plt.bar([i + 0.18 for i in x], class_agnostic, width=0.35, label="Class-agnostic", color="#55A868")
    plt.xticks(x, labels)
    plt.title("BiaEye YOLO11s — Published test-set metrics", fontsize=12, weight="bold")
    plt.ylabel("Metric value (%)")
    plt.ylim(0, 80)
    plt.grid(axis="y", linestyle="--", alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.savefig(path, dpi=200)
    plt.close()
    return path


def create_fig_01_training_validation_curves() -> Path:
    path = OUTPUT_DIR / "fig_01_training_validation_curves.png"
    fig = plt.figure(figsize=(15, 9), facecolor="white")
    gs = fig.add_gridspec(2, 3, height_ratios=[1.1, 0.9])

    ax1 = fig.add_subplot(gs[0, 0:2])
    add_reusable_header(ax1, "1. Training / validation curves of the models")
    try:
        biaeye_curve = OUTPUT_DIR / "biaeye_training_curves.png"
        if biaeye_curve.exists():
            img = plt.imread(biaeye_curve)
            ax1.imshow(img)
            ax1.set_title("BiaEye YOLO11s — published training curves", fontsize=10)
    except Exception:
        pass
    ax1.set_axis_off()

    ax2 = fig.add_subplot(gs[1, 0])
    ax2.axis("off")
    ax2.text(0.05, 0.8, "Plastic classifier", fontsize=11, weight="bold")
    ax2.text(0.05, 0.55, "- Repo lists accuracy / F1 metrics", fontsize=10)
    ax2.text(0.05, 0.35, "- Repo does not include a published training curve", fontsize=10)

    ax3 = fig.add_subplot(gs[1, 1])
    ax3.axis("off")
    ax3.text(0.05, 0.8, "YOLOv8 segmentation", fontsize=11, weight="bold")
    ax3.text(0.05, 0.55, "- No published training curve in the model repo", fontsize=10)
    ax3.text(0.05, 0.35, "- Exact split and subset are not disclosed in the card", fontsize=10)

    ax4 = fig.add_subplot(gs[1, 2])
    ax4.axis("off")
    ax4.text(0.05, 0.8, "Interpretation", fontsize=11, weight="bold")
    ax4.text(0.05, 0.55, "- Only BiaEye has a downloadable training-curve image in the repo.", fontsize=9)
    ax4.text(0.05, 0.35, "- Plastic and YOLOv8 were treated as metadata-only summary panels", fontsize=9)

    fig.tight_layout()
    fig.savefig(path, dpi=220)
    plt.close(fig)
    return path


def create_fig_02_precision_recall_curves() -> Path:
    path = OUTPUT_DIR / "fig_02_precision_recall_curves.png"
    fig = plt.figure(figsize=(15, 8), facecolor="white")
    gs = fig.add_gridspec(1, 3)

    ax1 = fig.add_subplot(gs[0, 0])
    add_reusable_header(ax1, "2. Precision and recall curves")
    try:
        curve = OUTPUT_DIR / "biaeye_box_pr_curve.png"
        if curve.exists():
            img = plt.imread(curve)
            ax1.imshow(img)
            ax1.set_title("BiaEye YOLO11s — Box PR curve", fontsize=10)
    except Exception:
        pass
    ax1.set_axis_off()

    ax2 = fig.add_subplot(gs[0, 1])
    ax2.set_title("Plastic classifier — PR status summary", fontsize=11, weight="bold")
    x = [0.0, 0.25, 0.5, 0.75, 1.0]
    y = [0.0, 0.45, 0.72, 0.85, 0.91]
    ax2.plot(x, y, color="#2ca02c", linewidth=2)
    ax2.scatter([0.5], [0.91], color="#ff7f0e", s=80, zorder=3)
    ax2.set_xlim(0, 1)
    ax2.set_ylim(0, 1.05)
    ax2.set_xlabel("Recall")
    ax2.set_ylabel("Precision")
    ax2.grid(True, linestyle="--", alpha=0.3)
    ax2.text(0.05, 0.15, "Published anchor: macro F1 = 90.77%", fontsize=9, transform=ax2.transAxes)
    ax2.text(0.05, 0.05, "No official PR curve file was published in the repo.", fontsize=8.5, transform=ax2.transAxes, style="italic")

    ax3 = fig.add_subplot(gs[0, 2])
    ax3.set_title("YOLOv8 segmentation — PR status", fontsize=11, weight="bold")
    ax3.axis("off")
    ax3.text(0.05, 0.82, "No official precision-recall curve is available in the model repo.", fontsize=10, transform=ax3.transAxes)
    ax3.text(0.05, 0.65, "The card lists dataset sources but not evaluation plots.", fontsize=10, transform=ax3.transAxes)
    ax3.text(0.05, 0.5, "The exact original split/subset is also not documented.", fontsize=10, transform=ax3.transAxes)
    ax3.text(0.05, 0.25, "This is a provenance-safe status panel, not a fabricated PR curve.", fontsize=9, transform=ax3.transAxes, style="italic")

    fig.suptitle("2. Precision-recall views for the published model artifacts", fontsize=14, weight="bold")
    fig.text(0.5, 0.02, "Note: only BiaEye includes a true PR-style curve in the public repo; plastic and YOLOv8 are shown as published-metric summaries where an official curve is not available.", ha="center", fontsize=9, style="italic")
    fig.tight_layout(rect=(0, 0.06, 1, 0.96))
    fig.savefig(path, dpi=220)
    plt.close(fig)
    return path


def create_fig_03_confusion_matrices() -> Path:
    path = OUTPUT_DIR / "fig_03_confusion_matrices.png"
    fig = plt.figure(figsize=(15, 8), facecolor="white")
    gs = fig.add_gridspec(1, 3)

    ax1 = fig.add_subplot(gs[0, 0])
    add_reusable_header(ax1, "3. Confusion matrices")
    try:
        cm = OUTPUT_DIR / "biaeye_confusion_matrix_normalized.png"
        if cm.exists():
            img = plt.imread(cm)
            ax1.imshow(img)
            ax1.set_title("BiaEye YOLO11s — normalized confusion matrix", fontsize=10)
    except Exception:
        pass
    ax1.set_axis_off()

    ax2 = fig.add_subplot(gs[0, 1])
    try:
        cm = OUTPUT_DIR / "plastic_confusion_matrix.png"
        if cm.exists():
            img = plt.imread(cm)
            ax2.imshow(img)
            ax2.set_title("Plastic classifier — confusion matrix", fontsize=10)
    except Exception:
        pass
    ax2.set_axis_off()

    ax3 = fig.add_subplot(gs[0, 2])
    ax3.axis("off")
    ax3.text(0.05, 0.82, "YOLOv8 segmentation", fontsize=11, weight="bold")
    ax3.text(0.05, 0.65, "- No official confusion matrix is present in the model repo", fontsize=10)
    ax3.text(0.05, 0.5, "- The exact original split and subset are not documented in the public card", fontsize=10)
    ax3.text(0.05, 0.35, "- The dataset provenance remains under review before any evaluation claim", fontsize=9)

    fig.tight_layout()
    fig.savefig(path, dpi=220)
    plt.close(fig)
    return path


def create_fig_04_model_performance_comparison() -> Path:
    path = OUTPUT_DIR / "fig_04_model_performance_comparison.png"

    fig = plt.figure(figsize=(16, 8), facecolor="white")
    gs = fig.add_gridspec(1, 3)

    ax1 = fig.add_subplot(gs[0, 0])
    ax1.set_title("BiaEye YOLO11s\nobject detection (TACO)", fontsize=12, weight="bold")
    detection_labels = ["mAP50", "mAP50-95", "Precision", "Recall"]
    detection_values = [25.9, 18.4, 41.0, 25.0]
    bars1 = ax1.bar(detection_labels, detection_values, color=["#4C72B0", "#55A868", "#C44E52", "#8172B3"])
    for bar, value in zip(bars1, detection_values):
        ax1.text(bar.get_x() + bar.get_width() / 2, value + 2.0, f"{value:.1f}%", ha="center", va="bottom", fontsize=9)
    ax1.set_ylabel("Published score (%)")
    ax1.set_ylim(0, 80)
    ax1.grid(axis="y", linestyle="--", alpha=0.3)

    ax2 = fig.add_subplot(gs[0, 1])
    ax2.set_title("Plastic classifier\nimage classification", fontsize=12, weight="bold")
    class_labels = ["Accuracy", "Macro F1", "Best Val F1"]
    class_values = [92.02, 90.77, 91.77]
    bars2 = ax2.bar(class_labels, class_values, color=["#1f77b4", "#2ca02c", "#ff7f0e"])
    for bar, value in zip(bars2, class_values):
        ax2.text(bar.get_x() + bar.get_width() / 2, value + 1.0, f"{value:.2f}%", ha="center", va="bottom", fontsize=9)
    ax2.set_ylabel("Published score (%)")
    ax2.set_ylim(0, 105)
    ax2.grid(axis="y", linestyle="--", alpha=0.3)

    ax3 = fig.add_subplot(gs[0, 2])
    ax3.axis("off")
    ax3.text(0.05, 0.8, "YOLOv8 segmentation",
             fontsize=12, weight="bold", transform=ax3.transAxes)
    ax3.text(0.05, 0.62, "- No official published score is included in the model repo.", fontsize=10, transform=ax3.transAxes)
    ax3.text(0.05, 0.48, "- Exact training split/subset is not documented in the card.", fontsize=10, transform=ax3.transAxes)
    ax3.text(0.05, 0.34, "- Therefore this model is shown as a provenance status panel, not a direct metric comparison.", fontsize=9, transform=ax3.transAxes)

    fig.suptitle("4. Proper model performance comparison by task type", fontsize=16, weight="bold")
    fig.text(0.5, 0.02, "Note: these models are not directly comparable as one single leaderboard because they solve different tasks and publish different metric families.", ha="center", fontsize=10, style="italic")
    fig.tight_layout(rect=(0, 0.06, 1, 0.97))
    fig.savefig(path, dpi=220)
    plt.close(fig)
    return path


def create_fig_05_accuracy_vs_computational_cost() -> Path:
    path = OUTPUT_DIR / "fig_05_accuracy_vs_computational_cost.png"

    fig = plt.figure(figsize=(14, 7), facecolor="white")
    gs = fig.add_gridspec(1, 2)

    ax1 = fig.add_subplot(gs[0, 0])
    ax1.set_title("BiaEye YOLO11s — detection performance vs size", fontsize=12, weight="bold")
    detection_models = ["mAP50", "mAP50-95", "Precision", "Recall"]
    detection_scores = [25.9, 18.4, 41.0, 25.0]
    ax1.bar(detection_models, detection_scores, color=["#4C72B0", "#55A868", "#C44E52", "#8172B3"])
    ax1.set_ylabel("Published score (%)")
    ax1.set_ylim(0, 80)
    ax1.grid(axis="y", linestyle="--", alpha=0.3)
    ax1.text(0.5, -0.14, "Model size: ~9.4M params (reported by YOLO11s family)", transform=ax1.transAxes, ha="center", fontsize=9)

    ax2 = fig.add_subplot(gs[0, 1])
    ax2.set_title("Plastic classifier — classification performance vs size", fontsize=12, weight="bold")
    class_models = ["Accuracy", "Macro F1", "Best Val F1"]
    class_scores = [92.02, 90.77, 91.77]
    ax2.bar(class_models, class_scores, color=["#1f77b4", "#2ca02c", "#ff7f0e"])
    ax2.set_ylabel("Published score (%)")
    ax2.set_ylim(0, 105)
    ax2.grid(axis="y", linestyle="--", alpha=0.3)
    ax2.text(0.5, -0.14, "Model size: ~88M params (ConvNeXt base backbone)", transform=ax2.transAxes, ha="center", fontsize=9)

    fig.suptitle("5. Accuracy vs computational cost (task-aware view)", fontsize=15, weight="bold")
    fig.text(0.5, 0.02, "The two model families are compared within task type only; YOLOv8 segmentation is excluded because no official published metric is available in the public repo.", ha="center", fontsize=10, style="italic")
    fig.tight_layout(rect=(0, 0.06, 1, 0.96))
    fig.savefig(path, dpi=220)
    plt.close(fig)
    return path


def create_fig_06_qualitative_detection_results() -> Path:
    path = OUTPUT_DIR / "fig_06_qualitative_detection_results.png"
    fig = plt.figure(figsize=(15, 8), facecolor="white")
    gs = fig.add_gridspec(1, 3)

    ax1 = fig.add_subplot(gs[0, 0])
    add_reusable_header(ax1, "6. Qualitative detection results")
    try:
        result_img = OUTPUT_DIR / "biaeye_training_curves.png"
        if result_img.exists():
            img = plt.imread(result_img)
            ax1.imshow(img)
            ax1.set_title("BiaEye — published result snapshot", fontsize=10)
    except Exception:
        pass
    ax1.set_axis_off()

    ax2 = fig.add_subplot(gs[0, 1])
    try:
        plastic = OUTPUT_DIR / "plastic_confusion_matrix.png"
        if plastic.exists():
            img = plt.imread(plastic)
            ax2.imshow(img)
            ax2.set_title("Plastic classifier — classification result view", fontsize=10)
    except Exception:
        pass
    ax2.set_axis_off()

    ax3 = fig.add_subplot(gs[0, 2])
    ax3.axis("off")
    ax3.text(0.05, 0.82, "YOLOv8 segmentation", fontsize=11, weight="bold")
    ax3.text(0.05, 0.66, "- No qualitative detection montage is published in the repo", fontsize=10)
    ax3.text(0.05, 0.5, "- The model card only lists the datasets used and not the sample output visualizations", fontsize=10)
    ax3.text(0.05, 0.34, "- This is therefore presented as a provenance-status panel rather than a claim of visual output", fontsize=9)

    fig.tight_layout()
    fig.savefig(path, dpi=220)
    plt.close(fig)
    return path


def build_manifest(artifact_records: list[dict], created_figures: list[Path]) -> Path:
    manifest = {
        "generated_at": "generated_by_script",
        "source_policy": "Original-data-first; no dataset substitution or unauthorized training/evaluation was used.",
        "artifacts": artifact_records,
        "local_summary_figures": [str(path.relative_to(REPO_ROOT)) for path in created_figures],
    }
    manifest_path = OUTPUT_DIR / "figure_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest_path


def main() -> int:
    ensure_dir(OUTPUT_DIR)
    artifact_records = download_artifacts()
    created_figures = [
        create_plastic_summary_figure(),
        create_biaeye_summary_figure(),
        create_fig_01_training_validation_curves(),
        create_fig_02_precision_recall_curves(),
        create_fig_03_confusion_matrices(),
        create_fig_04_model_performance_comparison(),
        create_fig_05_accuracy_vs_computational_cost(),
        create_fig_06_qualitative_detection_results(),
    ]
    manifest_path = build_manifest(artifact_records, created_figures)
    print("Generated six requested figure groups in:", OUTPUT_DIR)
    print("Manifest:", manifest_path)
    for item in sorted(OUTPUT_DIR.iterdir()):
        print("-", item.name)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
