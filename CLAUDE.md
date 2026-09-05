# Project: Crew Logger (Backend API)

## What this app does
Python FastAPI backend for the Crew Logger field operations app.
Receives requests from the Expo frontend, enforces business rules,
and communicates with Postgres.

## Architecture rules
- All route handlers go in routes/. Keep them thin — they validate input and call services.
- All business logic goes in services/. Routes never contain business logic directly.
- All database table definitions go in models/database.py (SQLAlchemy).
- All request/response shapes go in models/schemas.py (Pydantic).
- Database connection setup goes in services/database.py only.
- Do not add Python packages without asking first.
- Do not refactor, rename, or reorganize files I did not ask about.
- Do not build features from future phases.

## Stack
- Python 3.11+
- FastAPI
- SQLAlchemy (database ORM)
- Alembic (database migrations)
- Pydantic (data validation)
- Postgres (in Docker for local dev)
- passlib + python-jose (auth: password hashing + JWT tokens)

## Data model
One shared `jobs` record per run, co-owned by the crew — both crewmates edit the
same row, so run data is stored once, not duplicated. `participation` holds crew
membership plus per-person `claims` only (the sole per-person data). `job_edits`
logs every edit (who/when/what). `users` handles auth. A confirmed record locks
until explicitly reopened. Full schema in docs/data-model.md — read it before
building models.

Both crewmates may edit the shared `jobs` row; each person owns only their own
`participation` row and may not edit another crew member's claims.

**Read docs/decisions.md before changing the schema or the data model.** It
records why each choice was made and which bugs motivated them — several
decisions look arbitrary without that context and are easy to undo by accident.

## Auth
Login accepts either employee_number or username + password. Server checks both
fields. Passwords are hashed with bcrypt via passlib. Sessions use JWT tokens
with 7-day expiry.

## Feature specs
Each feature is defined in the features/ folder. Read the relevant feature file
before building. The definition of done checklist defines when the feature is complete.

## Build phases
Phase 1: DB connection + models (jobs, participation, job_edits, users), historic
         import (74 records, employee 196035), read endpoints, and entry
         create/update. Every write logs to job_edits from the start — but no
         state machine, no notify, no lock yet.
Phase 2: Auth endpoints — login, token issuance, protected routes
Phase 3: Confirmation flow — edit/notify loop, state machine, lock on confirm,
         reopen path
Phase 4: Image upload endpoints and external storage integration
Phase 5: Offline sync support endpoints
Phase 6: OCR processing endpoints
Phase 7: Production deployment, CI/CD, monitoring

Writes exist from Phase 1 because the historic import already needs the write
path in services/. Phase 3 layers the state machine on top of the audit trail
Phase 1 established — it does not retrofit one.

## Current phase: 1
Only build Phase 1 functionality.
