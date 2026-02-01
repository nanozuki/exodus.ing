# Auth Design Plan

## Goals
- Single "Register/Log In" entry
- Support multiple providers linked to one user
- Defer passkey (WebAuthn) support for now
- Avoid creating users by mistake
- Allow editing username/name after creation

## Data Model

### user_auth
Stores provider credentials linked to a user.

Key fields:
- id (text, PK)
- user_id (text, FK to user)
- provider (text, e.g. "github", "google", "passkey")
- provider_user_id (text, provider-specific unique id)
- provider_username (text, optional)
- provider_email (text, optional)
- created_at (timestamp)

Constraints:
- unique(provider, provider_user_id)
- index(user_id)

### pending_auth
Stores short-lived, pre-user auth state (OAuth) until the user confirms profile.

Key fields:
- id (text, PK)
- auth_type (text, currently "oauth")
- state (text, OAuth state; nullable)
- provider (text, nullable)
- provider_user_id (text, nullable)
- provider_username (text, nullable)
- provider_email (text, nullable)
- payload (jsonb, extra data; nullable)
- next (text, redirect target; nullable)
- sign_up_username (text, draft username; nullable)
- sign_up_name (text, draft name; nullable)
- created_at (timestamp)
- expires_at (timestamp)

Constraints:
- unique(state)
- index(expires_at)

## Flow Overview

### Unified Entry: /auth
- Show "Register/Log In" with provider buttons.
- Optional fields for username/name are collected here or on the completion step.

### OAuth Start
- Generate OAuth state.
- Store only state in cookie (CSRF).
- Redirect to provider.

### OAuth Callback
- Validate state using cookie.
- Fetch provider user info.
- If provider account already linked to a user: log in.
- If user is already logged in: link provider to current user.
- Otherwise: create pending_auth row and redirect to /auth/complete.

### /auth/complete
- Load pending_auth by id or state.
- Collect or confirm username/name.
- Re-validate uniqueness and format.
- Create user and link provider in user_auth.
- Delete pending_auth row.

### Regret / Switch Provider
- "Choose another method" deletes pending_auth and returns to /auth.

## Routes And APIs

### GET /auth
- Renders unified entry with provider buttons and optional username/name fields.

### POST /auth/oauth/:provider/start
- Body: next?, sign_up_username?, sign_up_name?
- Action: create OAuth state, set state cookie, redirect to provider.

### GET /auth/oauth/:provider/callback
- Query: code, state
- Action:
  - validate state cookie
  - exchange code for tokens and fetch provider user
  - if provider already linked: log in
  - if user is logged in: link provider to current user
  - else create pending_auth row and redirect to /auth/complete?pending_id=...

### GET /auth/complete
- Query: pending_id
- Action: load pending_auth, render completion form.

### POST /auth/complete
- Body: pending_id, username, name
- Action:
  - re-validate username/name
  - create user
  - link provider in user_auth
  - delete pending_auth
  - set session cookie

### POST /auth/switch
- Body: pending_id
- Action: delete pending_auth and redirect to /auth.

## Security Notes
- Do not trust client data for sign_up fields; always re-validate before creating user.
- Clear OAuth state cookie after callback.
- Keep pending_auth TTL short (10-15 minutes).
- Consider rate limits for completion attempts.

## Cleanup
- Periodic job to delete expired pending_auth rows.
- Option A: cron job calling a cleanup endpoint.
- Option B: scheduled worker/cron in deployment platform.
- Option C: on-demand cleanup (delete expired rows on read).

## Error Handling And Edge Cases
- Missing/expired pending_id: redirect to /auth with a message.
- OAuth state mismatch: hard fail and clear state cookie.
- Provider user already linked to another account: block and instruct user to log in.
- Username/name collision on completion: show validation error and keep pending_auth.
- Logged-in user attempts to start new auth: link provider instead of creating new user.
- Next URL not safe: fall back to "/".

## Sequence Steps

### OAuth New User
1) GET /auth
2) POST /auth/oauth/github/start
3) Provider consent
4) GET /auth/oauth/github/callback
5) Create pending_auth and redirect /auth/complete
6) GET /auth/complete
7) POST /auth/complete
8) Create user, link provider, set session, redirect next

### OAuth Existing User
1) GET /auth
2) POST /auth/oauth/github/start
3) Provider consent
4) GET /auth/oauth/github/callback
5) Find user_auth, set session, redirect next

### OAuth Link To Logged-In User
1) Logged-in user opens /auth
2) POST /auth/oauth/github/start
3) Provider consent
4) GET /auth/oauth/github/callback
5) Link provider in user_auth, redirect back
