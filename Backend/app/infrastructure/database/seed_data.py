import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.core.logging import logger
from app.infrastructure.database.models.ngo_model import NGOTeamModel
from app.infrastructure.database.models.assignment_model import CleanupAssignmentModel
from app.infrastructure.database.models.detection_model import DetectionModel


def seed_ngos_and_assignments(db: Session):
    """Seed initial NGO teams and cleanup assignments if tables are empty."""
    try:
        ngo_count = db.query(NGOTeamModel).count()
        seeded_ngos = []
        if ngo_count == 0:
            logger.info("Seeding initial NGO teams...")
            initial_ngos = [
                NGOTeamModel(
                    id=str(uuid.uuid4()),
                    name="Clean Ocean Foundation",
                    city="Mumbai",
                    state="Maharashtra",
                    contact_person="Rajiv Sharma",
                    email="rajiv@cleanocean.org",
                    phone="+91 98201 44521",
                    team_size=24,
                    active_assignments=2,
                    completed_cleanups=34,
                    availability="available",
                    current_workload="light",
                    performance_score=96,
                    avg_completion_days=2.1,
                    specializations=["Coastline", "Microplastics", "River Mouths"],
                ),
                NGOTeamModel(
                    id=str(uuid.uuid4()),
                    name="Green Earth Volunteers",
                    city="Chennai",
                    state="Tamil Nadu",
                    contact_person="Priya Sundaram",
                    email="priya@greenearth.org",
                    phone="+91 98402 11983",
                    team_size=18,
                    active_assignments=1,
                    completed_cleanups=28,
                    availability="available",
                    current_workload="moderate",
                    performance_score=92,
                    avg_completion_days=2.8,
                    specializations=["Beaches", "Estuaries", "Urban Canals"],
                ),
                NGOTeamModel(
                    id=str(uuid.uuid4()),
                    name="Coastal Care Taskforce",
                    city="Panaji",
                    state="Goa",
                    contact_person="Mario Fernandes",
                    email="mario@coastalcare.org",
                    phone="+91 98221 88349",
                    team_size=15,
                    active_assignments=3,
                    completed_cleanups=42,
                    availability="busy",
                    current_workload="heavy",
                    performance_score=94,
                    avg_completion_days=3.2,
                    specializations=["Tourist Beaches", "Mangroves"],
                ),
                NGOTeamModel(
                    id=str(uuid.uuid4()),
                    name="River Watchers Alliance",
                    city="Kolkata",
                    state="West Bengal",
                    contact_person="Debashis Mukherjee",
                    email="deb@riverwatch.org",
                    phone="+91 98305 77124",
                    team_size=20,
                    active_assignments=1,
                    completed_cleanups=19,
                    availability="available",
                    current_workload="light",
                    performance_score=89,
                    avg_completion_days=3.5,
                    specializations=["Ganges Estuary", "Industrial Runoff"],
                ),
                NGOTeamModel(
                    id=str(uuid.uuid4()),
                    name="Eco Warriors India",
                    city="Kochi",
                    state="Kerala",
                    contact_person="Ananya Menon",
                    email="ananya@ecowarriors.in",
                    phone="+91 98470 55612",
                    team_size=16,
                    active_assignments=0,
                    completed_cleanups=25,
                    availability="available",
                    current_workload="light",
                    performance_score=91,
                    avg_completion_days=2.4,
                    specializations=["Backwaters", "Lagoons"],
                ),
            ]
            db.add_all(initial_ngos)
            db.commit()
            seeded_ngos = initial_ngos
            logger.info(f"Seeded {len(initial_ngos)} NGO teams successfully.")
        else:
            seeded_ngos = db.query(NGOTeamModel).all()

        assignment_count = db.query(CleanupAssignmentModel).count()
        if assignment_count == 0:
            logger.info("Seeding initial cleanup assignments linked to real detections...")
            detections = db.query(DetectionModel).order_by(DetectionModel.created_at.desc()).limit(10).all()

            if detections:
                sample_assignments = []
                now = datetime.now(timezone.utc)

                # Assignment 1: Critical/Urgent pending
                d1 = detections[0]
                risk1 = d1.risk_assessment
                score1 = risk1.score if risk1 else 78.0
                sev1 = (risk1.level if risk1 else "high").lower()
                sample_assignments.append(CleanupAssignmentModel(
                    id="CLN-2026-0001",
                    title="Shoreline High-Density Plastic Cleanup",
                    detection_id=d1.id,
                    hotspot_id="HS-2026-01",
                    location_name=f"Sector Lat {round(d1.latitude or 19.16, 4)}, Lng {round(d1.longitude or 72.95, 4)}",
                    latitude=d1.latitude or 19.1616,
                    longitude=d1.longitude or 72.9473,
                    priority="urgent" if score1 >= 75 else "high",
                    severity=sev1,
                    risk_score=score1,
                    waste_count=len(d1.items) or 8,
                    waste_before=len(d1.items) or 8,
                    status="pending",
                    ngo_team_id=None,
                    ngo_team_name=None,
                    scheduled_date=now + timedelta(days=2),
                    notes="Urgent attention required. High plastic concentration observed in drone survey.",
                    before_image_url=d1.image_url,
                    created_at=now - timedelta(hours=6),
                ))

                # Assignment 2: In progress
                if len(detections) > 1:
                    d2 = detections[1]
                    risk2 = d2.risk_assessment
                    score2 = risk2.score if risk2 else 62.0
                    ngo2 = seeded_ngos[0] if seeded_ngos else None
                    sample_assignments.append(CleanupAssignmentModel(
                        id="CLN-2026-0002",
                        title="Coastal Buffer Debris Removal",
                        detection_id=d2.id,
                        hotspot_id="HS-2026-01",
                        location_name=f"Zone Lat {round(d2.latitude or 19.16, 4)}, Lng {round(d2.longitude or 72.95, 4)}",
                        latitude=d2.latitude or 19.1616,
                        longitude=d2.longitude or 72.9473,
                        priority="high",
                        severity=(risk2.level if risk2 else "high").lower(),
                        risk_score=score2,
                        waste_count=len(d2.items) or 12,
                        waste_before=len(d2.items) or 12,
                        status="in_progress",
                        ngo_team_id=ngo2.id if ngo2 else None,
                        ngo_team_name=ngo2.name if ngo2 else "Clean Ocean Foundation",
                        scheduled_date=now - timedelta(days=1),
                        notes="Active team on site. 65% of perimeter cleared.",
                        before_image_url=d2.image_url,
                        created_at=now - timedelta(days=2),
                    ))

                # Assignment 3: Completed (Ready for verification)
                if len(detections) > 2:
                    d3 = detections[2]
                    risk3 = d3.risk_assessment
                    score3 = risk3.score if risk3 else 45.0
                    ngo3 = seeded_ngos[1] if len(seeded_ngos) > 1 else None
                    sample_assignments.append(CleanupAssignmentModel(
                        id="CLN-2026-0003",
                        title="Beachfront Recyclable Materials Extraction",
                        detection_id=d3.id,
                        hotspot_id="HS-2026-02",
                        location_name=f"Beach Perimeter Lat {round(d3.latitude or 19.16, 4)}, Lng {round(d3.longitude or 72.95, 4)}",
                        latitude=d3.latitude or 19.1616,
                        longitude=d3.longitude or 72.9473,
                        priority="medium",
                        severity=(risk3.level if risk3 else "medium").lower(),
                        risk_score=score3,
                        waste_count=len(d3.items) or 6,
                        waste_before=len(d3.items) or 6,
                        waste_after=1,
                        waste_reduction_percent=83.3,
                        status="completed",
                        ngo_team_id=ngo3.id if ngo3 else None,
                        ngo_team_name=ngo3.name if ngo3 else "Green Earth Volunteers",
                        scheduled_date=now - timedelta(days=4),
                        completed_date=now - timedelta(days=1),
                        notes="Primary cleanup completed. Awaiting AI post-cleanup verification.",
                        before_image_url=d3.image_url,
                        after_image_url=d3.annotated_image_url or d3.image_url,
                        created_at=now - timedelta(days=5),
                    ))

                # Assignment 4: Verified
                if len(detections) > 3:
                    d4 = detections[3]
                    risk4 = d4.risk_assessment
                    score4 = risk4.score if risk4 else 35.0
                    ngo4 = seeded_ngos[2] if len(seeded_ngos) > 2 else None
                    sample_assignments.append(CleanupAssignmentModel(
                        id="CLN-2026-0004",
                        title="Riparian Zone Surface Cleanup",
                        detection_id=d4.id,
                        hotspot_id="HS-2026-03",
                        location_name=f"Estuary Bank Lat {round(d4.latitude or 19.16, 4)}, Lng {round(d4.longitude or 72.95, 4)}",
                        latitude=d4.latitude or 19.1616,
                        longitude=d4.longitude or 72.9473,
                        priority="low",
                        severity="low",
                        risk_score=score4,
                        waste_count=len(d4.items) or 5,
                        waste_before=len(d4.items) or 5,
                        waste_after=0,
                        waste_reduction_percent=100.0,
                        status="verified",
                        ngo_team_id=ngo4.id if ngo4 else None,
                        ngo_team_name=ngo4.name if ngo4 else "Coastal Care Taskforce",
                        scheduled_date=now - timedelta(days=7),
                        completed_date=now - timedelta(days=3),
                        notes="AI post-cleanup image verification confirmed zero surface debris remaining.",
                        before_image_url=d4.image_url,
                        after_image_url=d4.annotated_image_url or d4.image_url,
                        created_at=now - timedelta(days=8),
                    ))

                db.add_all(sample_assignments)
                db.commit()
                logger.info(f"Seeded {len(sample_assignments)} assignments successfully.")

    except Exception as e:
        logger.error(f"Error during seeding: {e}")
        db.rollback()
