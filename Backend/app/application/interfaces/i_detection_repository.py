from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from app.domain.entities.detection import Detection


class IDetectionRepository(ABC):
    @abstractmethod
    def save(self, detection: Detection) -> Detection:
        """Persist a Detection entity and return the saved entity."""
        pass

    @abstractmethod
    def update(self, detection: Detection) -> Detection:
        """Persist updated status, model result, and detection items."""
        pass

    @abstractmethod
    def get_by_id(self, detection_id: str) -> Optional[Detection]:
        """Find a Detection by ID."""
        pass

    @abstractmethod
    def get_all(self, skip: int = 0, limit: int = 10) -> Tuple[List[Detection], int]:
        """List Detections with pagination. Returns (items, total_count)."""
        pass

    @abstractmethod
    def list_map_detections(self) -> List[Detection]:
        """List Detections that have valid GPS coordinates."""
        pass
