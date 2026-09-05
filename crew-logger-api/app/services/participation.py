import uuid

from sqlalchemy.orm import Session

from app.models.database import Job, Participation, User


def add_participation(db: Session, job_id: uuid.UUID, data) -> Participation | None:
    if db.get(Job, job_id) is None:
        return None

    if db.query(User).filter_by(employee_number=data.employee_number).first() is None:
        raise LookupError(f"no user with employee_number {data.employee_number!r}")

    existing = (
        db.query(Participation)
        .filter_by(job_id=job_id, employee_number=data.employee_number)
        .first()
    )
    if existing is not None:
        raise ValueError(
            f"employee_number {data.employee_number!r} already has a "
            f"participation row on this job"
        )

    participation = Participation(
        job_id=job_id, employee_number=data.employee_number, claims=data.claims
    )
    db.add(participation)
    db.commit()
    db.refresh(participation)
    return participation


def list_participation(db: Session, job_id: uuid.UUID) -> list[Participation] | None:
    if db.get(Job, job_id) is None:
        return None
    return db.query(Participation).filter_by(job_id=job_id).all()


def update_participation(
    db: Session, participation_id: uuid.UUID, data
) -> Participation | None:
    participation = db.get(Participation, participation_id)
    if participation is None:
        return None
    participation.claims = data.claims
    db.commit()
    db.refresh(participation)
    return participation
