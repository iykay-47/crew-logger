# Crew Logger

A field operations app for small train crews to record work metrics. One crew
member logs a run; their crewmate confirms it. Tracked times feed internal
estimates only — not payroll, not billing.

Monorepo:

| Directory | What |
|---|---|
| `crew-logger-api/` | Python FastAPI backend + Postgres |
| `crew-logger-app/` | Expo (React Native + TypeScript) frontend |
| `docs/` | Shared documentation — start with `how-it-works.md` |

**New here?** Read [`docs/how-it-works.md`](docs/how-it-works.md) — a
plain-language walkthrough of what the app does and how data moves through it.

---

## Running everything

Three pieces, started in this order. Postgres must be ready before the API,
and the API must be running before the frontend can show anything.

### 1. Database

```bash
cd crew-logger-api
docker compose up -d
docker compose ps            # wait for "healthy", not just "Up"
```

The `db` container holds the data in a named volume, so it survives restarts.
It keeps running between sessions — you usually only start it once.

### 2. Backend API — port 8000

```bash
cd crew-logger-api
venv/bin/alembic upgrade head              # only after a schema change
venv/bin/uvicorn app.main:app --reload
```

First-time setup (venv, dependencies, `.env`) is in
[`crew-logger-api/README.md`](crew-logger-api/README.md).

Check it: <http://localhost:8000/docs> — FastAPI's interactive API browser.
You can call every endpoint from there without the frontend.

### 3. Frontend — port 8081

```bash
cd crew-logger-app
npx expo start --web
```

Opens at <http://localhost:8081>. The Dashboard shows totals; History lists
every trip.

### Stopping

`Ctrl-C` in each terminal stops the API and the frontend. Postgres keeps
running until you stop it:

```bash
cd crew-logger-api
docker compose stop          # keeps the data
docker compose down -v       # DELETES the database volume
```

`down -v` destroys your records. They can be rebuilt from `records.csv` — see
"Historic data" below — but nothing entered through the app is recoverable.

---

## Quick reference

| | Command | Port |
|---|---|---|
| Database | `docker compose up -d` (in `crew-logger-api/`) | 5432 |
| API | `venv/bin/uvicorn app.main:app --reload` | 8000 |
| Frontend | `npx expo start --web` | 8081 |
| API browser | <http://localhost:8000/docs> | |
| Backend tests | `venv/bin/python -m pytest tests/ -v` | |
| Type-check frontend | `npx tsc --noEmit` | |
| Query the DB | `docker exec -it crew-logger-api-db-1 psql -U crew_logger -d crew_logger` | |

Both dev servers must run at once for the app to show data — the frontend
fetches everything from the API.

---

## Historic data

The database holds 74 real past runs, imported once from `records.csv`
(extracted from PSTS562, the railroad's terminal system). The CSV is treated as
immutable source data — mounted read-only, never written to.

Re-import (safe to run repeatedly; it skips records already present):

```bash
cd crew-logger-api
venv/bin/python -m scripts.import_historic
```

---

## Current state

**Built:** the four tables, the historic import, entry CRUD with full edit
logging, summary endpoints, Dashboard and History screens, and the New Entry
form (all 23 job fields, with times that cross midnight handled correctly).

**Not built:** logging in (no auth — anyone reaching the API can read and write
everything), the confirmation workflow, the Settings screen, entry detail on
tap, photos, offline support, OCR.

Scoped to a **single user** for now. Crew features are deferred, not cancelled —
the schema is already crew-ready. See the build phases in
[`CLAUDE.md`](CLAUDE.md).

---

## Documentation

| File | For |
|---|---|
| [`docs/how-it-works.md`](docs/how-it-works.md) | Anyone — plain language, no code. Start here. |
| [`docs/deployment.md`](docs/deployment.md) | Wiring up Docker/deployments. Ports, env contract, topologies, gotchas. |
| [`docs/decisions.md`](docs/decisions.md) | Anyone changing the code — why it's built this way. Read before schema changes. |
| [`docs/data-model.md`](docs/data-model.md) | Authoritative schema. |
| [`docs/endpoints.md`](docs/endpoints.md) | API reference. |
| [`CLAUDE.md`](CLAUDE.md) | Architecture rules and build phases. |
