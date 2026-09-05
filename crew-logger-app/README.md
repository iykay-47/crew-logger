# Crew Logger (Frontend)

Expo (React Native + TypeScript) app for small field crews to log job entries.
See `CLAUDE.md` for architecture rules and `features/` for what each screen
does. Currently in **Phase 1** — placeholder screens only, no business logic
built yet.

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

## Environment files

None currently. This app has no `.env` file yet — the backend API base URL
(`services/api.ts`) is not wired up to an environment variable at this
phase. When that's added, per `docs/architecture.md` the dev default backend
is `http://localhost:8000`, and any client-readable env var must be prefixed
`EXPO_PUBLIC_` (e.g. `EXPO_PUBLIC_API_URL`) to be visible in the bundled app —
plain env vars are not exposed to client code in Expo.

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
You should see the Dashboard tab with placeholder text, and a bottom tab bar
with Dashboard / New Entry / History / Settings.

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
