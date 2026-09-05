# Entries API

## What it does
Create, read, and update endpoints for the shared `jobs` record.

A `jobs` row is co-owned by the crew — both crewmates read and edit the same
row. See docs/data-model.md.

## Endpoints
- POST /entries — create a new job record
- GET /entries — list job records (all in Phase 1, filtered by user in Phase 2+)
- GET /entries/{id} — get a single job record with its participation rows
- PUT /entries/{id} — update a job record
- DELETE /entries/{id} — delete a job record (only if status is draft)

## Validation rules
- record_date cannot be in the future
- train_id is required and cannot be empty
- on_duty must be before off_duty
- run_miles cannot be negative
- status defaults to "submitted" on creation
- blank values store as NULL, never 0

## Edit logging
Every successful POST and PUT writes a `job_edits` row (job_id, edited_by,
edited_at, change) and updates `jobs.last_edited_by` / `last_edited_at`.
This applies from Phase 1 — the audit trail exists before the state machine
that reads it.

## Phase
Phase 1: All endpoints above, no auth required, no lock enforcement
Phase 2+: All endpoints require valid auth token
Phase 3: PUT additionally drives the edit/notify loop and respects lock-on-confirm

## Definition of done
- [x] POST /entries creates a jobs row in Postgres and returns it
- [x] POST and PUT each write a job_edits row and update last_edited_by/at
- [x] GET /entries returns all records sorted by record_date descending
- [x] GET /entries/{id} returns the record with linked participation rows
- [x] PUT /entries/{id} updates allowed fields
- [x] DELETE /entries/{id} deletes draft records and rejects others
- [x] work_minutes is computed by the database, never accepted from the client
- [x] All validation rules are enforced with clear error messages
- [x] Endpoints are testable via the FastAPI auto-generated docs at /docs
