# Claude Code Prompt — Crew Logger Project Setup

## Overview

Set up two separate repos for the Crew Logger project. Do not build any features, screens, or logic yet. Every screen file should contain only a placeholder component that displays the screen name. Every service file should be empty except for a comment describing its purpose. Every type and model file should be empty except for a comment describing what will go there. Create all feature files and docs files with the content provided below.

---

## Repo 1: crew-logger (Expo frontend)

Create a new Expo project called "crew-logger" using the tabs template with TypeScript.

### Folder structure

```
crew-logger/
├── CLAUDE.md
├── features/
│   ├── dashboard.md
│   ├── new-entry.md
│   ├── history.md
│   ├── confirmation.md
│   ├── reports.md
│   ├── auth.md
│   ├── camera-capture.md
│   └── ocr.md
├── docs/
│   ├── data-model.md
│   └── architecture.md
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/
│   │   ├── index.tsx              ← dashboard
│   │   ├── new-entry.tsx          ← job entry form
│   │   ├── history.tsx            ← past entries list
│   │   └── settings.tsx           ← user settings
│   └── _layout.tsx                ← app-wide layout and navigation
├── components/
│   ├── EntryCard.tsx              ← single job entry in a list
│   └── ConfirmBanner.tsx          ← confirm/dispute prompt
├── services/
│   ├── api.ts                     ← HTTP client setup (base URL, auth headers)
│   ├── entries.ts                 ← job entry API calls
│   ├── participation.ts           ← per-person hours/miles API calls
│   └── auth.ts                    ← login/logout/token management
├── types/
│   └── index.ts                   ← Entry, Participation, User, ConfirmationStatus
├── utils/
│   └── format.ts                  ← date formatting, duration calculation
├── constants/
│   └── index.ts                   ← status labels, fixed values
└── package.json
```

### CLAUDE.md content for crew-logger

```markdown
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
```

### features/dashboard.md

```markdown
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
```

### features/new-entry.md

```markdown
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
```

### features/history.md

```markdown
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
```

### features/auth.md

```markdown
# Auth

## What it does
Login system so crew members can identify themselves in the app.

## Login flow
- One input field accepts either employee PIN or username
- One password field
- Server checks: does the value match any employee PIN? If not, does it match any username?
- If either matches and password is correct, token is issued
- If invalid, show "wrong credentials" with no hint about which part was wrong

## Registration
- Admin creates accounts manually or through a setup screen
- Each account has: username, employee PIN, password, display name
- Employee PIN and username must both be unique

## Session
- After login, a token is stored on the device
- Token is sent with every API request in the auth header
- Token expires after 7 days, then user must log in again

## Phase
Phase 2: Full implementation

## Definition of done
- [ ] Login screen accepts employee PIN or username + password
- [ ] Successful login stores token and navigates to dashboard
- [ ] Failed login shows generic error message
- [ ] Token is sent with all API requests
- [ ] Expired token redirects to login screen
- [ ] App remembers login between restarts (until token expires)
```

### features/confirmation.md

```markdown
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
```

### features/reports.md

```markdown
# Reports

## What it does
Monthly and custom-range summaries of work data for the logged-in crew member.

## What it shows
- Total hours for the period
- Total miles for the period
- Number of jobs completed
- Average hours per job
- Comparison to previous period (this month vs last month)

## Behavior
- Defaults to current month
- Date range picker for custom periods
- Only includes confirmed entries in calculations
- Per-person data only (my hours, my miles)

## Phase
After Phase 3 (needs confirmed data to be meaningful)

## Definition of done
- [ ] Monthly summary displays with correct totals
- [ ] Date range picker works for custom periods
- [ ] Only confirmed entries are included
- [ ] Previous period comparison shows trends
- [ ] Empty state handles months with no data
```

### features/camera-capture.md

```markdown
# Camera Capture

## What it does
Allows crew members to photograph job tickets and odometer/equipment readings
and attach them to job entries.

## Behavior
- Camera opens from the new entry screen
- Photos are compressed and resized before upload (target: under 500KB per image)
- Photos are stored in external storage (Cloudflare R2 or similar)
- Only the URL is saved in the database
- Multiple photos per entry allowed

## Phase
Phase 4: Full implementation

## Definition of done
- [ ] Camera opens and captures a photo
- [ ] Photo is compressed and resized before upload
- [ ] Photo uploads to external storage
- [ ] Photo URL is saved with the entry
- [ ] Photos display in entry detail view
- [ ] Multiple photos per entry work correctly
```

### features/ocr.md

