# New Entry

## What it does
Form for logging a completed run. Creates one `jobs` record via
`POST /entries`.

The record is shared, not personal — it describes the run, not the person
entering it. Crew membership and per-person `claims` are separate
(`participation`), and are not part of this form. See `../docs/data-model.md`.

## Fields

The API accepts exactly the fields below. Anything not listed here cannot be
submitted — see "What this form cannot set".

### Required

| Field | Type | Notes |
|---|---|---|
| `train_id` | text | The run designator, e.g. `A44251-22`. Cannot be empty. **Not unique** — the same designator recurs on other dates, which is normal. |
| `record_date` | date | Defaults to today. **Cannot be in the future** (rejected with 422). |

### Optional — route

| Field | Type | Notes |
|---|---|---|
| `origin_station` | text | Station code. **Text, not a number** — codes can have leading zeros that must be preserved. |
| `final_station` | text | Same. May equal `origin_station` (real round trips exist in the data). |

### Optional — times

All are full timestamps, not times-of-day. See "Times crossing midnight".

| Field | Notes |
|---|---|
| `on_duty` | When the crew went on duty |
| `start_time` | When the train started moving. **Distinct from `on_duty`** — typically ~15 min later. Do not merge these into one field. |
| `initial_os` | First position report ("OS") |
| `final_os` | Last position report |
| `off_duty` | When the crew went off duty. **Must be after `on_duty`** (rejected with 422). |

### Optional — consist and RX detail

Absent from every historic PSTS562 record (NULL on all 74 imported rows), so
these are only ever populated by live entry.

| Field | Type | Notes |
|---|---|---|
| `axles` | text | Match/count only — not used in calculation |
| `lead_unit` | text | |
| `trailing_units` | text | |
| `dp_units` | text | Distributed power |
| `rx_rtc` | text | |
| `rx_mile_point` | text | Text by decision, not numeric |
| `rest` | integer | Whole numbers only |
| `release_care_control` | timestamp | **In the time sequence**, between `final_os` and `off_duty` |
| `rx_time` | timestamp | **Standalone** — see below |

### Optional — measurements

| Field | Type | Notes |
|---|---|---|
| `run_miles` | decimal | **Cannot be negative.** Two decimal places. |
| `train_length` | integer | Feet |
| `cars` | integer | Count |
| `original_train_id` | text | Same format as `train_id`. Only if the run was re-designated. |

### Blank means "not recorded"

An empty optional field must be sent as `null`, **never `0`**. Zero is a real
measurement — a run genuinely recording 0 cars is different from one where the
car count wasn't captured. Conflating them corrupts every average computed
later. 22 of the 74 historic records have a blank `cars` value for this reason.

## Times crossing midnight

A shift routinely runs past midnight — two of the 74 historic records do.
`L56651-09` goes on duty 2026-01-08 20:45 and off duty **2026-01-09** 02:30
(345 min); `L44252-10` runs 20:30 to **next-day** 06:20 (590 min). Both have
an `off_duty` on a different calendar day from their `record_date`.

So the form cannot assume every time falls on `record_date`. The user enters a
time of day; the app derives the date:

- Times are ordered `on_duty` → `start_time` → `initial_os` → `final_os` →
  `release_care_control` → `off_duty`.
- Walking that order, whenever a time-of-day is **earlier** than the one
  before it, the day has rolled over — add a day.

This assumes a shift is under 24 hours, which is safe for train crews (hours
of service are legally capped well below that). State the assumption rather
than hiding it.

**`rx_time` is outside this sequence.** It has no fixed position relative to
the other times, so it can't be placed by comparing it to neighbours. It is
anchored to `on_duty` instead: a clock time earlier than `on_duty` is taken as
the next day. With no `on_duty` entered, it falls on `record_date` as-is.

Getting this wrong is not a cosmetic bug: `work_minutes` is computed from
`off_duty - on_duty`, so a missed rollover produces a negative duration.

## Who is entering this (`edited_by`)

