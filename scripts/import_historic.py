"""One-time import of the 74 historic PSTS562 records into jobs + participation.

Run from the project root:
    python -m scripts.import_historic

records.csv is treated as immutable source data — this script only reads it.
Safe to re-run: existing (train_id, record_date) pairs are skipped.
"""

import csv
import uuid
from datetime import date, datetime
from pathlib import Path

from passlib.hash import bcrypt

from app.models.database import Job, JobSource, JobStatus, Participation, User
from app.services.database import SessionLocal

CSV_PATH = Path(__file__).resolve().parent.parent / "records.csv"
HISTORIC_EMPLOYEE_NUMBER = "196035"


def _or_none(value: str) -> str | None:
    value = value.strip()
    return value or None


def _parse_datetime(value: str) -> datetime | None:
    value = _or_none(value)
    return datetime.fromisoformat(value) if value else None


def _parse_date(value: str) -> date:
    return date.fromisoformat(value.strip())


def _parse_int(value: str) -> int | None:
    value = _or_none(value)
    return int(value) if value else None


def _parse_float(value: str) -> float | None:
    value = _or_none(value)
    return float(value) if value else None


def _ensure_historic_user(db) -> None:
    """The participation FK requires a users row. No real auth exists yet
    (Phase 2) — this is a placeholder account with an unusable password until
    then."""
    existing = (
        db.query(User).filter_by(employee_number=HISTORIC_EMPLOYEE_NUMBER).first()
    )
    if existing:
        return
    db.add(
        User(
            username=f"employee_{HISTORIC_EMPLOYEE_NUMBER}",
            employee_number=HISTORIC_EMPLOYEE_NUMBER,
            password_hash=bcrypt.hash(str(uuid.uuid4())),
        )
    )
    db.flush()


def main() -> None:
    db = SessionLocal()
    imported = 0
    skipped = 0
    try:
        _ensure_historic_user(db)

        with open(CSV_PATH, newline="") as f:
            for row in csv.DictReader(f):
                record_date = _parse_date(row["record_date"])
                train_id = row["train_id"].strip()

                already_imported = (
                    db.query(Job)
                    .filter_by(
                        train_id=train_id,
                        record_date=record_date,
                        source=JobSource.HISTORIC_IMPORT,
                    )
                    .first()
                )
                if already_imported:
                    skipped += 1
                    continue

                job = Job(
                    train_id=train_id,
                    original_train_id=_or_none(row["original_train_id"]),
                    record_date=record_date,
                    origin_station=_or_none(row["origin_station"]),
                    final_station=_or_none(row["final_station"]),
                    start_time=_parse_datetime(row["start_time"]),
                    on_duty=_parse_datetime(row["on_duty"]),
                    initial_os=_parse_datetime(row["initial_os"]),
                    final_os=_parse_datetime(row["final_os"]),
                    off_duty=_parse_datetime(row["off_duty"]),
                    run_miles=_parse_float(row["run_miles"]),
                    train_length=_parse_int(row["train_length"]),
                    cars=_parse_int(row["cars"]),
                    status=JobStatus.CONFIRMED,
                    source=JobSource.HISTORIC_IMPORT,
                )
                db.add(job)
                db.flush()  # populate job.job_id for the participation FK

                db.add(
                    Participation(
                        job_id=job.job_id,
                        employee_number=HISTORIC_EMPLOYEE_NUMBER,
                        claims=None,
                    )
                )
                imported += 1

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    print(f"Imported {imported} records, skipped {skipped} already-imported.")


if __name__ == "__main__":
    main()
