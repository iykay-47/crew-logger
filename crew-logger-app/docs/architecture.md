# Architecture (frontend view)

## Flow
Expo app (browser/phone) → HTTP → FastAPI backend → SQL → Postgres

## Layout
Both halves live in one repo:
- `crew-logger-app/` — Expo frontend (this project)
- `crew-logger-api/` — FastAPI backend + Postgres

## Rules
- The frontend never touches the database directly.
- All data flows through the backend, which is the single source of truth for
  business rules — **including summaries and totals**. This app displays what
  the API returns; it does not compute aggregates.
- Auth tokens are issued by the backend and sent with every request (Phase 2 —
  not built yet).

## Development
- Backend: `uvicorn app.main:app --reload` on `:8000`
- Postgres: Docker, `:5432`
- Frontend: `npx expo start --web` (dev server on `:8081`)
- Base URL comes from `app.json` `extra` via `expo-constants`, defaulting to
  `http://localhost:8000`

Because the dev server (`:8081`) and API (`:8000`) are different origins, the
backend must send CORS headers for browser requests to succeed.

For the full schema, deployment topology, and design rationale see the root
`docs/` folder.