```markdown
# OCR

## What it does
Extracts data from photographed job ticket forms using zone-based field extraction.

## Approach
- Job ticket forms have a consistent fixed layout
- OCR targets specific zones on the form (job number zone, date zone, etc.)
- Extracted values pre-fill the entry form for the crew member to verify

## Behavior
- After capturing a photo of a job ticket, offer to extract fields
- Show extracted values alongside the photo for verification
- Crew member confirms or corrects each extracted field
- Corrected values are used, not OCR output directly

## Phase
Phase 6: Full implementation

## Definition of done
- [ ] Photo of job ticket triggers OCR extraction
- [ ] Correct zones are identified on the fixed-layout form
- [ ] Extracted values pre-fill the entry form
- [ ] Side-by-side view shows photo and extracted values
- [ ] Crew member can correct any extracted field
- [ ] Corrected values save correctly
```

### docs/data-model.md

```markdown
# Data Model

## Job Entry
- id — unique identifier
- date — date the job was performed
- job_number — identifier for the job
- description — what the job involved
- status — draft / submitted / pending_confirmation / confirmed / disputed / expired
- submitted_by — employee id of the person who created the entry
- created_at — timestamp of creation
- updated_at — timestamp of last update

## Participation
- id — unique identifier
- job_id — links to the job entry
- employee_id — links to the user
- hours — hours this person worked on this job
- miles — miles this person drove for this job
- start_time — when this person started
- end_time — when this person ended

## User
- id — unique identifier
- username — unique, used for login
- employee_pin — unique, also used for login
- password_hash — hashed password, never stored in plain text
- display_name — shown in the app
- created_at — timestamp of creation
```

### docs/architecture.md

```markdown
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
```

---

## Repo 2: crew-logger-api (Python FastAPI backend)

Create a new Python project called "crew-logger-api".

### Folder structure

```
crew-logger-api/
├── CLAUDE.md
├── features/
│   ├── entries-api.md
│   ├── participation-api.md
│   ├── auth-api.md
│   ├── confirmation-api.md
│   └── reports-api.md
├── docs/
│   ├── data-model.md             ← same content as frontend repo
│   ├── endpoints.md
│   └── database-setup.md
├── app/
│   ├── main.py                   ← FastAPI startup, route registration
│   ├── routes/
│   │   ├── entries.py            ← job entry endpoints
│   │   ├── participation.py      ← per-person hours/miles endpoints
│   │   ├── auth.py               ← login/logout endpoints
│   │   └── reports.py            ← summary/reporting endpoints
│   ├── services/
│   │   ├── database.py           ← Postgres connection setup
│   │   ├── entries.py            ← entry business logic
│   │   ├── participation.py      ← participation business logic
│   │   └── auth.py               ← auth business logic (hashing, tokens)
│   ├── models/
│   │   ├── database.py           ← SQLAlchemy table definitions
│   │   └── schemas.py            ← Pydantic request/response shapes
│   └── config.py                 ← environment variables, settings
├── migrations/                    ← database migration files (Alembic)
├── tests/
│   └── test_entries.py           ← basic tests
├── requirements.txt              ← Python dependencies
├── Dockerfile                    ← container definition
├── docker-compose.yml            ← Postgres + API for local dev
├── .env.example                  ← template for environment variables
└── .gitignore
```

### CLAUDE.md content for crew-logger-api

```markdown
# Project: Crew Logger (Backend API)

## What this app does
Python FastAPI backend for the Crew Logger field operations app.
Receives requests from the Expo frontend, enforces business rules,
and communicates with Postgres.

## Architecture rules
- All route handlers go in routes/. Keep them thin — they validate input and call services.
- All business logic goes in services/. Routes never contain business logic directly.
- All database table definitions go in models/database.py (SQLAlchemy).
- All request/response shapes go in models/schemas.py (Pydantic).
- Database connection setup goes in services/database.py only.
- Do not add Python packages without asking first.
- Do not refactor, rename, or reorganize files I did not ask about.
- Do not build features from future phases.

## Stack
- Python 3.11+
- FastAPI
- SQLAlchemy (database ORM)
- Alembic (database migrations)
- Pydantic (data validation)
- Postgres (in Docker for local dev)
- passlib + python-jose (auth: password hashing + JWT tokens)

## Data model
One shared job record per job. Per-person data (hours, miles) lives in a
participation table linked by job_id. Each person owns only their own
participation rows. See docs/data-model.md for full schema.

## Auth
Login accepts either employee PIN or username + password. Server checks both
fields. Passwords are hashed with bcrypt via passlib. Sessions use JWT tokens
with 7-day expiry.

## Feature specs
Each feature is defined in the features/ folder. Read the relevant feature file
before building. The definition of done checklist defines when the feature is complete.

## Build phases
Phase 1: Entry CRUD endpoints, Postgres in Docker, basic database setup
Phase 2: Auth endpoints — login, token issuance, protected routes
Phase 3: Confirmation flow endpoints — state machine transitions
Phase 4: Image upload endpoints and external storage integration
Phase 5: Offline sync support endpoints
Phase 6: OCR processing endpoints
Phase 7: Production deployment, CI/CD, monitoring

## Current phase: 1
Only build Phase 1 functionality.
```

