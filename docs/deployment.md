# Deployment Reference

Everything needed to wire this backend into a deployment — Docker, Compose,
or any orchestrator. This file describes *what the system requires*; it
deliberately does not prescribe the Dockerfile or YAML themselves.

---

## Service topology

```
   Expo frontend  ──HTTP──>   api   ──TCP 5432──>   db
   (crew-logger)            (FastAPI)            (Postgres 16)
                            stateless             stateful
```

- **`api`** — FastAPI served by uvicorn. Holds **no state**: no sessions in
  memory, no local files, no uploads (yet). Every piece of durable data lives
  in Postgres. This is what makes it horizontally scalable.
- **`db`** — Postgres 16. The only stateful component.
- The frontend talks **only** to `api`, never to Postgres directly.

---

## Ports

| Service | Port | Notes |
|---|---|---|
| `api` | 8000 | uvicorn |
| `db`  | 5432 | published to the host today so host-run uvicorn and `psql` can reach it |

**uvicorn's default bind address is `127.0.0.1`, which is wrong in a
container.** Inside a container, `127.0.0.1` means "only this container" — the
port publishes but nothing can reach it. It must bind `0.0.0.0`. The existing
`Dockerfile`'s `--host 0.0.0.0` is load-bearing; don't drop it.

The same applies to reaching the API from a phone running the Expo app: a
server bound to `127.0.0.1` on your laptop is unreachable from your phone even
on the same network.

---

## Environment contract

`app/config.py` is the source of truth. It reads with `os.environ["..."]`
(bracket access, not `.get()`), so **a missing variable raises `KeyError` at
import time** and the process dies immediately. This is deliberate: fail loudly
at startup rather than mysteriously at first request.

| Variable | Consumed by | Required | Notes |
|---|---|---|---|
| `DATABASE_URL` | `app/config.py` | yes | full SQLAlchemy URL |
| `JWT_SECRET` | `app/config.py` | yes | unused until Phase 2, but still required to boot |
| `JWT_EXPIRY_DAYS` | `app/config.py` | yes | cast with `int()` — a non-numeric value crashes at import |
| `CORS_ORIGINS` | `app/config.py` → `app/main.py` | no | comma-separated browser origins; defaults to Expo's dev server. **Never `*`** on a reachable network. Unnecessary if served same-origin behind a proxy |
| `POSTGRES_DB` | Postgres image, Compose interpolation | yes | |
| `POSTGRES_USER` | Postgres image, Compose interpolation, healthcheck | yes | |
| `POSTGRES_PASSWORD` | Postgres image, Compose interpolation | yes | |

`app/config.py` also calls `load_dotenv()`, so a `.env` file is read when
present. In a container you would normally inject real environment variables
instead; `load_dotenv()` is harmless when no file exists.

**`.env` must never be baked into an image.** It's already in `.dockerignore`.

---

## The host-resolution trap

`DATABASE_URL` currently points at `localhost:5432`. That is correct **only
because uvicorn runs on the host right now**.

The moment the API runs in a container, `localhost` refers to *the API
container itself* — where nothing is listening on 5432. It must become the
service name:

```
postgresql://user:pass@db:5432/crew_logger
              host must be the service name ──┘
```

This generalizes: in Compose the hostname is the service name; in Kubernetes
it's the Service name; in ECS it's the service discovery name. It is never
`localhost` unless both processes share a network namespace (e.g. a Kubernetes
pod with two containers).

---

## What belongs in the image

**Required to serve requests:**
- `app/`
- `requirements.txt` — **the runtime set only.** Do not install
  `requirements-dev.txt` in a production image; it adds `pytest` and `httpx`,
  which the running service never uses.

**Required to run migrations inside the container:**
- `alembic.ini`
- `migrations/`

Note `migrations/env.py` imports `app.config`, which means the app package must
be importable *and* `DATABASE_URL` must be set — even for a container whose only
job is running a migration.

**Required only if importing historic data inside the container:**
- `scripts/`
- `records.csv`

**Must never be in the image:**
- `.env` (secrets)
- `venv/` (host-specific, and enormous)

**Already excluded by `.dockerignore`:** `tests/`, `docs/`, `features/`,
`README.md`, `CLAUDE.md`, `.git/`, `venv/`, `__pycache__/`, `.env`.

### Dependency split

Two files:

| File | Contents | Who installs it |
|---|---|---|
| `requirements.txt` | 10 runtime packages | production images, and pulled in by the dev file |
| `requirements-dev.txt` | `-r requirements.txt` + `pytest`, `httpx` | local development and CI |

`requirements-dev.txt` starts with `-r requirements.txt`, so installing it gets
both — locally you only ever need the dev file. An image that runs the tests
(a CI build stage) installs the dev file; the final runtime stage installs
`requirements.txt` only.

