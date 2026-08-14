from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.dependencies import get_db
from app.infrastructure.database.models.detection_model import DetectionModel, DetectionItemModel

router = APIRouter(prefix="/statistics", tags=["Statistics"])

@router.get("", summary="Get global statistics")
async def get_statistics(db: Session = Depends(get_db)):
    total_detections = db.query(func.count(DetectionModel.id)).scalar()
    
    # Aggregate waste groups
    groups = db.query(
        DetectionItemModel.waste_group,
        func.count(DetectionItemModel.id).label('count')
    ).group_by(DetectionItemModel.waste_group).all()
    
    waste_breakdown = {group: count for group, count in groups}
    
    return {
        "total_detections": total_detections,
        "waste_breakdown": waste_breakdown
    }

@router.get("/dashboard/summary", summary="Dashboard summary")
async def get_dashboard_summary(db: Session = Depends(get_db)):
    stats = await get_statistics(db)
    
    # Calculate some derived metrics
    total_objects = sum(stats["waste_breakdown"].values())
    recyclable_groups = {"plastic", "glass", "metal", "paper", "cardboard"}
    recyclable_count = sum(count for group, count in stats["waste_breakdown"].items() if group in recyclable_groups)
    
    recyclable_percentage = round((recyclable_count / total_objects * 100), 2) if total_objects > 0 else 0
    
    return {
        "total_detections": stats["total_detections"],
        "total_objects_detected": total_objects,
        "recyclable_percentage": recyclable_percentage,
        "breakdown": stats["waste_breakdown"]
    }
