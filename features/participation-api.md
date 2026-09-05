# Participation API

## What it does
Endpoints for crew membership on a job, plus each person's own `claims`.

Participation is deliberately minimal: run data (miles, times, stations,
consist) is shared on the `jobs` record, stored once. `claims` is the only
genuinely per-person data. See docs/data-model.md.

## Endpoints
- POST /entries/{id}/participation — add a crew member to a job
- PUT /participation/{id} — update my claims
- GET /entries/{id}/participation — get all participation rows for a job

"Who was on the crew" = all participation rows sharing a `job_id`.

## Validation rules
- one participation row per employee per job (unique on job_id + employee_number)
- employee_number must resolve to an existing user
- claims is JSONB; NULL means none captured, never an empty object
- can only edit your own participation row — a crewmate may not edit another
  person's claims (enforced in Phase 2+ when auth exists)

## Phase
Phase 1: All endpoints, no ownership enforcement
Phase 2+: Ownership enforcement via auth token

## Definition of done
- [x] POST creates a participation row linked to the job
- [x] Duplicate employee_number + job_id combination is rejected
- [x] PUT updates claims
- [x] GET returns all participation rows for a job
- [x] Participation carries no run data — no hours, miles, or times
- [x] Endpoints are testable via /docs
