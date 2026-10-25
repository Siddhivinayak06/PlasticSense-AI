# Scientific Evaluation Methodology: WasteSense AI Model Benchmark

**Document Version**: 1.0  
**Project**: WasteSense AI / PlasticSense AI  
**Author**: Antigravity (Google DeepMind Team)  
**Date**: October 25, 2026  
**Target Domain**: Dense Municipal Solid Waste (MSW) & Uncontrolled Dumpsites  
**Target Hardware**: NVIDIA GeForce RTX 5060 Laptop GPU (8 GB GDDR6)  

---

## 1. Research Objectives & Problem Formulation

Standard object detection datasets (COCO, Pascal VOC) evaluate models in domestic, office, or driving environments with distinct, non-overlapping objects against clear backgrounds. In contrast, municipal solid waste heaps and open dumpsites present severe vision challenges:
1. **Extreme Object Occlusion & Clutter**: Objects are crinkled, fractured, and stacked dozens deep.
2. **Material vs. Semantic Duality**: A single plastic item (e.g., polyethylene terephthalate water bottle) may be deformed, crushed, dirty, or transparent.
3. **Severe Class Imbalance**: Dumpsite mass in developing regions is dominated by single-use low-density plastics (LDPE/PP films), while metal and glass appear in lower frequencies.

This study implements a rigorous, leak-free, reproducible comparative benchmark evaluating six candidate architectures and configurations under identical environmental conditions.

---

## 2. Dataset Hygiene & Deduplication Protocol

### 2.1 The Data Leakage Problem
Prior informal tests in `WasteSense-Model-Lab/test_images/` contained 31 filenames. A cryptographic audit using SHA-256 revealed **only 10 unique physical scenes**:
- 11 identical copies of the Kalyan dumpsite image (`0956e02a97954215857ec5dbfac4182f.jpeg`) were present under distinct names.
- Multiple duplicate pairs existed across the remaining files.

Evaluating models across duplicated images artfully skews aggregate metrics toward whichever scene is repeated most frequently.

### 2.2 WasteSense-10-Val Held-Out Benchmark Split
To prevent data leakage and metric distortion, we constructed the deduplicated evaluation split:
`WasteSense-Model-Lab/dataset/ground_truth/images/`
consisting of exactly **10 distinct physical scenes** representing Indian dumpsites, street refuse heaps, roadside litter piles, and embankment waste accumulations.

### 2.3 Ground-Truth Annotation Protocol
Ground-truth bounding boxes and material classes were generated in standard YOLO format:
$$\text{Row} = [\text{class\_id}, x_{\text{center}}, y_{\text{center}}, w, h]$$
normalized to $[0, 1]$ relative to native image dimensions.

The split contains **215 validated ground-truth objects** across four core material classes:
- **Class 0 (Plastic)**: 169 objects (78.6%)
- **Class 1 (Metal)**: 15 objects (7.0%)
- **Class 2 (Paper)**: 25 objects (11.6%)
- **Class 3 (Glass)**: 6 objects (2.8%)

---

## 3. Class Harmonization Mapping

Because candidate models were trained on disparate taxonomies (ranging from 5 to 22 classes), direct comparison requires an explicit, mathematically sound ontology harmonization.

| Harmonized Class ID | Harmonized Class Name | BiaEye (6 classes) | TACO (5 classes) | PlasticSense (10 classes) | Roboflow (22 classes) | HF YOLOv8m-seg (5 classes) |
|---|---|---|---|---|---|---|
| **0** | **Plastic** | `plastic` (0) | `Plastic` (0) | `plastic_bottle` (0), `plastic_bag_wrapper` (1), `plastic_container_cup` (2), `plastic_cap_lid` (3), `plastic_straw` (4), `other_plastic` (5) | `plastic_bag` (9), `plastic_bottle` (10), `plastic_box` (12), `plastic_cup` (14), `snack_bag` (19), `straw` (21), etc. | `Plastic` (3) |
| **1** | **Metal** | `metal` (3) | `Metal` (1) | `metal_can` (6) | `can` (1), `chemical_spray_can` (6), `battery` (0) | `Metal` (1) |
| **2** | **Paper** | `paper` (1) | `Paper` (3) | `paper_carton` (8) | `cardboard_box` (3), `cardboard_bowl` (2), `reuseable_paper` (16), `scrap_paper` (17) | `Paper` (2) |
| **3** | **Glass** | `glass` (2) | `Glass` (2) | `glass` (7) | `light_bulb` (7) | `Glass` (0) |
| **Excluded** | **Background / Other** | `organic` (4), `bulky` (5) | `Other` (4) | `cigarette` (9) | `stick` (20), `paint_bucket` (8) | `Waste` (4) |

