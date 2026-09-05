# Crew Logger API (Backend)

Python/FastAPI backend for the Crew Logger app. Receives requests from the
Expo frontend (`crew-logger`), enforces business rules, and talks to
Postgres. See `CLAUDE.md` for architecture rules and `features/` for what
each endpoint group does. Currently in **Phase 1**: the `jobs`/`participation`/
`job_edits`/`users` models, the historic import (74 PSTS562 records), and the
entries + participation endpoints are built and tested. No auth yet
(Phase 2) and no confirmation state machine (Phase 3) — every write happens
as `source=app_entry`, `status=submitted`, no locking.

## Requirements

- **Python 3.11+** (developed/verified against 3.12.3).
- **pip** and the standard library `venv` module (used to create an isolated
  virtual environment — no system-wide installs).
- **Docker** + the `docker compose` plugin (v2 syntax: `docker compose ...`,
  not the standalone `docker-compose` binary) — used to run Postgres locally.

### Python packages

Split in two, so a production image doesn't ship a test framework it never runs:

**`requirements.txt`** — runtime only (10 packages):
```
fastapi
uvicorn[standard]
sqlalchemy
alembic
psycopg2-binary
pydantic
passlib[bcrypt]
bcrypt<4.1
python-jose[cryptography]
python-dotenv
```

**`requirements-dev.txt`** — the above plus test tooling, via `-r requirements.txt`:
```
pytest
httpx
```

Locally, install the dev file — it pulls in both:
```bash
pip install -r requirements-dev.txt
```
Images install `requirements.txt` only. See [`docs/deployment.md`](docs/deployment.md).

Per `CLAUDE.md`, don't add packages without asking first.

