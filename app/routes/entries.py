import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.schemas import JobCreate, JobResponse, JobUpdate
from app.services import entries as entries_service
from app.services.database import get_db

router = APIRouter(prefix="/entries", tags=["entries"])


@router.post("", response_model=JobResponse, status_code=201)
def create_entry(data: JobCreate, db: Session = Depends(get_db)):
    try:
        return entries_service.create_job(db, data)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("", response_model=list[JobResponse])
def list_entries(db: Session = Depends(get_db)):
    return entries_service.list_jobs(db)


@router.get("/{job_id}", response_model=JobResponse)
def get_entry(job_id: uuid.UUID, db: Session = Depends(get_db)):
    job = entries_service.get_job(db, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="entry not found")
    return job


@router.put("/{job_id}", response_model=JobResponse)
def update_entry(job_id: uuid.UUID, data: JobUpdate, db: Session = Depends(get_db)):
    try:
        job = entries_service.update_job(db, job_id, data)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    if job is None:
        raise HTTPException(status_code=404, detail="entry not found")
    return job


@router.delete("/{job_id}", status_code=204)
def delete_entry(job_id: uuid.UUID, db: Session = Depends(get_db)):
    try:
        deleted = entries_service.delete_job(db, job_id)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    if not deleted:
        raise HTTPException(status_code=404, detail="entry not found")