---

## 4. Evaluation Metrics & Mathematical Formulation

### 4.1 Bounding Box IoU
For a predicted box $B_p$ and a ground-truth box $B_{gt}$:
$$\text{IoU}(B_p, B_{gt}) = \frac{\text{Area}(B_p \cap B_{gt})}{\text{Area}(B_p \cup B_{gt})}$$

### 4.2 Greedy Hungarian-Style Box Matching
For each class $c$ and each image:
1. Sort all predictions descending by confidence score: $\hat{y}_1, \hat{y}_2, \dots, \hat{y}_K$.
2. For each prediction $\hat{y}_k$, find the unmatched ground-truth box $B_{gt}^*$ of class $c$ with the maximal $\text{IoU} \ge \tau$.
3. If found, mark $\hat{y}_k$ as **True Positive (TP)** and mark $B_{gt}^*$ as matched.
4. If no unmatched box satisfies $\text{IoU} \ge \tau$, mark $\hat{y}_k$ as **False Positive (FP)**.
5. All unmatched ground-truth boxes are **False Negatives (FN)**.

### 4.3 Average Precision (AP) & mAP
Using the 101-point monotonic envelope interpolation standard (COCO protocol):
$$p_{\text{interp}}(r) = \max_{\tilde{r} \ge r} p(\tilde{r})$$
$$\text{AP} = \frac{1}{101} \sum_{r \in \{0.0, 0.01, \dots, 1.0\}} p_{\text{interp}}(r)$$

Metrics reported:
- $\text{mAP}_{50}$: Mean AP across the 4 material classes at $\text{IoU} = 0.50$.
- $\text{mAP}_{50:95}$: Mean AP averaged across 10 IoU thresholds $\tau \in [0.50, 0.55, \dots, 0.95]$.

### 4.4 Containment Deduplication (IoM)
To resolve the dense overlapping label problem without suppressing genuinely adjacent distinct items:
$$\text{IoM}(B_1, B_2) = \frac{\text{Area}(B_1 \cap B_2)}{\min(\text{Area}(B_1), \text{Area}(B_2))}$$
If $\text{IoM}(B_1, B_2) \ge 0.80$, the smaller nested box is suppressed if both belong to the same parent accumulation.

### 4.5 Mask Coverage Metric
For instance segmentation models:
$$\text{Coverage (\%)} = 100 \times \frac{|\bigcup_{i=1}^M M_i|}{W \times H}$$
where $M_i$ represents the binary segmentation mask of instance $i$ resized to native image dimensions $(W, H)$.

---

## 5. Hardware & Environmental Controls

To ensure microsecond-level reproducibility, all tests adhere to strict benchmarking rules:
- **Batch Size**: 1 (simulating online user upload).
- **Warmup**: Two warmup passes per model before timer initiation to ensure CUDA kernel compilation and PyTorch context caching do not distort measurements.
- **Timing**: High-precision `time.perf_counter()` measuring end-to-end inference per image.
- **GPU Memory**: `torch.cuda.reset_peak_memory_stats()` prior to each model run; peak memory queried via `torch.cuda.max_memory_allocated()`.
- **System Platform**: Linux 6.17, Python 3.11, PyTorch 2.6.0+cu124, Ultralytics 8.4.155, NVIDIA RTX 5060 Laptop GPU (8GB VRAM).

---

## 6. Reproduction Command

To reproduce all tables and figures from scratch:
```bash
cd /home/bipin/Documents/PlasticSense-AI
MPLCONFIGDIR=/tmp/mpl_config Backend/.venv/bin/python3 WasteSense-Model-Lab/scripts/evaluate_research_models.py
```
All outputs will be deterministically populated in `WasteSense-Model-Lab/results/research_evaluation/`.
