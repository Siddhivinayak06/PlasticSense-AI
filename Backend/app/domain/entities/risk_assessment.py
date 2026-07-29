from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Optional


@dataclass
class RiskAssessment:
    id: Optional[str]
    detection_id: str
    score: float
    level: str
    strategy_breakdown: Dict[str, float] = field(default_factory=dict)
    computed_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
