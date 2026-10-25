# WasteSense AI: Research Paper Model Evaluation Package

This directory contains the complete, reproducible model evaluation benchmark, quantitative comparison tables, and publication-ready figures for the WasteSense AI / PlasticSense AI research paper.

---

## 📁 Directory Structure

| File | Type | Description |
|---|---|---|
| [`model_comparison.csv`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/model_comparison.csv) | CSV | Primary benchmark table: mAP50, mAP50-95, P, R, F1, latency, throughput, VRAM, and parameters across 6 models. |
| [`per_class_metrics.csv`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/per_class_metrics.csv) | CSV | Fine-grained per-class breakdown (Plastic, Metal, Paper, Glass) for each candidate. |
| [`per_image_metrics.csv`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/per_image_metrics.csv) | CSV | Per-scene latency, detection counts, and ground-truth counts across the 10 held-out images. |
| [`confidence_sweep_metrics.csv`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/confidence_sweep_metrics.csv) | CSV | Confidence sweep data ($\tau \in [0.10, 0.50]$) demonstrating precision/recall tradeoffs. |
| [`evaluation_config.json`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/evaluation_config.json) | JSON | Machine-readable hardware specs, evaluation parameters, and model metadata. |
| [`evaluation_methodology.md`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/evaluation_methodology.md) | Markdown | Rigorous mathematical and methodological documentation. |
| [`RESEARCH_PAPER_MODEL_EVALUATION_REPORT.md`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/RESEARCH_PAPER_MODEL_EVALUATION_REPORT.md) | Markdown | Complete academic research paper evaluation report with literature review, tables, and discussions. |

### Publication-Quality Figures (300+ DPI, PNG + Vector PDF)

- **Figure 1**: [`fig_pr_curves_comparison.png`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/fig_pr_curves_comparison.png) ([`PDF`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/fig_pr_curves_comparison.pdf)) — Precision-Recall curves across models and classes.
- **Figure 2**: [`fig_confusion_matrices.png`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/fig_confusion_matrices.png) ([`PDF`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/fig_confusion_matrices.pdf)) — 6-panel normalized confusion matrices showing background and class confusion.
- **Figure 3**: [`fig_accuracy_latency_tradeoff.png`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/fig_accuracy_latency_tradeoff.png) ([`PDF`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/fig_accuracy_latency_tradeoff.pdf)) — mAP@0.50 vs. Inference Latency (ms) bubble plot.
- **Figure 4**: [`fig_per_class_f1_radar.png`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/fig_per_class_f1_radar.png) ([`PDF`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/fig_per_class_f1_radar.pdf)) — Per-class F1-score comparison grouped bar chart.
- **Figure 5**: [`fig_qualitative_cross_model_comparison.png`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/fig_qualitative_cross_model_comparison.png) ([`PDF`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/fig_qualitative_cross_model_comparison.pdf)) — 2x3 qualitative visual panel on Kalyan dumpsite imagery.
- **Figure 6**: [`fig_failure_cases_analysis.png`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/fig_failure_cases_analysis.png) ([`PDF`](file:///home/bipin/Documents/PlasticSense-AI/WasteSense-Model-Lab/results/research_evaluation/fig_failure_cases_analysis.pdf)) — TP, FP, and FN failure mode distribution.

---

## ⚡ Reproduction Steps

To execute the benchmark and regenerate all files:

```bash
# 1. Activate project virtual environment
cd /home/bipin/Documents/PlasticSense-AI
source Backend/.venv/bin/activate

# 2. Run evaluation suite
MPLCONFIGDIR=/tmp/mpl_config python3 WasteSense-Model-Lab/scripts/evaluate_research_models.py
```

Execution runtime on NVIDIA GeForce RTX 5060 Laptop GPU: **~45 seconds**.
