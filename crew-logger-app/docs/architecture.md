# Architecture

## Flow
Expo app (phone/browser) → HTTP requests → Python FastAPI backend → SQL queries → Postgres

## Repos
- crew-logger — Expo frontend (this repo)
- crew-logger-api — Python FastAPI backend (separate repo)

## Rules
- Frontend never touches the database directly
- All data flows through the Python backend
- Auth tokens are issued by the backend and sent with every request
- The backend is the single source of truth for business rules

## Development
- Frontend runs via Expo (npx expo start) on localhost
- Backend runs via FastAPI (uvicorn) on localhost
- Postgres runs in Docker on localhost
- Frontend points to backend at http://localhost:8000 during development
