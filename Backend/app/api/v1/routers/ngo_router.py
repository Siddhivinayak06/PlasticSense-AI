import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.core.cache import cache_clear
from app.infrastructure.database.models.ngo_model import NGOTeamModel

router = APIRouter(prefix="/ngos", tags=["NGO Teams"])


class NGOCreateSchema(BaseModel):
    name: str = Field(min_length=2, max_length=128)
    city: str = Field(min_length=1, max_length=64)
    state: str = Field(min_length=1, max_length=64)
    contact_person: str = Field(min_length=1, max_length=128)
    email: str = Field(max_length=128, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    phone: str = Field(max_length=32, pattern=r"^[0-9+()\-\s]{6,32}$")
    team_size: int = Field(10, ge=1, le=10_000)
    specializations: List[str] = Field(default_factory=list, max_length=20)


class NGOSchema(BaseModel):
    id: str
    name: str
    city: str
    state: str
    contact_person: str
    email: str
    phone: str
    team_size: int
    active_assignments: int
    completed_cleanups: int
    availability: str
    current_workload: str
    performance_score: int
    avg_completion_days: float
    specializations: List[str]
    is_sample: bool = False

    class Config:
        from_attributes = True


@router.get("", response_model=List[NGOSchema], summary="List all NGO teams")
async def list_ngos(db: Session = Depends(get_db)):
    teams = db.query(NGOTeamModel).order_by(NGOTeamModel.is_sample, NGOTeamModel.name).all()
    return teams


@router.post("", response_model=NGOSchema, status_code=status.HTTP_201_CREATED, summary="Create a new NGO team")
async def create_ngo(payload: NGOCreateSchema, db: Session = Depends(get_db)):
    team = NGOTeamModel(
        id=str(uuid.uuid4()),
        name=payload.name,
        city=payload.city,
        state=payload.state,
        contact_person=payload.contact_person,
        email=payload.email,
        phone=payload.phone,
        team_size=payload.team_size,
        specializations=payload.specializations,
        active_assignments=0,
        completed_cleanups=0,
        availability="available",
        current_workload="light",
        # No cleanup history yet: 0 means "not rated", never an invented score.
        performance_score=0,
        avg_completion_days=0.0,
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    cache_clear()
    return team


@router.get("/{ngo_id}", response_model=NGOSchema, summary="Get NGO team details")
async def get_ngo(ngo_id: str, db: Session = Depends(get_db)):
    team = db.query(NGOTeamModel).filter(NGOTeamModel.id == ngo_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="NGO team not found")
    return team
