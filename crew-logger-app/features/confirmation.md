# Confirmation Flow

## What it does
After one crew member submits a job entry, their crewmate
confirms or disputes it.

## State machine
draft → submitted → pending confirmation → confirmed / disputed / expired

## Behavior
- Submitter creates entry (status: submitted)
- Crewmate sees it in their confirmation queue
- Crewmate can confirm (status: confirmed) or dispute specific fields (status: disputed)
- Disputed entries show what was disputed and proposed changes
- If no action taken within a configurable window, status becomes expired

## Phase
Phase 3: Full implementation

## Definition of done
- [ ] Submitted entries appear in crewmate's confirmation queue
- [ ] Crewmate can confirm an entry
- [ ] Crewmate can dispute with proposed changes
- [ ] Status transitions follow the state machine
- [ ] Disputed entries show original vs proposed values
- [ ] Dashboard counts reflect confirmation states accurately
