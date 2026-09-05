"""Summary aggregation over job records.

Two scoping decisions, both temporary and both deliberate:

1. WHICH STATUSES COUNT. features/reports-api.md specifies confirmed-only.
   That rule assumes the Phase 3 confirmation flow, which does not exist —
   nothing ever transitions a record to `confirmed`, so new entries (which
   default to `submitted`) would never appear in any summary while the 74
   historic records, imported as `confirmed`, always would. Reporting on
   non-draft records keeps summaries honest until Phase 3 lands, at which
   point this tightens to confirmed-only.

2. NO PER-USER SCOPING. The spec scopes totals to the logged-in user's
   participation rows. There is no auth yet and one employee owns every
   record, so these aggregate over everything. Phase 2 adds the scoping join.

Aggregation runs directly against `jobs`, never through a `participation`
join. A job co-owned by two crew members has two participation rows, and
joining would count that job — its minutes and its miles — twice. Phase 2's
scoping join is exactly where that risk arrives; tests cover it now so the
behaviour is locked in before the join exists.

Returns raw `work_minutes` as integers. Formatting to "7h 30m" is
presentation and belongs in the frontend.
"""

from datetime import date, timedelta

from sqlalchemy import Integer, cast, func
from sqlalchemy.orm import Session

from app.models.database import Job, JobStatus

# Everything except drafts. See note 1 above.
REPORTED_STATUSES = [
    JobStatus.SUBMITTED,
    JobStatus.PENDING_CONFIRMATION,
    JobStatus.CONFIRMED,
    JobStatus.DISPUTED,
    JobStatus.EXPIRED,
]


def _totals_query(db: Session):
    return db.query(
        func.count(Job.job_id),
        func.coalesce(func.sum(Job.work_minutes), 0),
        func.coalesce(func.sum(Job.run_miles), 0),
    ).filter(Job.status.in_(REPORTED_STATUSES))


def _shape(job_count: int, total_minutes: int, total_miles) -> dict:
    return {
        "job_count": job_count,
        "total_work_minutes": int(total_minutes or 0),
        "total_miles": float(total_miles or 0),
        # Empty periods return zeros, not errors and not null (spec).
        "average_work_minutes_per_job": (
            round(int(total_minutes or 0) / job_count) if job_count else 0
        ),
    }


def summary(db: Session) -> dict:
    """All-time totals."""
    job_count, total_minutes, total_miles = _totals_query(db).one()
    result = _shape(job_count, total_minutes, total_miles)
    result["period"] = "all-time"
    return result


def weekly(db: Session, today: date | None = None) -> dict:
    """Current week, Monday through Sunday."""
    today = today or date.today()
    start = today - timedelta(days=today.weekday())
    end = start + timedelta(days=6)

    job_count, total_minutes, total_miles = (
        _totals_query(db)
        .filter(Job.record_date >= start, Job.record_date <= end)
        .one()
    )
    result = _shape(job_count, total_minutes, total_miles)
    result["period"] = f"{start.isoformat()}..{end.isoformat()}"
    return result


def monthly(db: Session) -> list[dict]:
    """One row per month that has records, oldest first."""
    month = func.to_char(Job.record_date, "YYYY-MM")

    rows = (
        db.query(
            month.label("month"),
            func.count(Job.job_id),
            func.coalesce(cast(func.sum(Job.work_minutes), Integer), 0),
            func.coalesce(func.sum(Job.run_miles), 0),
        )
        .filter(Job.status.in_(REPORTED_STATUSES))
        .group_by(month)
        .order_by(month)
        .all()
    )

    return [
        {**_shape(job_count, total_minutes, total_miles), "period": period}
        for period, job_count, total_minutes, total_miles in rows
    ]
