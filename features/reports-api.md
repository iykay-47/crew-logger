# Reports API

## What it does
Endpoints that return computed summaries over a user's job records.

Totals are derived from the shared `jobs` record — `work_minutes` and
`run_miles` — scoped to the jobs the user has a participation row on.
Participation itself carries no hours or miles. See docs/data-model.md.

## Endpoints
- GET /reports/summary?month=3&year=2026 — monthly totals for the logged-in user
- GET /reports/weekly — current week totals
- GET /reports/comparison?month=3&year=2026 — this month vs previous month

## What summary returns
- total_work_minutes (sum of jobs.work_minutes; formatted to HHMM / "5h 45m" for display)
- total_miles (sum of jobs.run_miles)
- job_count
- average_work_minutes_per_job
- period (date range covered)

## Rules
- Only includes records with status "confirmed"
- Scoped to jobs the logged-in user has a participation row on
- A shared job counts once per user, not once per crew member
- Returns zeros (not errors) for periods with no data
- Derived at query time — never stored (see facts vs derivations, docs/data-model.md)

## Phase
After Phase 3 (needs auth and confirmed records)

## Definition of done
- [ ] Monthly summary returns correct totals
- [ ] Weekly summary returns correct totals
- [ ] Comparison returns current and previous month side by side
- [ ] Only confirmed records are counted
- [ ] A job shared by two crew members is not double-counted for one user
- [ ] Empty periods return zero values, not errors
- [ ] Calculations match manual verification on test data
