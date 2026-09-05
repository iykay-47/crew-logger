# Project: Crew Logger (Frontend)

## What this app does
A mobile field operations app for small crews (1-3 people) to track work metrics.
One crew member submits a job entry, their crewmate confirms or disputes it.
Tracked times feed internal estimates only — not payroll or billing.

## Architecture rules
- This app NEVER talks to the database directly.
- All requests go through the Python backend (crew-logger-api).
- All API calls go in services/. Screens never make HTTP requests directly.
- All TypeScript types go in types/index.ts. Do not define types inline in other files.
- All reusable UI pieces go in components/. If it appears on more than one screen, extract it.
- Do not add npm packages without asking first.
- Do not refactor, rename, or reorganize files I did not ask about.
- Do not build features from future phases.

## Stack
- Expo (managed React Native, TypeScript)
- Communicates with crew-logger-api over HTTP
- No direct database access

## Feature specs
Each feature is defined in the features/ folder. Read the relevant feature file before
building. The definition of done checklist in each file defines when the feature is complete.

## Build phases
Phase 1: Job entry form submits through backend to Postgres, entries appear on dashboard
Phase 2: Auth — login with username or employee PIN + password
Phase 3: Confirmation flow — submit/confirm/dispute state machine
Phase 4: Camera capture and image storage
Phase 5: Offline support
Phase 6: OCR extraction from job tickets
Phase 7: Polish and deploy

## Current phase: 1
Only build Phase 1 functionality.
