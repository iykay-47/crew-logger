import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.database import JobSource, JobStatus


class ParticipationCreate(BaseModel):
    employee_number: str = Field(min_length=1)
    claims: dict | None = None


class ParticipationUpdate(BaseModel):
    claims: dict | None = None


class ParticipationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_id: uuid.UUID
    employee_number: str
    claims: dict | None


class JobCreate(BaseModel):
    train_id: str = Field(min_length=1)
    original_train_id: str | None = None
    record_date: date
    origin_station: str | None = None
    final_station: str | None = None
    start_time: datetime | None = None
    on_duty: datetime | None = None
    initial_os: datetime | None = None
    final_os: datetime | None = None
    off_duty: datetime | None = None
    run_miles: float | None = Field(default=None, ge=0)
    train_length: int | None = None
    cars: int | None = None

    # No auth exists yet (Phase 2) — the client must say who this is until
    # then. Phase 2 replaces this with the identity from the JWT.
    edited_by: str = Field(min_length=1)


class JobUpdate(BaseModel):
    train_id: str | None = Field(default=None, min_length=1)
    original_train_id: str | None = None
    record_date: date | None = None
    origin_station: str | None = None
    final_station: str | None = None
    start_time: datetime | None = None
    on_duty: datetime | None = None
    initial_os: datetime | None = None
    final_os: datetime | None = None
    off_duty: datetime | None = None
    run_miles: float | None = Field(default=None, ge=0)
    train_length: int | None = None
    cars: int | None = None

    edited_by: str = Field(min_length=1)


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    job_id: uuid.UUID
    train_id: str
    original_train_id: str | None
    record_date: date
    origin_station: str | None
    final_station: str | None
    start_time: datetime | None
    on_duty: datetime | None
    initial_os: datetime | None
    final_os: datetime | None
    off_duty: datetime | None
    run_miles: float | None
    train_length: int | None
    cars: int | None
    work_minutes: int | None
    status: JobStatus
    source: JobSource
    last_edited_by: str | None
    last_edited_at: datetime | None
    created_at: datetime
    updated_at: datetime
    participation: list[ParticipationResponse] = []
