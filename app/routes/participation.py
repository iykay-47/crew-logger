import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.schemas import (
    ParticipationCreate,
    ParticipationResponse,
    ParticipationUpdate,
)
from app.services import participation as participation_service
from app.services.database import get_db

router = APIRouter(tags=["participation"])


@router.post(
    "/entries/{job_id}/participation",
    response_model=ParticipationResponse,
    status_code=201,
)
def add_participation(
    job_id: uuid.UUID, data: ParticipationCreate, db: Session = Depends(get_db)
):
    try:
        participation = participation_service.add_participation(db, job_id, data)
    except LookupError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    if participation is None:
        raise HTTPException(status_code=404, detail="entry not found")
    return participation


@router.get(
    "/entries/{job_id}/participation", response_model=list[ParticipationResponse]
)
def list_participation(job_id: uuid.UUID, db: Session = Depends(get_db)):
    rows = participation_service.list_participation(db, job_id)
    if rows is None:
        raise HTTPException(status_code=404, detail="entry not found")
    return rows


@router.put("/participation/{participation_id}", response_model=ParticipationResponse)
def update_participation(
    participation_id: uuid.UUID,
    data: ParticipationUpdate,
    db: Session = Depends(get_db),
):
    participation = participation_service.update_participation(
        db, participation_id, data
    )
    if participation is None:
        raise HTTPException(status_code=404, detail="participation not found")
    return participation
