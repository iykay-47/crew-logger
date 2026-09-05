# Crew Logger — Backend API

Python FastAPI backend. Receives requests from the Expo frontend, enforces
business rules, and talks to Postgres.

**Shared context — what the app does, the data model, and the build phases —
is in the root `CLAUDE.md`. Read that first.** This file holds only
backend-local rules.

## Architecture rules
- All route handlers go in `routes/`. Keep them thin — they validate input and
  call services.
- All business logic goes in `services/`. Routes never contain business logic
  directly. This includes summaries and aggregation.
- All database table definitions go in `models/database.py` (SQLAlchemy).
- All request/response shapes go in `models/schemas.py` (Pydantic).
- Database connection setup goes in `services/database.py` only.

## Stack
- Python 3.11+ (developed against 3.12.3)
- FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2
- Postgres 16 (Docker for local dev)
- passlib + python-jose (auth: password hashing + JWT) — Phase 2
- `requirements.txt` is runtime-only; `requirements-dev.txt` adds pytest + httpx

## Auth
Login accepts either `employee_number` or username + password. Server checks
both fields. Passwords hashed with bcrypt via passlib. Sessions use JWT with
7-day expiry. **Not built yet** — deferred while the app is single-user.

## Feature specs
Each feature is defined in `features/`. Read the relevant file before building;
its definition-of-done checklist defines when the feature is complete.

## Running
```bash
docker compose up -d                          # Postgres
venv/bin/alembic upgrade head                 # migrations
venv/bin/uvicorn app.main:app --reload        # API on :8000
venv/bin/python -m pytest tests/ -v           # tests
```
See `README.md` for setup and `../docs/deployment.md` for deployment.
