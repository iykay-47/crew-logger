# Crew Logger (Frontend)

Expo (React Native + TypeScript) app for small field crews to log job entries.
See `CLAUDE.md` for architecture rules and `features/` for what each screen
does.

**Dashboard and History are built** — they show summary totals and the trip
list, read-only, fetched from `crew-logger-api`. New Entry and Settings are
still placeholders, and there is no login yet.

**The API must be running** for either screen to show anything. See the root
[`README.md`](../README.md) for starting everything together.

## Requirements

- **Node.js** — no version is pinned in this repo (no `.nvmrc`/`engines`
  field), but it was scaffolded and verified against **Node 24.19.0**. If you
  don't have npm/npx available system-wide, install a version via
  [nvm](https://github.com/nvm-sh/nvm):
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install --lts
  ```
- **npm** (bundled with the Node install above) — this project uses npm, not
  yarn/pnpm (`package-lock.json` is the lockfile).
- No native Android/iOS SDKs are required to run in web or Expo Go mode.

## Configuration

Config lives in `.env` (copy `.env.example`). Expo exposes **only** vars
prefixed `EXPO_PUBLIC_` to client code — `app.json` `extra` via `expo-constants`
does not populate on web in this setup (verified: `Constants.expoConfig.extra`
is `null` there). The dev server reads `.env` at bundle time, so **restart it
after changing these**.

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend base URL |
| `EXPO_PUBLIC_EMPLOYEE_NUMBER` | Whose entries these are (temporary; Phase 2 auth replaces it with the JWT identity) |

`EXPO_PUBLIC_API_URL` per environment:

| Running where | Value |
|---|---|
| Browser on this machine | `http://localhost:8000` (default) |
| Phone via Expo Go | `http://<this-machine's-LAN-IP>:8000` |
| Behind a reverse proxy | `/api` — same origin, so no CORS |

**Running on a physical phone needs two more things:** the API must bind
`0.0.0.0` instead of `127.0.0.1` (it currently binds loopback only, so nothing
off this machine can reach it), and that origin must be listed in the API's
`CORS_ORIGINS`. `localhost` on a phone means the phone itself.

Note this value is **inlined into the bundle at build time**, so a static web
build is tied to whatever URL it was built with — one reason the reverse-proxy
setup is easier to deploy. See [`../docs/deployment.md`](../docs/deployment.md).

## Start-up

```bash
npm install        # if you haven't already (create-expo-app runs this once for you)
npx expo start      # opens the Metro/dev server
```

Then:
- press `w` to open in a browser, or
- scan the QR code with the Expo Go app on a phone, or
- press `a` / `i` for an Android/iOS simulator (requires the respective SDK).

### Verify it's working
```bash
npx tsc --noEmit    # type-check
npx expo start --web
curl -sf http://localhost:8081 >/dev/null && echo OK
```

With the API running, the Dashboard shows all-time / weekly / per-month
totals, and History lists every trip newest-first.

If instead you see **"Couldn't load data — Can't reach the API"**, the backend
isn't running. Start it (see the root README) and press *Try again*.

Note `npx tsc --noEmit` reports one pre-existing error in
`components/ExternalLink.tsx`, which came from the Expo starter template. It
doesn't affect the running app — Metro strips types with Babel rather than
`tsc`.

## Project structure

- `app/` — Expo Router screens: `(tabs)/` for the main navigation, `(auth)/`
  for login/signup.
- `components/` — reusable UI (currently placeholder stubs).
- `services/` — all HTTP calls to the backend (`crew-logger-api`). Screens
  never call `fetch` directly.
- `types/index.ts` — all shared TypeScript types.
- `features/` — one spec file per feature, with a phase and a definition-of-
  done checklist. Read the relevant file before building a feature.
- `docs/` — data model and architecture reference.

## Notes

- Do not add npm packages without checking `CLAUDE.md` — the project rule is
  to ask first.
- This app never talks to Postgres directly; all data flows through
  `crew-logger-api` over HTTP.
