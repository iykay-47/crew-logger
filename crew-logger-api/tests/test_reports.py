"""Tests for the summary endpoints. See features/reports-api.md."""

from datetime import date, timedelta

from app.models.database import Job, JobSource, JobStatus, Participation, User


def _make_job(db, *, minutes=60, miles=10.0, status=JobStatus.SUBMITTED, day=None):
    """A job with an on_duty/off_duty span of `minutes`.

    work_minutes is a generated column, so it can't be set directly — it is
    derived from the timestamps we pass here.
    """
    day = day or date(2026, 1, 5)
    on_duty = f"{day.isoformat()}T08:00:00"
    off_duty = f"{day.isoformat()}T{8 + minutes // 60:02d}:{minutes % 60:02d}:00"
    job = Job(
        train_id="RPT-01",
        record_date=day,
        on_duty=on_duty,
        off_duty=off_duty,
        run_miles=miles,
        status=status,
        source=JobSource.APP_ENTRY,
    )
    db.add(job)
    db.flush()
    return job


def _only_ours(rows, period):
    return next((r for r in rows if r["period"] == period), None)


def test_summary_counts_and_totals(client, db_session, user):
    before = client.get("/reports/summary").json()

    _make_job(db_session, minutes=120, miles=25.0)

    after = client.get("/reports/summary").json()
    assert after["job_count"] == before["job_count"] + 1
    assert after["total_work_minutes"] == before["total_work_minutes"] + 120
    assert round(after["total_miles"] - before["total_miles"], 2) == 25.0


def test_draft_records_are_excluded(client, db_session, user):
    before = client.get("/reports/summary").json()

    _make_job(db_session, minutes=90, status=JobStatus.DRAFT)

    after = client.get("/reports/summary").json()
    assert after["job_count"] == before["job_count"]
    assert after["total_work_minutes"] == before["total_work_minutes"]


def test_shared_job_counts_once_not_once_per_crew_member(client, db_session, user):
    """A job co-owned by two crew members must count ONCE.

    Aggregating through a participation join would count it twice — once per
    participation row — inflating both minutes and miles. Phase 2's per-user
    scoping introduces exactly that join, so this locks the behaviour in
    before the risk arrives.
    """
    before = client.get("/reports/summary").json()

    job = _make_job(db_session, minutes=300, miles=50.0)

    crewmate = User(
        username="test_crewmate",
        employee_number="555111",
        password_hash="not-a-real-hash",
    )
    db_session.add(crewmate)
    db_session.flush()

    for employee_number in (user.employee_number, crewmate.employee_number):
        db_session.add(
            Participation(job_id=job.job_id, employee_number=employee_number)
        )
    db_session.flush()

    assert (
        db_session.query(Participation).filter_by(job_id=job.job_id).count() == 2
    ), "precondition: the job really does have two crew members"

    after = client.get("/reports/summary").json()
    assert after["job_count"] == before["job_count"] + 1, "counted twice"
    assert after["total_work_minutes"] == before["total_work_minutes"] + 300
    assert round(after["total_miles"] - before["total_miles"], 2) == 50.0


def test_monthly_groups_by_month(client, db_session, user):
    _make_job(db_session, minutes=60, day=date(2020, 3, 4))
    _make_job(db_session, minutes=120, day=date(2020, 3, 15))

    rows = client.get("/reports/monthly").json()
    march = _only_ours(rows, "2020-03")

    assert march is not None
    assert march["job_count"] == 2
    assert march["total_work_minutes"] == 180
    assert march["average_work_minutes_per_job"] == 90


def test_weekly_covers_the_current_week(client, db_session, user):
    today = date.today()
    monday = today - timedelta(days=today.weekday())

    before = client.get("/reports/weekly").json()
    _make_job(db_session, minutes=45, day=monday)
    after = client.get("/reports/weekly").json()

    assert after["job_count"] == before["job_count"] + 1
    assert after["total_work_minutes"] == before["total_work_minutes"] + 45


def test_empty_period_returns_zeros_not_an_error(client, db_session, user):
    """A month with no records must not appear as an error or a null."""
    rows = client.get("/reports/monthly").json()
    assert _only_ours(rows, "1999-01") is None

    # And the shape itself always carries zeros rather than nulls.
    for row in rows:
        assert row["job_count"] >= 0
        assert row["total_work_minutes"] is not None
        assert row["average_work_minutes_per_job"] is not None
