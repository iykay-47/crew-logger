from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.schemas import ReportPeriod
from app.services import reports as reports_service
from app.services.database import get_db

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/summary", response_model=ReportPeriod)
def summary(db: Session = Depends(get_db)):
    return reports_service.summary(db)


@router.get("/weekly", response_model=ReportPeriod)
def weekly(db: Session = Depends(get_db)):
    return reports_service.weekly(db)


@router.get("/monthly", response_model=list[ReportPeriod])
def monthly(db: Session = Depends(get_db)):
    return reports_service.monthly(db)
