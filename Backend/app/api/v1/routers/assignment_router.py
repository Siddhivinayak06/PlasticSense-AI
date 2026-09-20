import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_detection_service
from app.application.services.detection_service import DetectionService
from app.application.dto.detection_dto import DetectionCreateDTO
from app.infrastructure.database.models.assignment_model import CleanupAssignmentModel
from app.infrastructure.database.models.ngo_model import NGOTeamModel
from app.infrastructure.database.models.detection_model import DetectionModel
from app.core.logging import logger

router = APIRouter(prefix="/assignments", tags=["Cleanup Assignments"])


class AssignmentCreateSchema(BaseModel):
    title: str
    detection_id: Optional[str] = None
    hotspot_id: Optional[str] = None
    location_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    priority: str = "medium"
    severity: str = "medium"
    risk_score: float = 50.0
    waste_count: int = 0
    ngo_team_id: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    notes: Optional[str] = None
    before_image_url: Optional[str] = None


class AssignmentUpdateSchema(BaseModel):
    status: Optional[str] = None  # pending, assigned, in_progress, completed, verified, rejected
    ngo_team_id: Optional[str] = None
    notes: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None


class AssignmentSchema(BaseModel):
    id: str
    title: str
    detection_id: Optional[str]
    hotspot_id: Optional[str]
    location_name: str
    latitude: Optional[float]
    longitude: Optional[float]
    priority: str
    severity: str
    risk_score: float
    waste_count: int
    waste_before: int
    waste_after: Optional[int]
    waste_reduction_percent: Optional[float]
    status: str
    ngo_team_id: Optional[str]
    ngo_team_name: Optional[str]
    scheduled_date: Optional[datetime]
    completed_date: Optional[datetime]
    notes: Optional[str]
    before_image_url: Optional[str]
    after_image_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=List[AssignmentSchema], summary="List cleanup assignments")