### features/entries-api.md

```markdown
# Entries API

## What it does
CRUD endpoints for job entries.

## Endpoints
- POST /entries — create a new job entry
- GET /entries — list entries (all in Phase 1, filtered by user in Phase 2+)
- GET /entries/{id} — get a single entry with its participation data
- PUT /entries/{id} — update an entry (only if status is draft or submitted)
- DELETE /entries/{id} — delete an entry (only if status is draft)

## Validation rules
- date cannot be in the future
- job_number is required and cannot be empty
- start_time must be before end_time
- status defaults to "submitted" on creation

## Phase
Phase 1: All endpoints above, no auth required
Phase 2+: All endpoints require valid auth token

## Definition of done
- [ ] POST /entries creates an entry in Postgres and returns it
- [ ] GET /entries returns all entries sorted by date descending
- [ ] GET /entries/{id} returns entry with linked participation rows
- [ ] PUT /entries/{id} updates allowed fields and rejects if status is wrong
- [ ] DELETE /entries/{id} deletes draft entries and rejects others
- [ ] All validation rules are enforced with clear error messages
- [ ] Endpoints are testable via the FastAPI auto-generated docs at /docs
```

### features/participation-api.md

```markdown
# Participation API

## What it does
Endpoints for per-person hours and miles on a job entry.

## Endpoints
- POST /entries/{id}/participation — add my participation to a job
- PUT /participation/{id} — update my hours/miles
- GET /entries/{id}/participation — get all participation for a job

## Validation rules
- hours cannot be negative
- miles cannot be negative
- one participation row per employee per job (no duplicates)
- can only edit your own participation (enforced in Phase 2+ when auth exists)

## Phase
Phase 1: All endpoints, no ownership enforcement
Phase 2+: Ownership enforcement via auth token

## Definition of done
- [ ] POST creates a participation row linked to the job
- [ ] Duplicate employee+job combination is rejected
- [ ] PUT updates hours and miles
- [ ] GET returns all participation rows for a job
- [ ] Negative values are rejected
- [ ] Endpoints are testable via /docs
```

### features/auth-api.md

```markdown
# Auth API

## What it does
Authentication endpoints for crew member login.

## Endpoints
- POST /auth/login — accepts employee PIN or username + password, returns JWT token
- POST /auth/register — creates a new user account (admin only in future)
- GET /auth/me — returns current user info from token

## Login logic
1. Receive identifier + password
2. Check if identifier matches any employee_pin in users table
3. If no match, check if it matches any username
4. If either matches, verify password hash
5. If valid, issue JWT token with user id and 7-day expiry
6. If invalid, return generic "invalid credentials" error

## Password handling
- Passwords hashed with bcrypt via passlib
- Plain text passwords are never stored or logged
- Password hash comparison is timing-safe (passlib handles this)

## Token handling
- JWT tokens signed with a secret key from environment variables
- Tokens contain: user id, username, issued_at, expires_at
- Every protected route checks the token before processing

## Phase
Phase 2: Full implementation

## Definition of done
- [ ] POST /auth/login accepts PIN or username and returns JWT on success
- [ ] Login rejects invalid credentials with generic error
- [ ] POST /auth/register creates a user with hashed password
- [ ] GET /auth/me returns user info from valid token
- [ ] Invalid or expired tokens return 401 on protected routes
- [ ] Passwords are never visible in logs, responses, or database
```

### features/confirmation-api.md

