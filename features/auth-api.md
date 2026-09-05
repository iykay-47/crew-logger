# Auth API

## What it does
Authentication endpoints for crew member login.

## Endpoints
- POST /auth/login — accepts employee_number or username + password, returns JWT token
- POST /auth/register — creates a new user account (admin only in future)
- GET /auth/me — returns current user info from token

## Login logic
1. Receive identifier + password
2. Check if identifier matches any employee_number in users table
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
- [ ] POST /auth/login accepts employee_number or username and returns JWT on success
- [ ] Login rejects invalid credentials with generic error
- [ ] POST /auth/register creates a user with hashed password
- [ ] GET /auth/me returns user info from valid token
- [ ] Invalid or expired tokens return 401 on protected routes
- [ ] Passwords are never visible in logs, responses, or database
