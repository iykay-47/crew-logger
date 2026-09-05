# Confirmation API

## What it does
The edit/notify/confirm loop over a shared `jobs` record.

Confirmation is **per-edit, not once**. Either crewmate may edit the shared
record; each edit notifies the other crew member, who confirms it or re-edits
(which notifies back). An edit to a confirmed record sends it back to pending.

## Endpoints
- POST /entries/{id}/confirm — confirm the current state of the record
- POST /entries/{id}/reopen — unlock a confirmed record for further edits
- GET /entries/pending — records awaiting my confirmation

There is no separate dispute endpoint. A crewmate who disagrees edits the
record (PUT /entries/{id}, see entries-api.md) — that edit logs to `job_edits`
and notifies back. Disagreement is expressed as a counter-edit, not a
parallel dispute payload.

## State transitions
- draft → submitted (creator submits)
- submitted → pending_confirmation (crewmate is on the record)
- pending_confirmation → confirmed (crewmate approves)
- confirmed → pending_confirmation (either crewmate edits — loops back)
- pending_confirmation → expired (configurable timeout, no action taken)
- confirmed → (locked) — no edits without an explicit reopen

## Lock on confirm
A confirmed record is locked. PUT against it is rejected until
POST /entries/{id}/reopen unlocks it. Reopen writes a `job_edits` row like any
other change.

## Notify
Each edit notifies the other crew member. Delivery mechanism is undecided —
in-app status flag, polling, or push. `job_edits` (who/when/what) carries
everything a notification needs regardless of transport.

## Phase
Phase 3: Full implementation

## Definition of done
- [ ] Confirm endpoint transitions status correctly
- [ ] An edit to a confirmed record is rejected until reopened
- [ ] Reopen unlocks a confirmed record and logs the change
- [ ] An edit to a pending record re-notifies the other crew member
- [ ] Pending endpoint returns only records awaiting my confirmation
- [ ] The person who made an edit cannot confirm their own edit
- [ ] Invalid state transitions are rejected

## Open
- **`disputed` status is currently unreachable.** docs/data-model.md keeps
  `disputed` in the status enum, but under the counter-edit model above nothing
  transitions into it. Either drop `disputed` from the enum, or keep an explicit
  dispute action alongside counter-editing. Needs a decision — this spec assumes
  counter-edit only.
- Expiry timeout value is not set.
- Notify transport is undecided (see Notify above).
- **No matching/merge logic exists for a second crew member's submission of
  the same run.** Verified live: `POST /entries` always creates a brand-new
  `jobs` row, with no check against existing ones. `train_id` alone can't
  drive that check — it's explicitly "not unique across dates"
  (docs/data-model.md), so two unrelated runs on different days routinely
  share a `train_id`, and that's normal, not a collision.
  It's only actually a problem when **`record_date` + `on_duty` + crew
  members overlap** across two separately-created `jobs` rows — that
  combination means the same real run got logged twice as two independent
  records instead of one shared record with two `participation` rows, which
  breaks the co-owned-`jobs` model this whole endpoint group depends on.
  Phase 3 needs to decide: match at submit time and merge/reject, or detect
  and reconcile after the fact. Undecided — not built either way.
