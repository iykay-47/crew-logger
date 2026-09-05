# New Entry

## What it does
Form for submitting a new job entry with the crew member's participation data.

## Fields
- Date (defaults to today)
- Job number
- Description
- Start time
- End time
- My hours worked
- My miles driven

## Behavior
- Submit sends data to the backend via services/entries.ts
- On success, navigate back to dashboard
- On failure, show error message and keep form data

## Phase
Phase 1: All fields above, submits to backend
Phase 3: Adds crew member selection for confirmation routing

## Definition of done
- [ ] All fields render and accept input
- [ ] Date defaults to today
- [ ] Submit calls the backend and saves to database
- [ ] Success navigates to dashboard
- [ ] Failure shows error without losing form data
- [ ] Entry appears on dashboard after submission
