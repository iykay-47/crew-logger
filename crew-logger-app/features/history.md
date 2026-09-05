# History

## What it does
Scrollable list of all job records.

## What it shows per entry
- `train_id` — the run designator (not unique; the same one recurs on
  different dates)
- `record_date`
- Route — `origin_station` → `final_station`
- On-duty and off-duty times
- Duration, from the backend's computed `work_minutes`
- `run_miles`

Run data is shared on the job record. There is no per-person "my hours" —
`work_minutes` and `run_miles` belong to the run, not to an individual. See
`../docs/data-model.md`.

## Behavior
- Sorted by `record_date`, newest first (the API already returns them this way)
- Pull to refresh
- Loading, error, and empty states — an unreachable API is the likeliest
  failure, and it shows the URL it tried plus a retry rather than a blank screen

## Phase
Phase 2: List all records, no user filtering
Later: filter to the logged-in user's records once auth exists

## Not built yet
- Tapping an entry to open a detail view
- Filtering by status

## Definition of done
- [x] Screen loads entries from the backend
- [x] Entries display date, train_id, route, times, duration, miles
- [x] Sorted newest first
- [x] Empty state shows a message when no entries exist
- [x] Error state names the cause and offers a retry
- [ ] Tapping an entry navigates to a detail view
