"""Tests for the shared jobs record and participation endpoints.

See features/entries-api.md and features/participation-api.md.
"""

from datetime import date, timedelta

from app.models.database import Job, JobEdit, JobStatus


def _valid_job(employee_number, **overrides):
    body = {
        "train_id": "TEST-01",
        "record_date": "2026-01-01",
        "edited_by": employee_number,
    }
    body.update(overrides)
    return body


def test_create_writes_a_job_edit(client, db_session, user):
    resp = client.post(
        "/entries", json=_valid_job(user.employee_number, run_miles=10)
    )
    assert resp.status_code == 201
    job_id = resp.json()["job_id"]

    edits = db_session.query(JobEdit).filter_by(job_id=job_id).all()
    assert len(edits) == 1
    assert edits[0].edited_by == user.employee_number
    assert edits[0].change["run_miles"] == {"before": None, "after": 10.0}


def test_work_minutes_is_computed_and_ignores_client_input(client, user):
    resp = client.post(
        "/entries",
        json=_valid_job(
            user.employee_number,
            on_duty="2026-01-08T20:45:00",
            off_duty="2026-01-09T02:30:00",
            work_minutes=1,  # not a field on JobCreate — must be silently dropped
        ),
    )
    assert resp.status_code == 201
    assert resp.json()["work_minutes"] == 345  # DB-computed, crosses midnight


def test_blank_fields_are_null_not_zero(client, user):
    resp = client.post("/entries", json=_valid_job(user.employee_number))
    assert resp.status_code == 201
    body = resp.json()
    assert body["cars"] is None
    assert body["run_miles"] is None
    assert body["original_train_id"] is None


def test_on_duty_must_be_before_off_duty(client, user):
    resp = client.post(
        "/entries",
        json=_valid_job(
            user.employee_number,
            on_duty="2026-01-01T14:00:00",
            off_duty="2026-01-01T08:00:00",
        ),
    )
    assert resp.status_code == 422


def test_record_date_cannot_be_future(client, user):
    future = (date.today() + timedelta(days=1)).isoformat()
    resp = client.post(
        "/entries", json=_valid_job(user.employee_number, record_date=future)
    )
    assert resp.status_code == 422


def test_run_miles_cannot_be_negative(client, user):
    resp = client.post("/entries", json=_valid_job(user.employee_number, run_miles=-1))
    assert resp.status_code == 422


def test_unknown_edited_by_rejected(client):
    resp = client.post("/entries", json=_valid_job("does-not-exist"))
    assert resp.status_code == 422


def test_duplicate_participation_rejected(client, user):
    job = client.post("/entries", json=_valid_job(user.employee_number)).json()

    first = client.post(
        f"/entries/{job['job_id']}/participation",
        json={"employee_number": user.employee_number},
    )
    assert first.status_code == 201

    second = client.post(
        f"/entries/{job['job_id']}/participation",
        json={"employee_number": user.employee_number},
    )
    assert second.status_code == 409


def test_participation_unknown_employee_rejected(client, user):
    job = client.post("/entries", json=_valid_job(user.employee_number)).json()
    resp = client.post(
        f"/entries/{job['job_id']}/participation",
        json={"employee_number": "no-such-employee"},
    )
    assert resp.status_code == 422


def test_delete_rejects_non_draft(client, user):
    job = client.post("/entries", json=_valid_job(user.employee_number)).json()
    # status defaults to "submitted" on creation — Phase 1 has no API path
    # that produces a "draft" record.
    resp = client.delete(f"/entries/{job['job_id']}")
    assert resp.status_code == 422


def test_delete_cascades_participation_and_job_edits(client, db_session, user):
    job = client.post("/entries", json=_valid_job(user.employee_number)).json()
    client.post(
        f"/entries/{job['job_id']}/participation",
        json={"employee_number": user.employee_number},
    )

    db_obj = db_session.get(Job, job["job_id"])
    db_obj.status = JobStatus.DRAFT
    db_session.flush()

    resp = client.delete(f"/entries/{job['job_id']}")
    assert resp.status_code == 204
    assert client.get(f"/entries/{job['job_id']}").status_code == 404


def test_get_missing_entry_404(client):
    resp = client.get("/entries/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404
