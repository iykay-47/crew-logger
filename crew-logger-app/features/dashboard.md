# Dashboard

## What it does
Home screen showing the crew member's current work summary at a glance.

## What it shows
- Total hours this week
- Total miles this week
- Count of entries waiting for my confirmation
- Count of entries I submitted that are pending
- List of recent entries (last 5)

## Phase
Phase 1: Show total entries this week and recent entries list (no per-person filtering until auth exists in Phase 2)
Phase 2+: Filter to logged-in user's data, show confirmation counts

## Definition of done
- [ ] Screen loads and displays real data from backend
- [ ] Weekly totals are calculated correctly
- [ ] Recent entries list shows last 5 entries
- [ ] Tapping a recent entry navigates to its detail
- [ ] Screen refreshes when returning from submitting a new entry
