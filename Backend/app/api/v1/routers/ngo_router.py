import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.infrastructure.database.models.ngo_model import NGOTeamModel

router = APIRouter(prefix="/ngos", tags=["NGO Teams"])


class NGOCreateSchema(BaseModel):
    name: str
    city: str
    state: str
    contact_person: str
    email: str
    phone: str
    team_size: int = 10
    specializations: List[str] = []


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

    class Config:
        from_attributes = True


@router.get("", response_model=List[NGOSchema], summary="List all NGO teams")
async def list_ngos(db: Session = Depends(get_db)):
    teams = db.query(NGOTeamModel).all()
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
        performance_score=85,
        avg_completion_days=3.0,
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


@router.get("/{ngo_id}", response_model=NGOSchema, summary="Get NGO team details")
async def get_ngo(ngo_id: str, db: Session = Depends(get_db)):
    team = db.query(NGOTeamModel).filter(NGOTeamModel.id == ngo_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="NGO team not found")
    return team
