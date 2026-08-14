import os
import math
import uuid
import cv2
from collections import Counter
from typing import Dict, Any

from app.application.interfaces.i_risk_repository import IRiskRepository
from app.domain.entities.detection import Detection
from app.domain.entities.risk_assessment import RiskAssessment

# Hazard Weights based on new waste groups
HAZARD_WEIGHTS = {
    "plastic": 3,
    "glass": 3,
    "metal": 2,
    "paper": 1,
    "cardboard": 1,
    "organic": 2,
    "textile": 1,
    "wood": 1,
    "rubber": 3,
    "foam": 4,
    "other": 2,
}

W_COUNT = 0.35
W_DENSITY = 0.30
W_HAZARD = 0.25
W_WATER = 0.10
MAX_EXPECTED_OBJECTS = 50
MAX_EXPECTED_DENSITY = 60.0
MAX_HAZARD_WEIGHT = max(HAZARD_WEIGHTS.values())

SEVERITY_LEVELS = [
    {"min": 0.0,  "max": 25.0,  "level": "low"},
    {"min": 25.0, "max": 50.0,  "level": "medium"},
    {"min": 50.0, "max": 75.0,  "level": "high"},
    {"min": 75.0, "max": 100.0, "level": "critical"},
]



class RiskService:
    def __init__(self, repository: IRiskRepository):
        self.repository = repository

    def assess(self, detection: Detection) -> RiskAssessment:
        if not detection.id:
            raise ValueError("RiskService requires an already-persisted detection")

        img_w, img_h = self._get_image_dimensions(detection.image_url)
        
        density_score = self._calculate_density(detection, img_w, img_h)
        hazard_score = self._calculate_hazard(detection)
        lat = detection.location.latitude if detection.location else None
        lon = detection.location.longitude if detection.location else None
        waterbody_score = self._check_waterbody_proximity(lat, lon)
        count_score = min(len(detection.items) / MAX_EXPECTED_OBJECTS * 100.0, 100.0)

        severity_score = round(
            W_COUNT * count_score
            + W_DENSITY * density_score
            + W_HAZARD * hazard_score
            + W_WATER * waterbody_score,
            2
        )
        severity_score = max(0.0, min(100.0, severity_score))

        level = "low"
        for lvl in SEVERITY_LEVELS:
            if lvl["min"] <= severity_score <= lvl["max"]:
                level = lvl["level"]
                break

        breakdown = {
            "object_count": count_score,
            "density": density_score,
            "hazard": hazard_score,
            "waterbody": waterbody_score
        }

        return self.repository.save(RiskAssessment(
            id=str(uuid.uuid4()), detection_id=detection.id, score=severity_score,
            level=level, strategy_breakdown=breakdown,
        ))

    def get_for_detection(self, detection_id: str):
        return self.repository.get_by_detection_id(detection_id)

    def _get_image_dimensions(self, image_url: str) -> tuple[int, int]:
        # image_url format is typically 'uploads/filename.ext'. Map this to local file system.
        file_path = image_url
        if not os.path.exists(file_path):
            return 640, 640
        img = cv2.imread(file_path)
        if img is None:
            return 640, 640
        h, w = img.shape[:2]
        return w, h

    def _calculate_density(self, detection: Detection, img_w: int, img_h: int) -> float:
        image_area = img_w * img_h
        if image_area == 0 or not detection.items:
            return 0.0
        total_bbox = sum(item.bbox_w * item.bbox_h for item in detection.items)
        cov = (total_bbox / image_area) * 100.0
        return round(min(cov / MAX_EXPECTED_DENSITY * 100.0, 100.0), 2)

    def _calculate_hazard(self, detection: Detection) -> float:
        if not detection.items:
            return 0.0
        counter = Counter(item.waste_group for item in detection.items)
        raw = sum(cnt * HAZARD_WEIGHTS.get(cls, 2) for cls, cnt in counter.items())
        mx = len(detection.items) * MAX_HAZARD_WEIGHT
        return round(raw / mx * 100.0 if mx else 0.0, 2)

    def _check_waterbody_proximity(self, lat: float | None, lon: float | None) -> float:
        if lat is None or lon is None:
            return 0.0

        # Mock Waterbodies for proximity checking
        WATERBODIES = [
            {"name": "Yamuna River", "lat": 28.6139, "lon": 77.2090},
            {"name": "Ganges River", "lat": 25.3176, "lon": 82.9739},
            {"name": "Hussain Sagar", "lat": 17.4239, "lon": 78.4738},
            {"name": "Marina Beach", "lat": 13.0500, "lon": 80.2824},
            {"name": "Powai Lake", "lat": 19.1275, "lon": 72.9060},
        ]

        def _haversine(la1, lo1, la2, lo2):
            R = 6371.0
            la1r, la2r = math.radians(la1), math.radians(la2)
            dla = math.radians(la2 - la1)
            dlo = math.radians(lo2 - lo1)
            a = math.sin(dla / 2) ** 2 + math.cos(la1r) * math.cos(la2r) * math.sin(dlo / 2) ** 2
            return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        dists = [_haversine(lat, lon, w["lat"], w["lon"]) for w in WATERBODIES]
        dist = min(dists)
        score = max(0, (1 - dist / 10.0) * 100.0) if dist < 10.0 else 0.0
        return round(score, 2)
