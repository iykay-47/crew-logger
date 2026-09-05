import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from enum import Enum

from sqlalchemy.orm import Session, selectinload

from app.models.database import Job, JobEdit, JobSource, JobStatus, User


def _json_safe(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, Enum):
        return value.value
    return value


def _validate_times(on_duty, off_duty) -> None:
    if on_duty is not None and off_duty is not None and on_duty >= off_duty:
        raise ValueError("on_duty must be before off_duty")


def _validate_record_date(record_date) -> None:
    if record_date is not None and record_date > date.today():
        raise ValueError("record_date cannot be in the future")


def _require_user(db: Session, employee_number: str) -> None:
    if db.query(User).filter_by(employee_number=employee_number).first() is None:
        raise ValueError(f"no user with employee_number {employee_number!r}")


def _log_edit(db: Session, job: Job, edited_by: str, before: dict, after: dict) -> None:
    change = {
        field: {"before": _json_safe(before.get(field)), "after": _json_safe(value)}
        for field, value in after.items()
        if before.get(field) != value
    }
    if not change:
        return
    db.add(JobEdit(job_id=job.job_id, edited_by=edited_by, change=change))
    job.last_edited_by = edited_by
    # Naive UTC, matching every other timestamp column (all naive TIMESTAMP,
    # e.g. on_duty/off_duty imported from the historic CSV with no tz info).
    job.last_edited_at = datetime.now(timezone.utc).replace(tzinfo=None)


def create_job(db: Session, data) -> Job:
    fields = data.model_dump(exclude={"edited_by"})
    _validate_record_date(fields.get("record_date"))
    _validate_times(fields.get("on_duty"), fields.get("off_duty"))
    _require_user(db, data.edited_by)

    job = Job(**fields, status=JobStatus.SUBMITTED, source=JobSource.APP_ENTRY)
    db.add(job)
    db.flush()  # populate job.job_id for the JobEdit FK

    _log_edit(db, job, data.edited_by, before={}, after=fields)

    db.commit()
    db.refresh(job)
    return job


def get_job(db: Session, job_id: uuid.UUID) -> Job | None:
    return (
        db.query(Job)
        .options(selectinload(Job.participation))
        .filter(Job.job_id == job_id)
        .first()
    )


def list_jobs(db: Session) -> list[Job]:
    return (
        db.query(Job)
        .options(selectinload(Job.participation))
        .order_by(Job.record_date.desc())
        .all()
    )


def update_job(db: Session, job_id: uuid.UUID, data) -> Job | None:
    job = db.get(Job, job_id)
    if job is None:
        return None

    updates = data.model_dump(exclude={"edited_by"}, exclude_unset=True)
    before = {field: getattr(job, field) for field in updates}

    merged_on_duty = updates.get("on_duty", job.on_duty)
    merged_off_duty = updates.get("off_duty", job.off_duty)
    _validate_times(merged_on_duty, merged_off_duty)
    if "record_date" in updates:
        _validate_record_date(updates["record_date"])
    _require_user(db, data.edited_by)

    for field, value in updates.items():
        setattr(job, field, value)

    _log_edit(db, job, data.edited_by, before=before, after=updates)

    db.commit()
    db.refresh(job)
    return job


def delete_job(db: Session, job_id: uuid.UUID) -> bool:
    job = db.get(Job, job_id)
    if job is None:
        return False
    if job.status != JobStatus.DRAFT:
        raise ValueError("only draft records can be deleted")
    db.delete(job)
    db.commit()
    return True
