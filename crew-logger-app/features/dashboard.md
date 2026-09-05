# Dashboard

## What it does
Home screen showing work totals at a glance.

## What it shows
- **All time** — trip count, hours worked, miles
- **This week** — same three figures, Monday–Sunday
- **By month** — a table with one row per month (newest first): trips, hours,
  miles

## Where the numbers come from
Every figure is computed by the backend and fetched from `/reports/summary`,
`/reports/weekly` and `/reports/monthly`. **This screen does no arithmetic.**

Aggregation lives in the API so that web and phone can never disagree on the
totals, and so the rule that a job shared by two crew members counts once —
not once per crew member — is enforced in exactly one place. See
`crew-logger-api/features/reports-api.md`.

The API returns raw minutes; converting to "7h 30m" or decimal hours is
presentation and happens here, in `utils/format.ts`.

## Behavior
- Pull to refresh
- Loading, error, and empty states; the error names the API URL it tried and
  offers a retry

## Phase
Phase 2: totals across all records, no user filtering
Later: scope to the logged-in user once auth exists; confirmation counts once
the Phase 3 workflow exists

## Not built yet
- Count of entries awaiting confirmation (needs the Phase 3 workflow)
- Recent-entries list (the History tab covers this for now)
- Tapping through to entry detail
- Charts — no charting library is installed; numbers and tables for now

## Definition of done
- [x] Screen loads and displays real data from the backend
- [x] All-time totals are correct
- [x] Weekly totals are correct
- [x] Monthly breakdown shows one row per month, newest first
- [x] Totals verified against psql on the 74 historic records
- [x] Error state names the cause and offers a retry