**Why `bcrypt<4.1` is pinned:** `passlib` 1.7.4 (its last release) detects the
bcrypt backend by reading `bcrypt.__about__.__version__`, which the `bcrypt`
package removed in 4.1. Without the pin, `pip install -r requirements.txt`
pulls the latest `bcrypt` and every `passlib.hash.bcrypt` call fails with
`AttributeError: module 'bcrypt' has no attribute '__about__'` (surfaced here
as `ValueError: password cannot be longer than 72 bytes`, a red herring from
passlib's fallback path). This is a known, unpatched upstream incompatibility,
not a bug in this codebase — pinning `bcrypt` is the standard workaround.

## Environment files

- **`.env.example`** — template, committed to the repo. Copy it to `.env`
  (not committed — see `.gitignore`) and fill in real values before running
  anything:
  ```
  POSTGRES_DB=crew_logger
  POSTGRES_USER=crew_logger
  POSTGRES_PASSWORD=changeme
  DATABASE_URL=postgresql://crew_logger:changeme@localhost:5432/crew_logger
  JWT_SECRET=your-secret-key-here
  JWT_EXPIRY_DAYS=7
  ```
  `DATABASE_URL` is spelled out literally rather than derived — keep it in
  sync with the three `POSTGRES_*` values above by hand.
- **`.env` is required for the `db` service too**, not just `api`.
  `docker-compose.yml`'s `db` service reads `POSTGRES_DB`/`POSTGRES_USER`/
  `POSTGRES_PASSWORD` from the environment (via Compose's automatic `.env`
  loading) rather than hardcoding them — this keeps the one credential in one
  place instead of two files that can drift out of sync. `docker compose up`
  will fail without `.env` present.
- If you ever change `POSTGRES_PASSWORD` in `.env` after the `db` container
  has already been created once, it has **no effect** — Postgres only applies
  those variables when it initializes a brand-new, empty data volume. To pick
  up a changed password: `docker compose down -v` (safe only if you don't need
  to keep existing data) then `docker compose up -d` to reinitialize.
- `alembic.ini` still has Alembic's default placeholder DB URL on disk — this
  is intentional, not stale. `migrations/env.py` overrides it at runtime from
  `DATABASE_URL` (via `app/config.py`), so no real credential is ever
  hardcoded into the ini file.

## Start-up

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements-dev.txt   # includes requirements.txt
cp .env.example .env                  # then edit .env with real values
```

Start Postgres:
```bash
docker compose up -d db
```

Start the API:
```bash
uvicorn app.main:app --reload
```

### Verify it's working
```bash
docker compose ps                          # db should show "healthy", not just "Up"
curl -sf http://localhost:8000/docs         # FastAPI Swagger UI, should return 200
curl -s http://localhost:8000/entries | python3 -m json.tool | head  # 74 historic records
```

### Running fully in Docker
```bash
docker compose up -d      # requires .env to exist first (see above)
```

## Running tests

```bash
venv/bin/python -m pytest tests/ -v
```

(Use `python -m pytest`, not the bare `pytest` command — the bare command
doesn't add the project root to `sys.path`, so `from app...` imports inside
the test files fail with `ModuleNotFoundError`.)

**Why `pytest` + `httpx` were added:** testing `app/routes/` end-to-end means
exercising real HTTP requests against the FastAPI app, which is what
FastAPI's `TestClient` does — and `TestClient` is built on `httpx`, not
`requests`. Both live in `requirements-dev.txt`, not the runtime set, so a
production image never installs them. (CLAUDE.md requires asking before adding
packages; this was asked and approved before adding them.)

**Why tests run against the real dev database, not a separate test DB:**
provisioning a second Postgres database (or a second `docker-compose`
service) is more moving parts than this phase needs, and the standard
SQLAlchemy 2.0 pattern for exactly this situation is a per-test
[SAVEPOINT](https://docs.sqlalchemy.org/en/20/orm/session_transaction.html#joining-a-session-into-an-external-transaction-such-as-for-test-suites)
(see `tests/conftest.py`, `join_transaction_mode="create_savepoint"`). Each
test opens a connection, begins an outer transaction, and binds the app's
`get_db` dependency to a session on that connection. The application code
still calls `db.commit()` internally (`app/services/entries.py` does, on
every write) — the savepoint mechanism intercepts those commits so they don't
end the outer transaction, which is rolled back at the end of every test.
Net effect: tests can freely `POST`/`DELETE` through real endpoints against
the real 74-row historic dataset, and nothing persists. Verified directly —
`select count(*) from jobs` was 74 before and after a full test run.

## Project structure

- `app/main.py` — FastAPI app instance; registers the entries and
  participation routers.
- `app/routes/entries.py`, `app/routes/participation.py` — built: full CRUD
  for `jobs` and `participation`. `app/routes/auth.py`, `reports.py` are still
  stubs (Phase 2 / after Phase 3).
- `app/services/entries.py`, `app/services/participation.py` — business logic:
  validation, the `job_edits` audit log on every write, ownership checks.
  `app/services/database.py` — engine, session, `Base`, `get_db`.
  `app/services/auth.py` is still a stub (Phase 2).
- `app/models/database.py` — SQLAlchemy tables: `jobs`, `participation`,
  `job_edits`, `users`. `app/models/schemas.py` — the matching Pydantic
  request/response shapes.
- `migrations/` — Alembic, wired to `DATABASE_URL`; one migration applied
  (initial schema).
- `scripts/import_historic.py` — one-time historic import. Idempotent — see
  its docstring. Run via `python -m scripts.import_historic`.
- `records.csv` — 74 historic PSTS562 records for the one-time historic
  import. Treated as immutable source data — nothing writes back to it.
  Bind-mounted read-only into the `db` container at `/records/records.csv`.
- `tests/` — see "Running tests" above.
- `features/` — one spec file per endpoint group, with a phase and a
  definition-of-done checklist.
- `docs/` — see below.

## Documentation

| File | For | Contents |
|---|---|---|
| [`docs/how-it-works.md`](docs/how-it-works.md) | anyone, non-technical | Plain-language walkthrough of what the app does and how data flows. Start here. |
| [`docs/deployment.md`](docs/deployment.md) | wiring up deployments | Ports, environment contract, image contents, startup ordering, gotchas. Everything needed to write Dockerfiles and deployment YAML. |
| [`docs/decisions.md`](docs/decisions.md) | anyone changing the code | Why the codebase is the way it is — the reasoning behind each design choice, and the bugs that motivated several of them. Read before changing the schema. |
| [`docs/data-model.md`](docs/data-model.md) | schema reference | Authoritative table/column definitions. |
| [`docs/endpoints.md`](docs/endpoints.md) | API reference | Full endpoint list by phase. |

## Notes

- Routes stay thin; all business logic goes in `services/`. Don't put
  business logic directly in `routes/`.
- Do not add Python packages, refactor, or build features from a future
  phase without checking `CLAUDE.md` first.
- This is the single source of truth for business rules — the frontend never
  talks to Postgres directly.
