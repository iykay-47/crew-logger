# History

## What it does
Scrollable list of all past job entries the crew member is linked to.

## What it shows per entry
- Date
- Job number
- Status (draft, submitted, pending, confirmed, disputed)
- My hours for that job

## Behavior
- Sorted by date, newest first
- Tapping an entry opens its full detail
- Filterable by status (future enhancement)

## Phase
Phase 1: List all entries, no user filtering
Phase 2+: Filter to logged-in user's linked entries

## Definition of done
- [ ] Screen loads entries from backend
- [ ] Entries display date, job number, status, hours
- [ ] Sorted newest first
- [ ] Tapping an entry navigates to detail view
- [ ] Empty state shows message when no entries exist