If you build multi-stage, this is a natural seam: test in a stage with the dev
deps, copy only the app into a final stage with runtime deps.

---

## Startup ordering

Three things must happen in order:

1. **Postgres becomes ready.** Not *started* — **ready**. The healthcheck is
   `pg_isready -U ${POSTGRES_USER}`.
2. **Migrations apply:** `alembic upgrade head`. The schema must exist before
   the app serves traffic.
3. **uvicorn starts.**

**Readiness ≠ started, and this bites in every orchestrator.** A plain
`depends_on: [db]` in Compose waits only until the container has *started* —
Postgres may still be running `initdb`, which takes several seconds on a fresh
volume. The API then connects, fails, and crash-loops. Compose expresses the
correct behaviour as:

```yaml
depends_on:
  db:
    condition: service_healthy
```

Kubernetes solves the same problem with readiness probes plus an init container
(or a Job) for the migration.

**Migrations must run exactly once**, not once per replica. With multiple API
replicas, run them as a separate one-shot step (an init container, a Job, a
release command) rather than in the app's own entrypoint.

---

## Operational commands

| Task | On the host | In a container |
|---|---|---|
| Apply migrations | `venv/bin/alembic upgrade head` | `docker compose exec api alembic upgrade head` |
| Import historic data | `venv/bin/python -m scripts.import_historic` | `docker compose exec api python -m scripts.import_historic` |
| Run tests | `venv/bin/python -m pytest tests/ -v` | `docker compose exec api python -m pytest tests/ -v` |
| Open a psql shell | — | `docker exec -it crew-logger-api-db-1 psql -U crew_logger -d crew_logger` |

The import is **idempotent** — re-running skips records already present, so it
is safe to run repeatedly (verified: a second run imports 0, skips 74).

---

## Persistence

| What | Where | Lifetime |
|---|---|---|
| Database contents (74 records) | `pgdata` named volume | survives container recreate; destroyed by `docker compose down -v` |
| `records.csv` | bind mount, read-only (`:ro`) | lives on the host; the container only reads it |

`records.csv` is mounted `:ro` on purpose — it is immutable source data. The
import reads it; nothing ever writes back to it. If the database is destroyed,
the CSV can rebuild the 74 historic records from scratch.

---

## Gotchas already hit on this project

Each of these cost real debugging time here, and each generalizes well beyond
this project.

**1. `POSTGRES_PASSWORD` only applies on first initialization.**
The Postgres image reads `POSTGRES_*` **only** when it initializes a brand-new,
empty data directory. If the volume already exists, those variables are silently
ignored — the original credentials remain live. Changing the password in your
config and restarting appears to work and does nothing. Requires
`docker compose down -v` (which destroys the data) to take effect.

**2. Container loopback trusts everything, hiding credential bugs.**
The image's default `pg_hba.conf` contains:
```
local  all  all              trust
host   all  all  127.0.0.1/32  trust
```
So `docker exec ... psql` succeeds with **any password, including a wrong one**.
Testing auth that way proves nothing. Only a connection through the published
port (or from another container) exercises the real `scram-sha-256` rule. On
this project that masked a completely broken password for a while.

**3. `docker compose restart` does not apply config changes.**
It restarts the process inside the existing container, preserving the old
config. A healthcheck fix sat un-applied because of this — the file was correct
and the running container still had the broken command. Use
`docker compose up -d`, which recreates the container.

**4. Files added to an unmounted path are ephemeral.**
Anything placed inside a container by `docker cp`, or written at runtime to a
path that isn't a volume or bind mount, lives in the container's writable layer
and is destroyed on recreate. It survives `restart`, which makes it look
persistent right up until it isn't.

---

## Scaling notes

The API is stateless, so running N replicas behind a load balancer works —
with two constraints:

- **Every replica needs the identical `JWT_SECRET`** (Phase 2 onward). Tokens
  are signed with it; a replica with a different secret rejects tokens issued
  by its peers, producing intermittent, load-balancer-dependent 401s.
- **Migrations run once, centrally** — not in each replica's startup path.

Postgres is the stateful piece and scales differently (connection pooling, read
replicas, managed service). Note that `create_engine` in
`app/services/database.py` uses SQLAlchemy's default pool settings — worth
revisiting under real concurrency.

---

## The current `Dockerfile` is stale — treat it as the exercise

It was written before Phase 1 and no longer matches the codebase:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./app                                    # <- incomplete
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

What needs addressing:

| Issue | Why it matters |
|---|---|
| `COPY app/ ./app` omits `alembic.ini`, `migrations/` | can't run migrations in the container |
| also omits `scripts/`, `records.csv` | can't run the historic import in the container |
| `DATABASE_URL` still says `localhost` | container can't reach the db service (see trap above) |
| Pins `python:3.11-slim`; dev runs 3.12.3 | version drift between dev and deployed |
| Runs as root | container best practice is a non-root user |
| No `HEALTHCHECK` | the orchestrator can't tell if the app is actually serving |
| `api` service in `docker-compose.yml` is commented out | a `condition: service_healthy` block is already drafted there, ready to uncomment |

The `CMD` line is correct as written — `--host 0.0.0.0` is exactly right.

---

# Deploying the frontend

`crew-logger-app` is an Expo project. `npx expo export --platform web`
produces a **static** site — plain HTML, JS and CSS with no server runtime.
Serving it needs only a static file server; there is no Node process in
production.

## The rule that catches everyone

**A static SPA's API calls are made by the browser, not by the container.**

So this can never work, no matter how correct it looks:

```
EXPO_PUBLIC_API_URL=http://api:8000     # WRONG from a browser
```

`api` is a Docker service name. Docker's DNS resolves it only *inside* the
Docker network — and the browser is outside it, running on the user's machine.
The frontend container never makes the request, so its network view is
irrelevant. The URL must be one the **browser** can reach.

This is the single most common mistake when containerising a SPA, and it fails
confusingly: server-side checks pass, the container starts healthy, and only
the browser's network tab shows what's wrong.

## Two topologies

### A. Reverse proxy — recommended

One web server serves the static build *and* forwards `/api/*` to the API
container:

```
browser ──> nginx ─┬─> static files  (/)
                   └─> proxy_pass    (/api/ -> http://api:8000/)
```

The proxy *is* inside the Docker network, so `http://api:8000` works there —
that's the difference from the browser case above.

Set `EXPO_PUBLIC_API_URL` to the relative path `/api`. Then:

- **No CORS at all** — same origin, so the browser never does a cross-origin
  check. `CORS_ORIGINS` becomes irrelevant.
- **Nothing baked in** — a relative URL is correct in every environment, so one
  build artefact works everywhere.
- One published port instead of two.

Cost: an nginx config to write, and the frontend can't be deployed entirely
independently of the API path.

### B. Separate origins

Frontend and API published on different ports; the browser calls
`http://localhost:8000` (or a real hostname) directly.

- Requires `CORS_ORIGINS` to list the frontend's exact origin — scheme, host
  **and** port. `http://localhost:3000` and `http://127.0.0.1:3000` are
  different origins to a browser.
- **The API URL is baked in at build time.** Expo inlines `EXPO_PUBLIC_*`
  values into the bundle when it builds, so every environment needs its own
  build. This is the real cost, and it's easy to miss until you have more than
  one environment. (Topology A avoids it entirely: a relative `/api` is
  correct everywhere, so one artefact serves all environments.)

## Frontend configuration is build-time, not runtime

The app reads config from `EXPO_PUBLIC_*` environment variables (see
`crew-logger-app/.env.example`):

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend base URL |
| `EXPO_PUBLIC_EMPLOYEE_NUMBER` | Whose entries these are (temporary, until Phase 2 auth) |

**Only `EXPO_PUBLIC_`-prefixed vars reach client code.** `app.json` `extra`
read through `expo-constants` does *not* work here — verified:
`Constants.expoConfig.extra` is `null` on Expo web. An earlier version of this
project used `extra` and the config silently arrived empty.

The build-time part matters for Docker: these values are **inlined into the
static bundle** by `expo export`, so they must be present as environment
variables **in the build stage**, not injected when the container starts.
Changing one means rebuilding the image, not restarting it.

## Build shape

Multi-stage: build with Node, ship without it.

1. **Build stage** — a Node image, `npm ci`, then
   `npx expo export --platform web`. Output lands in `dist/`.
2. **Serve stage** — a static server (nginx or similar) with **only** `dist/`
   copied in. No `node_modules` (434 MB), no source.

`.dockerignore` in `crew-logger-app/` already excludes `node_modules/`,
`.expo/` and `dist/`, so the build context stays small and the image builds
`dist/` fresh rather than copying a stale local one.

A local `dist/` already exists from a prior export, which confirms the export
step works here.

## Running on a phone

Expo Go on a physical device is a third case, and neither topology above
applies — the phone is on your LAN, not on Docker's network and not on your
machine:

1. The API must bind `0.0.0.0`, not `127.0.0.1`. It currently binds loopback
   only, so nothing outside the machine can reach it.
2. `EXPO_PUBLIC_API_URL` must be the machine's **LAN IP** (e.g.
   `http://192.168.1.50:8000`). `localhost` on a phone means the phone.
3. That origin must be in `CORS_ORIGINS`.