`POST /entries` requires an `edited_by` employee number, and it must match an
existing user or the request is rejected (422). There is no login yet, so the
app must supply it.

It comes from `EXPO_PUBLIC_EMPLOYEE_NUMBER` in `.env` — the same channel as
`EXPO_PUBLIC_API_URL`. (Note `app.json` `extra` does **not** work for this:
`Constants.expoConfig.extra` is `null` on Expo web, so only `EXPO_PUBLIC_`
vars reach client code.) One value, no UI needed, and the Settings screen can
expose it later. Phase 2 replaces it entirely with the identity from the JWT —
so it lives in exactly one place rather than being threaded through the form.

**Do not** make it a field on the form. It is not something a crew member
should retype for every run, and it is not part of the run.

## What this form cannot set

Do not add inputs for these:

- **`work_minutes`** — computed by the database from `on_duty`/`off_duty`.
  Postgres physically rejects any attempt to write it. The form may *display*
  the derived duration as live feedback, but must never submit it.
- **`status`, `source`** — set by the server (`submitted`, `app_entry`).
- **`job_id`, `created_at`, `updated_at`, `last_edited_by`, `last_edited_at`** —
  server-generated.

These are excluded permanently, unlike the consist/RX fields which were simply
not yet wired up.

⚠️ **Unknown fields are silently discarded, not rejected.** Pydantic ignores
extra fields by default, so the API returns **201 Created** and the value is
dropped — no error anywhere. A form input for any field not in `JobCreate`
would appear to work perfectly while the data quietly vanished.

This is why the consist/RX fields needed a backend change before the form
could collect them: adding inputs alone would have silently lost every value.
The order is always **`JobCreate` first, then the form.**

## Behavior

- Submit `POST /entries` through `services/entries.ts`. Screens never call
  `fetch` directly.
- On success, navigate to History (where the new record appears at the top).
- On failure, **keep the form data** and show the error. The API returns a
  readable message in `detail` for 422s — surface it rather than a generic
  failure.
- Disable submit while the request is in flight, so a double-tap can't create
  two records.
- Show the computed duration live as `on_duty`/`off_duty` are entered, so a
  rollover mistake is visible before submitting.

## Phase
Done — the entry form. Built after viewing/summaries; deployment is next. See
the phase list in the root `CLAUDE.md` (the single source of truth for phase
order).

Required no backend work: `POST /entries` is built, tested, and logs every
write to `job_edits`.

## Definition of done

Verified end-to-end against the live API:
- [x] Blank optional fields send `null`, never `0` or `""`
- [x] Times crossing midnight produce the correct next-day timestamp —
      13 cases pass, including both real rollover records (`L56651-09` 345 min,
      `L44252-10` 590 min), a same-day run that must *not* gain a day, and
      month/year/leap-day boundaries
- [x] The live duration matches what the API returns after saving —
      a rollover run displayed 345 min and the database computed 345
- [x] A `job_edits` row is written on create (10 fields recorded)
- [x] Both API error shapes render readable text, never `[object Object]` —
      our string `detail` and Pydantic's list `detail`
- [x] All 9 consist/RX fields persist — verified through the form into the
      database, with `release_care_control` rolling to the next day in its
      sequence position and `rx_time` rolling independently via its `on_duty`
      anchor

Confirmed in a browser against the live API:
- [x] All fields render and accept input
- [x] `record_date` defaults to today
- [x] `train_id` is required; empty submission is blocked before the request
- [x] Success navigates to History and the new entry is visible at the top
      (a rollover run showed 5h 45m and persisted as `off_duty` on the next
      calendar day, `work_minutes` 345)
- [x] `edited_by` comes from `EXPO_PUBLIC_EMPLOYEE_NUMBER`, not the form

Still unconfirmed in-browser (verified only via direct API calls so far):
- [ ] Future `record_date`, negative `run_miles`, and `off_duty` before
      `on_duty` each show the API's message
- [ ] Submit is disabled while in flight
- [ ] Failure preserves everything the user typed
