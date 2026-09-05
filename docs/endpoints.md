# API Endpoints

## Base URL
Development: http://localhost:8000

## Entries — the shared `jobs` record (Phase 1)
- POST   /entries                     — create a new job record
- GET    /entries                     — list job records
- GET    /entries/{id}                — single record with participation
- PUT    /entries/{id}                — update a record
- DELETE /entries/{id}                — delete a draft record

Every POST/PUT writes a `job_edits` row. See features/entries-api.md.

## Participation — crew membership + claims (Phase 1)
- POST   /entries/{id}/participation  — add a crew member to a job
- PUT    /participation/{id}          — update my claims
- GET    /entries/{id}/participation  — list participation for a job

Participation carries no run data — no hours, miles, or times.
See features/participation-api.md.

## Auth (Phase 2)
- POST   /auth/login                  — login with employee_number or username, returns JWT
- POST   /auth/register               — create user account
- GET    /auth/me                     — current user from token

## Confirmation (Phase 3)
- POST   /entries/{id}/confirm        — confirm the current state of a record
- POST   /entries/{id}/reopen         — unlock a confirmed record for editing
- GET    /entries/pending             — my pending confirmations

No dispute endpoint — disagreement is a counter-edit via PUT /entries/{id}.
See features/confirmation-api.md.

## Reports (Phase 2 — built)
- GET    /reports/summary             — all-time totals
- GET    /reports/weekly              — current week (Mon–Sun)
- GET    /reports/monthly             — one row per month, oldest first

Totals derive from jobs.work_minutes and jobs.run_miles, aggregated directly
on jobs (never through a participation join — that would double-count a job
with two crew members). Minutes are returned raw; formatting is the client's
job. See crew-logger-api/features/reports-api.md.

/reports/comparison is deferred.

## CORS
Browser clients are a different origin from the API (Expo's web dev server is
:8081, the API :8000), so the API sends CORS headers. Allowed origins come
from the CORS_ORIGINS environment variable — not a wildcard. Not needed at all
if the frontend is served same-origin behind a reverse proxy; see
docs/deployment.md.

## Auth requirements
Phase 1: No auth required on any endpoint
Phase 2+: All endpoints except POST /auth/login require valid JWT token
