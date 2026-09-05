import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    UniqueConstraint,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy import Computed
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.services.database import Base


class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    PENDING_CONFIRMATION = "pending_confirmation"
    CONFIRMED = "confirmed"
    DISPUTED = "disputed"
    EXPIRED = "expired"


class JobSource(str, enum.Enum):
    APP_ENTRY = "app_entry"
    HISTORIC_IMPORT = "historic_import"


class Job(Base):
    """The shared run record. One row per run, co-owned by the crew."""

    __tablename__ = "jobs"

    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Run data — shared by every crew member on this job. See
    # docs/data-model.md "Facts vs derivations": these are facts, stored once.
    train_id: Mapped[str] = mapped_column(String, nullable=False)
    original_train_id: Mapped[str | None] = mapped_column(String)
    record_date: Mapped[date] = mapped_column(Date, nullable=False)
    origin_station: Mapped[str | None] = mapped_column(String)
    final_station: Mapped[str | None] = mapped_column(String)
    start_time: Mapped[datetime | None] = mapped_column(DateTime)
    on_duty: Mapped[datetime | None] = mapped_column(DateTime)
    initial_os: Mapped[datetime | None] = mapped_column(DateTime)
    final_os: Mapped[datetime | None] = mapped_column(DateTime)
    off_duty: Mapped[datetime | None] = mapped_column(DateTime)
    run_miles: Mapped[float | None] = mapped_column(Numeric(6, 2))
    train_length: Mapped[int | None] = mapped_column(Integer)
    cars: Mapped[int | None] = mapped_column(SmallInteger)

    # Not on PSTS562 historic screens — source undecided. NULL on import.
    axles: Mapped[str | None] = mapped_column(String)
    lead_unit: Mapped[str | None] = mapped_column(String)
    trailing_units: Mapped[str | None] = mapped_column(String)
    dp_units: Mapped[str | None] = mapped_column(String)
    release_care_control: Mapped[datetime | None] = mapped_column(DateTime)
    rx_rtc: Mapped[str | None] = mapped_column(String)
    rx_mile_point: Mapped[str | None] = mapped_column(String)
    rx_time: Mapped[datetime | None] = mapped_column(DateTime)
    rest: Mapped[int | None] = mapped_column(Integer)

    # DB-computed derivation — never client-supplied, never app-computed.
    # Rollover-safe because on_duty/off_duty carry the day digit.
    work_minutes: Mapped[int | None] = mapped_column(
        Integer,
        Computed(
            "CAST(EXTRACT(EPOCH FROM (off_duty - on_duty)) / 60 AS INTEGER)",
            persisted=True,
        ),
    )

    # Lifecycle & edit tracking
    status: Mapped[JobStatus] = mapped_column(
        SAEnum(JobStatus, name="job_status", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=JobStatus.SUBMITTED,
    )
    source: Mapped[JobSource] = mapped_column(
        SAEnum(JobSource, name="job_source", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    last_edited_by: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.employee_number")
    )
    last_edited_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    participation: Mapped[list["Participation"]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )
    job_edits: Mapped[list["JobEdit"]] = relationship(cascade="all, delete-orphan")


class Participation(Base):
    """Crew membership + personal claims. One row per crew member per job."""

    __tablename__ = "participation"
    __table_args__ = (UniqueConstraint("job_id", "employee_number"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.job_id"), nullable=False
    )
    employee_number: Mapped[str] = mapped_column(
        String, ForeignKey("users.employee_number"), nullable=False
    )
    claims: Mapped[dict | None] = mapped_column(JSONB)

    job: Mapped["Job"] = relationship(back_populates="participation")


class JobEdit(Base):
    """Full edit history. One row per edit to a jobs record."""

    __tablename__ = "job_edits"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.job_id"), nullable=False
    )
    edited_by: Mapped[str] = mapped_column(
        String, ForeignKey("users.employee_number"), nullable=False
    )
    edited_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    change: Mapped[dict] = mapped_column(JSONB, nullable=False)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    employee_number: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
