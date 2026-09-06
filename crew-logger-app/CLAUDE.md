# Crew Logger — Frontend

Expo (managed React Native, TypeScript). Talks to `crew-logger-api` over HTTP.

**Shared context — what the app does, the data model, and the build phases —
is in the root `CLAUDE.md`. Read that first.** This file holds only
frontend-local rules.

## Architecture rules
- This app **NEVER** talks to the database directly. All requests go through
  the Python backend.
- **No business logic here** — including summaries and totals. Aggregation is
  the backend's job; this app displays what the API returns. Formatting for
  display (minutes → "7h 30m") is presentation and *does* belong here.
- All API calls go in `services/`. Screens never make HTTP requests directly.
- All TypeScript types go in `types/index.ts`. Do not define types inline in
  other files.
- All reusable UI goes in `components/`. If it appears on more than one screen,
  extract it.

## Stack
- Expo ~57, React Native 0.86, React 19, TypeScript
- Expo Router (file-based routing; tabs in `app/(tabs)/`)
- `fetch` is built in — no HTTP client package needed
- No charting library installed

## Configuration
`EXPO_PUBLIC_*` environment variables in `.env` (see `.env.example`):
`EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_EMPLOYEE_NUMBER`.

**Only `EXPO_PUBLIC_`-prefixed vars reach client code.** Do not use `app.json`
`extra` via `expo-constants` — `Constants.expoConfig.extra` is `null` on Expo
web, so config set that way arrives empty with no error.

These are read at bundle time: **restart the dev server after changing them.**

Running on a **physical phone** needs two more changes: the API must bind
`0.0.0.0` instead of `127.0.0.1`, and `EXPO_PUBLIC_API_URL` must point at the
machine's LAN IP. See `../docs/deployment.md`.

## Feature specs
Each feature is defined in `features/`. Read the relevant file before building.

**Several specs are stale** — written before the backend was redesigned around
the railroad data model. `new-entry.md`, `confirmation.md`, and `auth.md` still
describe per-person `hours`/`miles`, a `job_number` field, and a dispute flow,
none of which exist in the API. Reconcile against `../docs/data-model.md`
before building from any of them.

## Running
```bash
npx expo start --web     # browser
npx expo start           # dev server (phone via Expo Go)
```
