"""Lightweight local image authenticity and AI-generation heuristic screening.

Advisory only. Assesses local pixel frequency distribution and chrominance consistency
without relying on cloud APIs or treating EXIF/GPS metadata as proof of authenticity.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional
import cv2
import numpy as np

logger = logging.getLogger("WasteSense_AI")

DEFAULT_CAVEAT = (
    "Advisory heuristic screening only. Evaluates frequency domain artifacts and "
    "gradient distributions. Never treats EXIF/GPS metadata as proof of authenticity. "
    "Subject to false positives on heavily compressed, HDR, or screenshot images; "
    "does not guarantee detection of all generative models."
)


class AuthenticityScreeningService:
    """Offline heuristic screening for potential synthetic or manipulated imagery."""

    def __init__(self, max_dim: int = 1024):
        self.max_dim = max_dim

    def screen_image(self, image_bgr: np.ndarray) -> Dict[str, Any]:
        """Perform heuristic pixel analysis on decoded BGR image."""
        if image_bgr is None or image_bgr.size == 0:
            return {
                "ai_generation_suspected": False,
                "suspicion_score": 0.0,
                "flag_level": "unspecified",
                "indicators": [],
                "caveat": DEFAULT_CAVEAT,
                "screening_time_ms": 0,
            }

        t0 = time.time()
        try:
            h, w = image_bgr.shape[:2]
            # Normalize dimension for consistent performance
            if max(h, w) > self.max_dim:
                scale = self.max_dim / max(h, w)
                analyzed = cv2.resize(
                    image_bgr,
                    (int(w * scale), int(h * scale)),
                    interpolation=cv2.INTER_AREA,
                )
            else:
                analyzed = image_bgr

            ah, aw = analyzed.shape[:2]
            gray = cv2.cvtColor(analyzed, cv2.COLOR_BGR2GRAY)
            ycrcb = cv2.cvtColor(analyzed, cv2.COLOR_BGR2YCrCb)

            indicators: List[str] = []
            scores: List[float] = []

            # 1. 2D FFT Spectral Lattice Analysis
            # Generative models often introduce periodic grid artifacts from transposed conv / latent decoding
            f = np.fft.fft2(gray.astype(np.float32))
            fshift = np.fft.fftshift(f)
            mag = np.log(np.abs(fshift) + 1e-6)
            mag_norm = (mag - mag.min()) / (mag.max() - mag.min() + 1e-6)

            cy, cx = ah // 2, aw // 2
            y, x = np.ogrid[:ah, :aw]
            r = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)

            high_freq_mask = (r > min(ah, aw) * 0.25) & (r < min(ah, aw) * 0.48)
            if high_freq_mask.sum() > 0:
                high_freq_vals = mag_norm[high_freq_mask]
                hf_max = float(np.max(high_freq_vals))
                hf_mean = float(np.mean(high_freq_vals))
                hf_peak_ratio = hf_max / (hf_mean + 1e-6)

                if hf_peak_ratio > 4.5:
                    indicators.append("periodic_high_frequency_spectral_lattice")
                    scores.append(min(1.0, (hf_peak_ratio - 4.5) / 3.0))
                else:
                    scores.append(0.1)

            # 2. Laplacian High-Frequency Kurtosis
            laplacian = cv2.Laplacian(gray, cv2.CV_32F)
            lap_var = float(np.var(laplacian))
            lap_std = float(np.std(laplacian))
            if lap_std > 1e-4:
                mean_centered = laplacian - np.mean(laplacian)
                kurtosis = float(np.mean(mean_centered ** 4) / (lap_std ** 4 + 1e-6))
                if kurtosis > 45.0 or (kurtosis < 3.5 and lap_var > 100):
                    indicators.append("unnatural_gradient_kurtosis")
                    scores.append(0.55)
                else:
                    scores.append(0.15)

            # 3. Y to Cr/Cb Chrominance noise residual consistency
            cr = ycrcb[:, :, 1].astype(np.float32)
            cb = ycrcb[:, :, 2].astype(np.float32)
            cr_noise = cv2.GaussianBlur(cr, (5, 5), 0) - cr
            cb_noise = cv2.GaussianBlur(cb, (5, 5), 0) - cb

            cr_noise_std = float(np.std(cr_noise))
            cb_noise_std = float(np.std(cb_noise))
            ratio = max(cr_noise_std, cb_noise_std) / (min(cr_noise_std, cb_noise_std) + 1e-6)

            if ratio > 3.0:
                indicators.append("chrominance_noise_channel_imbalance")
                scores.append(0.4)
            else:
                scores.append(0.05)

            composite_score = float(np.mean(scores)) if scores else 0.0
            elapsed_ms = int((time.time() - t0) * 1000)

            flag_level = "low"
            if composite_score >= 0.65:
                flag_level = "high"
            elif composite_score >= 0.35:
                flag_level = "medium"

            return {
                "ai_generation_suspected": composite_score >= 0.60,
                "suspicion_score": round(composite_score, 3),
                "flag_level": flag_level,
                "indicators": indicators,
                "caveat": DEFAULT_CAVEAT,
                "screening_time_ms": elapsed_ms,
            }
        except Exception as e:
            logger.warning("Authenticity screening error: %s", e)
            return {
                "ai_generation_suspected": False,
                "suspicion_score": 0.0,
                "flag_level": "error",
                "indicators": [],
                "caveat": f"Screening encountered an error: {e}",
                "screening_time_ms": int((time.time() - t0) * 1000),
            }
