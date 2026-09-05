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