async def list_assignments(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(CleanupAssignmentModel).order_by(CleanupAssignmentModel.created_at.desc())
    if status_filter:
        query = query.filter(CleanupAssignmentModel.status == status_filter)
    return query.all()


@router.post("", response_model=AssignmentSchema, status_code=status.HTTP_201_CREATED, summary="Create a cleanup assignment")
async def create_assignment(
    payload: AssignmentCreateSchema,
    db: Session = Depends(get_db),
):
    # If detection_id provided, inherit coordinates, image, waste_count if not given
    lat = payload.latitude
    lng = payload.longitude
    before_img = payload.before_image_url
    waste_count = payload.waste_count
    risk_score = payload.risk_score
    severity = payload.severity
    priority = payload.priority

    if payload.detection_id:
        det = db.query(DetectionModel).filter(DetectionModel.id == payload.detection_id).first()
        if det:
            lat = lat if lat is not None else det.latitude
            lng = lng if lng is not None else det.longitude
            before_img = before_img or det.image_url
            waste_count = waste_count or len(det.items)
            if det.risk_assessment:
                risk_score = det.risk_assessment.score
                severity = det.risk_assessment.level.lower()
                priority = "urgent" if risk_score >= 75 else "high" if risk_score >= 50 else "medium"

    ngo_name = None
    if payload.ngo_team_id:
        ngo = db.query(NGOTeamModel).filter(NGOTeamModel.id == payload.ngo_team_id).first()
        if ngo:
            ngo_name = ngo.name
            ngo.active_assignments += 1

    assignment_id = f"CLN-{datetime.now(timezone.utc).year}-{uuid.uuid4().hex[:6].upper()}"
    assignment = CleanupAssignmentModel(
        id=assignment_id,
        title=payload.title,
        detection_id=payload.detection_id,
        hotspot_id=payload.hotspot_id,
        location_name=payload.location_name,
        latitude=lat,
        longitude=lng,
        priority=priority,
        severity=severity,
        risk_score=risk_score,
        waste_count=waste_count,
        waste_before=waste_count,
        status="assigned" if payload.ngo_team_id else "pending",
        ngo_team_id=payload.ngo_team_id,
        ngo_team_name=ngo_name,
        scheduled_date=payload.scheduled_date,
        notes=payload.notes,
        before_image_url=before_img,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("/{assignment_id}", response_model=AssignmentSchema, summary="Get assignment details")
async def get_assignment(assignment_id: str, db: Session = Depends(get_db)):
    assignment = db.query(CleanupAssignmentModel).filter(CleanupAssignmentModel.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


@router.patch("/{assignment_id}", response_model=AssignmentSchema, summary="Update assignment status or details")
async def update_assignment(
    assignment_id: str,
    payload: AssignmentUpdateSchema,
    db: Session = Depends(get_db),
):
    assignment = db.query(CleanupAssignmentModel).filter(CleanupAssignmentModel.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if payload.status is not None:
        old_status = assignment.status
        assignment.status = payload.status
        if payload.status in ("completed", "verified") and not assignment.completed_date:
            assignment.completed_date = datetime.now(timezone.utc)
            if assignment.ngo_team_id and old_status != payload.status:
                ngo = db.query(NGOTeamModel).filter(NGOTeamModel.id == assignment.ngo_team_id).first()
                if ngo:
                    ngo.completed_cleanups += 1
                    ngo.active_assignments = max(0, ngo.active_assignments - 1)

    if payload.ngo_team_id is not None:
        ngo = db.query(NGOTeamModel).filter(NGOTeamModel.id == payload.ngo_team_id).first()
        if ngo:
            assignment.ngo_team_id = ngo.id
            assignment.ngo_team_name = ngo.name
            if assignment.status == "pending":
                assignment.status = "assigned"

    if payload.notes is not None:
        assignment.notes = payload.notes

    if payload.scheduled_date is not None:
        assignment.scheduled_date = payload.scheduled_date

    if payload.completed_date is not None:
        assignment.completed_date = payload.completed_date

    db.commit()
    db.refresh(assignment)
    return assignment


@router.post("/{assignment_id}/verify", response_model=AssignmentSchema, summary="Run AI verification on post-cleanup image")
async def verify_assignment(
    assignment_id: str,
    file: UploadFile = File(...),
    notes: Optional[str] = Form(None),
    detection_service: DetectionService = Depends(get_detection_service),
    db: Session = Depends(get_db),
):
    assignment = db.query(CleanupAssignmentModel).filter(CleanupAssignmentModel.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    file_bytes = await file.read()
    dto = DetectionCreateDTO(
        latitude=assignment.latitude,
        longitude=assignment.longitude,
        filename=file.filename or "verification_after.jpg",
        content_type=file.content_type or "image/jpeg",
        file_bytes=file_bytes,
    )

    try:
        detection_result = detection_service.create_detection(dto)
    except Exception as e:
        logger.error(f"Post-cleanup verification detection failed: {e}")
        raise HTTPException(status_code=500, detail=f"Inference failed on verification image: {e}")

    waste_before = assignment.waste_before or assignment.waste_count or 1
    waste_after = len(detection_result.items)
    reduction = max(0.0, round(((waste_before - waste_after) / max(waste_before, 1)) * 100.0, 1))

    assignment.waste_after = waste_after
    assignment.waste_reduction_percent = reduction
    assignment.after_image_url = detection_result.annotated_image_url or detection_result.image_url
    assignment.status = "verified" if reduction >= 50.0 or waste_after <= 1 else "rejected"
    assignment.completed_date = datetime.now(timezone.utc)
    if notes:
        assignment.notes = f"{assignment.notes or ''}\nVerification Notes: {notes}".strip()

    # Update NGO completed stats
    if assignment.ngo_team_id and assignment.status == "verified":
        ngo = db.query(NGOTeamModel).filter(NGOTeamModel.id == assignment.ngo_team_id).first()
        if ngo:
            ngo.completed_cleanups += 1
            ngo.active_assignments = max(0, ngo.active_assignments - 1)

    db.commit()
    db.refresh(assignment)
    return assignment
