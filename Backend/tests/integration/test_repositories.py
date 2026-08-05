import unittest
from datetime import datetime, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.domain.entities.detection import Detection, DetectionItem
from app.domain.entities.location import Location
from app.domain.enums.waste_type import WasteType
from app.infrastructure.database.models import DetectionModel, DetectionItemModel, RiskAssessmentModel
from app.infrastructure.database.repositories.detection_repository import DetectionRepository
from app.infrastructure.database.repositories.risk_repository import RiskRepository
from app.infrastructure.database.session import Base


class DatabaseRepositoryIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=self.engine)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.db = self.SessionLocal()
        self.detection_repo = DetectionRepository(self.db)
        self.risk_repo = RiskRepository(self.db)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_save_and_get_detection(self):
        item = DetectionItem(
            id="item-1",
            waste_type=WasteType.PET_BOTTLE,
            confidence=0.92,
            bbox_x=10.0,
            bbox_y=20.0,
            bbox_w=30.0,
            bbox_h=40.0,
        )
        detection = Detection(
            id="det-100",
            location=Location(latitude=12.9716, longitude=77.5946),
            image_url="/static/uploads/test.jpg",
            model_version="v1.0-yolov11",
            detection_status="pending",
            items=[item],
            created_at=datetime.now(timezone.utc),
        )

        saved = self.detection_repo.save(detection)
        self.assertEqual(saved.id, "det-100")
        self.assertEqual(len(saved.items), 1)

        fetched = self.detection_repo.get_by_id("det-100")
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.detection_status, "pending")
        self.assertEqual(fetched.items[0].waste_type, WasteType.PET_BOTTLE)

        # Update detection status
        saved.detection_status = "completed"
        updated = self.detection_repo.update(saved)
        self.assertEqual(updated.detection_status, "completed")

    def test_pagination(self):
        for i in range(15):
            d = Detection(
                id=f"det-{i}",
                location=Location(latitude=12.0 + i * 0.1, longitude=77.0 + i * 0.1),
                image_url=f"/static/uploads/test_{i}.jpg",
                model_version="v1.0",
                detection_status="completed",
                items=[],
                created_at=datetime.now(timezone.utc),
            )
            self.detection_repo.save(d)

        items, total = self.detection_repo.get_all(skip=0, limit=10)
        self.assertEqual(total, 15)
        self.assertEqual(len(items), 10)

        items_page2, total2 = self.detection_repo.get_all(skip=10, limit=10)
        self.assertEqual(total2, 15)
        self.assertEqual(len(items_page2), 5)
