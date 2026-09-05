# Project: Crew Logger

Monorepo. Facts shared by both halves live here; each project's own
`CLAUDE.md` holds only rules local to it.

- `crew-logger-api/` — Python FastAPI backend + Postgres
- `crew-logger-app/` — Expo (React Native, TypeScript) frontend

## What this app does
A field operations app for small train crews (1–3 people) to record work
metrics. One crew member logs a run; their crewmate confirms it. Tracked times
feed internal estimates only — not payroll, not billing.

## Data model
One shared `jobs` record per run, co-owned by the crew — both crewmates edit the
same row, so run data is stored once, not duplicated. `participation` holds crew
membership plus per-person `claims` only (the sole per-person data). `job_edits`
logs every edit (who/when/what). `users` handles auth.

Both crewmates may edit the shared `jobs` row; each person owns only their own
`participation` row and may not edit another crew member's claims.

**Full schema in `docs/data-model.md` — read it before building models.**
**Read `docs/decisions.md` before changing the schema or data model.** It
records why each choice was made and which bugs motivated them; several look
arbitrary without that context and are easy to undo by accident.

## Architecture
```
crew-logger-app  ──HTTP──>  crew-logger-api  ──SQL──>  Postgres
```
- The frontend **never** touches the database directly. All data flows through
  the backend.
- The backend is the single source of truth for business rules — including
  summaries and totals. Aggregation is backend work, not client work.

## Build phases

One list, covering both halves. Scoped to a **single user for now** — crew
features are deferred, not cancelled, and the schema stays crew-ready.

- **Phase 1 — done.** Models (`jobs`, `participation`, `job_edits`, `users`),
  historic import (74 records, employee 196035), entry CRUD. Every write logs
  to `job_edits`.
- **Phase 2 — current.** Viewing and summaries: reports endpoints on the
  backend, read-only dashboard and history screens on the frontend.
- **Phase 3.** Deploy on Docker.
- **Phase 4.** Entry form — log new runs, not just historic ones.
- **Phase 5.** Image upload and storage.
- **Phase 6.** Offline support.
- **Phase 7.** OCR extraction from job tickets.

**Deferred:** the confirmation workflow (edit/notify/confirm loop, state
machine, lock-on-confirm) and real multi-user auth. Both exist only because two
crew members need to agree; neither is needed while the app is single-user.

Do not build features from future phases.

## Global rules
- Do not add packages (Python or npm) without asking first.
- Do not refactor, rename, or reorganize files you were not asked about.
- `records.csv` is immutable source data — read it, never write to it.

## Docs
| File | What |
|---|---|
| `docs/how-it-works.md` | Plain-language walkthrough. Start here. |
| `docs/data-model.md` | Authoritative schema. |
| `docs/decisions.md` | Why the codebase is the way it is. |
| `docs/deployment.md` | Ports, env contract, Docker topology, gotchas. |
| `docs/endpoints.md` | API reference. |

Feature specs stay per-project in each `features/` folder.
