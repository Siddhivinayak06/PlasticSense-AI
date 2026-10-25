import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_detection_service
from app.api.upload_guard import inference_rate_limit
from app.api.v1.routers.detection_router import run_detection
from app.core.auth import get_current_user_optional
from app.core.cache import cache_clear
from app.application.services.detection_service import DetectionService
from app.infrastructure.database.models.assignment_model import CleanupAssignmentModel
from app.infrastructure.database.models.ngo_model import NGOTeamModel
from app.infrastructure.database.models.detection_model import DetectionModel
from app.infrastructure.database.models.user_profile_model import UserProfileModel

router = APIRouter(prefix="/assignments", tags=["Cleanup Assignments"])


Priority = Literal["low", "medium", "high", "urgent"]
Severity = Literal["low", "medium", "high", "critical"]
# "verified" and "rejected" are outcomes of AI verification (POST /verify) and
# cannot be set by hand, otherwise a cleanup could be marked verified with no evidence.
ManualStatus = Literal["pending", "assigned", "in_progress", "completed"]


class AssignmentCreateSchema(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    detection_id: Optional[str] = Field(None, max_length=64)
    hotspot_id: Optional[str] = Field(None, max_length=64)
    location_name: str = Field(min_length=1, max_length=200)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    priority: Priority = "medium"
    severity: Severity = "medium"
    risk_score: float = Field(50.0, ge=0, le=100)
    waste_count: int = Field(0, ge=0, le=100_000)
    ngo_team_id: Optional[str] = Field(None, max_length=64)
    scheduled_date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=2000)
    before_image_url: Optional[str] = Field(None, max_length=512, pattern=r"^/media/(uploads|results)/[A-Za-z0-9_.-]+$")


class AssignmentUpdateSchema(BaseModel):
    status: Optional[ManualStatus] = None
    ngo_team_id: Optional[str] = Field(None, max_length=64)
    notes: Optional[str] = Field(None, max_length=2000)
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
    is_sample: bool = False

    class Config:
        from_attributes = True


@router.get("", response_model=List[AssignmentSchema], summary="List cleanup assignments")
async def list_assignments(
    status_filter: Optional[Literal["pending", "assigned", "in_progress", "completed", "verified", "rejected"]] = None,
    db: Session = Depends(get_db),
):
    query = db.query(CleanupAssignmentModel).order_by(CleanupAssignmentModel.created_at.desc())
    if status_filter:
        query = query.filter(CleanupAssignmentModel.status == status_filter)
    return query.all()


def _enforce_admin_permission(user: Optional[UserProfileModel]) -> None:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: Municipal Administrator sign-in needed.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Municipal Administrator privileges required for this action.",
        )


@router.post("", response_model=AssignmentSchema, status_code=status.HTTP_201_CREATED, summary="Create a cleanup assignment (Admin only)")
async def create_assignment(
    payload: AssignmentCreateSchema,
    db: Session = Depends(get_db),
    admin: Optional[UserProfileModel] = Depends(get_current_user_optional),
):
    _enforce_admin_permission(admin)
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
        if not det:
            raise HTTPException(status_code=404, detail="Detection not found")
        # Inherit from the report only what the client did not state explicitly
        # (e.g. a hotspot sends its cluster-wide peak risk and total object count).
        explicit = payload.model_fields_set
        lat = lat if lat is not None else det.latitude
        lng = lng if lng is not None else det.longitude
        before_img = before_img or det.annotated_image_url or det.image_url
        if "waste_count" not in explicit:
            waste_count = len(det.items)
        if det.risk_assessment:
            if "risk_score" not in explicit:
                risk_score = det.risk_assessment.score
            if "severity" not in explicit:
                severity = det.risk_assessment.level.lower()
            if "priority" not in explicit:
                priority = "urgent" if risk_score >= 75 else "high" if risk_score >= 50 else "medium"

    ngo_name = None
    if payload.ngo_team_id:
        ngo = db.query(NGOTeamModel).filter(NGOTeamModel.id == payload.ngo_team_id).first()
        if not ngo:
            raise HTTPException(status_code=404, detail="NGO team not found")
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
    cache_clear()
    return assignment


@router.get("/{assignment_id}", response_model=AssignmentSchema, summary="Get assignment details")
async def get_assignment(assignment_id: str, db: Session = Depends(get_db)):
    assignment = db.query(CleanupAssignmentModel).filter(CleanupAssignmentModel.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


@router.patch("/{assignment_id}", response_model=AssignmentSchema, summary="Update assignment status or details (Admin only)")
async def update_assignment(
    assignment_id: str,
    payload: AssignmentUpdateSchema,
    db: Session = Depends(get_db),
    admin: Optional[UserProfileModel] = Depends(get_current_user_optional),
):
    _enforce_admin_permission(admin)
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
        if not ngo:
            raise HTTPException(status_code=404, detail="NGO team not found")
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
    cache_clear()
    return assignment


@router.post("/{assignment_id}/verify", response_model=AssignmentSchema, summary="Run AI verification on post-cleanup image (Admin only)")
async def verify_assignment(
    assignment_id: str,
    file: UploadFile = File(...),
    notes: Optional[str] = Form(None, max_length=2000),
    detection_service: DetectionService = Depends(get_detection_service),
    db: Session = Depends(get_db),
    admin: Optional[UserProfileModel] = Depends(get_current_user_optional),
    _limited: None = Depends(inference_rate_limit),
):
    _enforce_admin_permission(admin)
    assignment = db.query(CleanupAssignmentModel).filter(CleanupAssignmentModel.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if assignment.status in ("verified",):
        raise HTTPException(status_code=409, detail="Assignment is already verified")

    # Same validation, size limit and safe error mapping as a normal analysis.
    detection_result = await run_detection(
        detection_service, file, assignment.latitude, assignment.longitude
    )
    if detection_result.detection_status != "completed":
        raise HTTPException(
            status_code=502,
            detail="AI analysis of the verification image failed; the assignment was not changed.",
        )

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
    cache_clear()
    return assignment
