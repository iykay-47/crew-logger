# Crew Logger — Data Model

Authoritative definition of the database tables for Crew Logger. The database
tables and the API models are built from this. Supersedes the earlier
`data-model.md` sketch and standalone `schema.md`.

**Design:** one shared record per run, co-owned by the crew. A `jobs` row holds
all the run data; both crewmates see and edit the same row. `participation`
records who is on the crew and their personal claims. Everything else is shared.

**Edit / confirm loop:** either crewmate can edit the shared `jobs` record. Each
edit notifies the other crew member, who confirms it or re-edits (which notifies
back). Confirmation is per-edit, not once — an edit sends a confirmed record
back to pending.

---

## Tables

### `jobs` — the shared run record (one row per run, co-owned by the crew)

All run data lives here. Both crewmates read and edit the same row.

| Field | Type | Notes |
|---|---|---|
| `job_id` | `UUID` | Primary key. Generated at write/import time |
| `train_id` | `VARCHAR` | Identifies the trip/run. Letter + hyphen. Not unique across dates |
| `original_train_id` | `VARCHAR` | Same format as `train_id`. Supplied manually. NULL unless given ("last timeslip") |
| `record_date` | `DATE` | |
| `origin_station` | `VARCHAR` | Station code, text (preserves leading zeros) |
| `final_station` | `VARCHAR` | |
| `start_time` | `TIMESTAMP` | Distinct from `on_duty` — confirmed against the historic data: 15 minutes later on 64 of 74 records, equal on the other 10. Not a duplicate field |
| `on_duty` | `TIMESTAMP` | |
| `initial_os` | `TIMESTAMP` | |
| `final_os` | `TIMESTAMP` | |
| `off_duty` | `TIMESTAMP` | |
| `run_miles` | `NUMERIC(6,2)` | **Not float** |
| `work_minutes` | `INTEGER` | Generated: off_duty - on_duty as minutes. Rollover-safe |
| `train_length` | `INTEGER` | Feet |
| `cars` | `SMALLINT` | Count |
| `axles` | `VARCHAR` | NULL on all historic rows; collected via the entry form. Match/count only |
| `lead_unit` | `VARCHAR` | NULL on all historic rows; collected via the entry form |
| `trailing_units` | `VARCHAR` | NULL on all historic rows; collected via the entry form |
| `dp_units` | `VARCHAR` | Distributed power. NULL on all historic rows; collected via the entry form |
| `release_care_control` | `TIMESTAMP` | NULL on all historic rows; collected via the entry form |
| `rx_rtc` | `VARCHAR` | RX detail. NULL on all historic rows; collected via the entry form |
| `rx_mile_point` | `VARCHAR` | Text (final). NULL on all historic rows; collected via the entry form |
| `rx_time` | `TIMESTAMP` | RX detail. Standalone timestamp, not in the on-duty/off-duty sequence. Collected via the entry form |
| `rest` | `INTEGER` | Whole numbers only. NULL on all historic rows; collected via the entry form |

**Lifecycle & edit tracking**

| Field | Type | Notes |
|---|---|---|
| `status` | enum | draft / submitted / pending_confirmation / confirmed / disputed / expired. Loops: an edit to a pending record re-notifies. **Locks on confirmed** — no edits without explicit reopen |
| `source` | `VARCHAR` | historic_import vs app_entry |
| `last_edited_by` | employee_number | Who made the most recent edit |
| `last_edited_at` | `TIMESTAMP` | When |
| `created_at` | `TIMESTAMP` | |
| `updated_at` | `TIMESTAMP` | |

*(Notify-on-edit requires knowing what changed, by whom, when. `last_edited_by`
/ `last_edited_at` cover the latest change; a fuller edit log may be added later.)*

### `participation` — crew membership + personal claims

Minimal, because run data is shared on `jobs`. One row per crew member per job.

| Field | Type | Notes |
|---|---|---|
| `id` | `UUID` | Primary key |
| `job_id` | FK -> `jobs.job_id` | Which run |
| `employee_number` | FK -> `users.employee_number` | Which crew member |
| `claims` | `JSONB` | This person's claims. Mostly identical across the crew, but each person may have a few of their own — the only genuinely per-person data |

"Who was on the crew" = all participation rows sharing a `job_id`.

### `users`

| Field | Type | Notes |
|---|---|---|
| `id` | `UUID` | Primary key |
| `username` | `VARCHAR` | Unique. Login identifier |
| `employee_number` | `VARCHAR` | Unique. Also a login identifier, and the FK target for participation |
| `display_name` | `VARCHAR` | Employee name, shown in the app |
| `password_hash` | `VARCHAR` | Bcrypt via passlib. **Never plaintext** |
| `created_at` | `TIMESTAMP` | |

Login accepts username **or** employee_number + password; server checks both.

### `job_edits` — full edit history

One row per edit to a `jobs` record. Feeds the notify/confirm loop.

| Field | Type | Notes |
|---|---|---|
| `id` | `UUID` | Primary key |
| `job_id` | FK -> `jobs.job_id` | Which record was edited |
| `edited_by` | employee_number | Who made the edit |
| `edited_at` | `TIMESTAMP` | When |
| `change` | `JSONB` | What changed (fields before/after) |

`jobs.last_edited_by` / `last_edited_at` mirror the most recent entry here.

---

## Historic import (74 records)

Each flat CSV row becomes **one `jobs` row + one `participation` row**, linked by
a generated `job_id`. Where two historic records share a `train_id` +
`record_date` (same crew, same run), they become **one `jobs` row + two
`participation` rows** — checked against the actual 74-row dataset: no such
pair exists. Every record here is a solo run; the two-`participation`-row case
doesn't arise in this import, though the rule stands for any future one.

On import:
- `status` = `confirmed`
- `source` = `historic_import`
- `employee_number` (participation) = `196035` (all historic records)
- `start_time` is imported as its own value, not derived from `on_duty`
- lifecycle timestamps set at import time
- historic `claims` = NULL (none captured)
- all "not in historic data" fields = NULL

---

## Design principles

- **Facts vs derivations.** The DB stores facts, not interpretations (e.g.
  "return trip") — the API derives those at query time. Exception: DB-computed
  derivations like `work_minutes`.
- **Shared once, not copied.** Run data lives once on `jobs`, not duplicated per
  crewmate — so it can't drift out of sync between them.
- **Blank -> NULL, never 0.** Empty = not recorded; zero is a real value.
- **Names carry units** where ambiguous (`work_minutes`).

---

## Notes for the build

- **Reopen path (TBD).** A confirmed record is locked. Define how it reopens for
  further edits when building the state machine (step 10).
- Consist/RX fields and all run data are shared on `jobs`; only `claims` is
  per-person.