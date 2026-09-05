# Reports API

## What it does
Endpoints that return computed summaries over job records.

Totals are derived from the shared `jobs` record — `work_minutes` and
`run_miles`. Participation itself carries no hours or miles. See
`../docs/data-model.md`.

## Endpoints
- GET /reports/summary — all-time totals
- GET /reports/weekly — current week (Monday–Sunday)
- GET /reports/monthly — one row per month with records, oldest first

## What each returns
- `period` — what the row covers (`"all-time"`, a date range, or `"2026-01"`)
- `job_count`
- `total_work_minutes` — sum of `jobs.work_minutes`, raw integer minutes
- `total_miles` — sum of `jobs.run_miles`
- `average_work_minutes_per_job`

Minutes are returned raw, **not** pre-formatted. Rendering "7h 30m" is
presentation and belongs in the frontend, so the API stays usable by any
client.

## Rules
- Aggregate directly on `jobs` — **never** through a `participation` join. A
  job with two crew members has two participation rows, and joining would
  count its minutes and miles twice.
- Returns zeros (not errors, not nulls) for periods with no data.
- Derived at query time, never stored — see facts vs derivations in
  `../docs/decisions.md`.

## Two temporary scoping decisions

**Statuses.** This spec originally said confirmed-only. That assumes the Phase
3 confirmation flow, which does not exist — nothing transitions a record to
`confirmed`, so new entries (defaulting to `submitted`) would never appear in
any summary while the 74 historic records, imported as `confirmed`, always
would. Reports currently cover **all non-draft** records. Tighten to
confirmed-only when Phase 3 lands.

**No per-user scoping.** Originally scoped to the logged-in user's
participation rows. There is no auth and one employee owns every record, so
totals cover everything. Phase 2 adds the scoping join — and that join is
exactly where the double-count risk above appears, which is why a test guards
it now.

## Deferred
`GET /reports/comparison` (this month vs previous) — not needed for the
current screens.

## Phase
Phase 2. The original "after Phase 3" gate was auth-for-scoping, which no
longer applies while the app is single-user.

## Definition of done
- [x] All-time summary returns correct totals
- [x] Weekly summary returns correct totals
- [x] Monthly breakdown returns one row per month
- [x] A job shared by two crew members is not double-counted
- [x] Draft records are excluded
- [x] Empty periods return zero values, not errors
- [x] Calculations match manual verification against psql on the 74 records