```markdown
# Confirmation API

## What it does
Endpoints for the confirmation state machine.

## Endpoints
- POST /entries/{id}/confirm — crewmate confirms the entry
- POST /entries/{id}/dispute — crewmate disputes with proposed changes
- GET /entries/pending — entries waiting for my confirmation

## State transitions
- submitted → pending_confirmation (when crewmate is assigned)
- pending_confirmation → confirmed (crewmate approves)
- pending_confirmation → disputed (crewmate proposes changes)
- pending_confirmation → expired (configurable timeout, no action taken)

## Dispute data
- Stores which fields were disputed
- Stores original value and proposed value for each disputed field
- Stores who raised the dispute

## Phase
Phase 3: Full implementation

## Definition of done
- [ ] Confirm endpoint transitions status correctly
- [ ] Dispute endpoint stores disputed fields and proposed values
- [ ] Pending endpoint returns only entries awaiting my confirmation
- [ ] Invalid state transitions are rejected
- [ ] Only the assigned crewmate can confirm or dispute (not the submitter)
```

### features/reports-api.md

```markdown
# Reports API

## What it does
Endpoints that return computed summaries from participation data.

## Endpoints
- GET /reports/summary?month=3&year=2026 — monthly totals for the logged-in user
- GET /reports/weekly — current week totals
- GET /reports/comparison?month=3&year=2026 — this month vs previous month

## What summary returns
- total_hours
- total_miles
- job_count
- average_hours_per_job
- period (date range covered)

## Rules
- Only includes entries with status "confirmed"
- Only sums the logged-in user's participation rows
- Returns zeros (not errors) for periods with no data

## Phase
After Phase 3 (needs auth and confirmed entries)

## Definition of done
- [ ] Monthly summary returns correct totals
- [ ] Weekly summary returns correct totals
- [ ] Comparison returns current and previous month side by side
- [ ] Only confirmed entries are counted
- [ ] Empty periods return zero values, not errors
- [ ] Calculations match manual verification on test data
```

### docs/data-model.md

Same content as the frontend repo's docs/data-model.md (copied above).

### docs/endpoints.md

```markdown
# API Endpoints

## Base URL
Development: http://localhost:8000

## Entries
- POST   /entries                    — create a new job entry
- GET    /entries                    — list entries
- GET    /entries/{id}              — single entry with participation
- PUT    /entries/{id}              — update an entry
- DELETE /entries/{id}              — delete a draft entry

## Participation
- POST   /entries/{id}/participation — add participation to a job
- PUT    /participation/{id}        — update participation
- GET    /entries/{id}/participation — list participation for a job

## Auth (Phase 2)
- POST   /auth/login                — login, returns JWT
- POST   /auth/register            — create user account
- GET    /auth/me                   — current user from token

## Confirmation (Phase 3)
- POST   /entries/{id}/confirm      — confirm an entry
- POST   /entries/{id}/dispute      — dispute an entry
- GET    /entries/pending           — my pending confirmations

## Reports (after Phase 3)
- GET    /reports/summary           — monthly totals
- GET    /reports/weekly            — current week totals
- GET    /reports/comparison        — month vs previous month

## Auth requirements
Phase 1: No auth required on any endpoint
Phase 2+: All endpoints except POST /auth/login require valid JWT token
```

### docs/database-setup.md

```markdown
# Database Setup

## Local development

Postgres runs in Docker via docker-compose.

### Start the database
```bash
docker-compose up -d
```

### Connection details
- Host: localhost
- Port: 5432
- Database: crew_logger
- User: crew_logger
- Password: (set in .env)

### Run migrations
```bash
alembic upgrade head
```

### Reset database (delete all data and recreate)
```bash
alembic downgrade base
alembic upgrade head
```

## Docker Compose setup
The docker-compose.yml file runs:
- Postgres 16 on port 5432
- The FastAPI app on port 8000 (optional, can also run with uvicorn directly)

## Environment variables
Copy .env.example to .env and fill in:
- DATABASE_URL=postgresql://crew_logger:yourpassword@localhost:5432/crew_logger
- JWT_SECRET=your-secret-key-here
- JWT_EXPIRY_DAYS=7
```

---

## What I expect when you're done

### Repo 1: crew-logger
- Project runs with `npx expo start` and opens in browser showing placeholder tabs
- All files in the structure above exist
- All feature files contain the content above
- All docs files contain the content above
- CLAUDE.md exists with the content above
- No features are built — only placeholders

### Repo 2: crew-logger-api
- docker-compose.yml exists and can start Postgres with `docker-compose up -d`
- FastAPI app starts with `uvicorn app.main:app --reload`
- Auto-generated docs are visible at http://localhost:8000/docs
- All files in the structure above exist
- All feature files contain the content above
- All docs files contain the content above
- CLAUDE.md exists with the content above
- No endpoints are built — only the FastAPI app skeleton with empty route files
- .env.example exists with placeholder values
- requirements.txt lists all dependencies
- Dockerfile exists

### Tell me which commands to run to verify each repo works.