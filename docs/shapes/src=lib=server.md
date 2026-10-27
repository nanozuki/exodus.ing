# src/lib/server

Provide runtime composition and request-boundary authentication support. The
registry initializes the database and provider adapters; request helpers manage
cookies, OAuth request data, and locals. Business operations live in use cases
and do not import the registry or request helpers.

## Files

### `src/lib/server/config.ts`

#### `Config`

```typescript
export type Config = {
  githubClientId: string;
  githubClientSecret: string;
  appUrl: string;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    enableChannelBinding: boolean;
  };
};
```

#### `getConfig`

```typescript
export declare function getConfig(env?: NodeJS.ProcessEnv): Config;
```

Default to `process.env`. Require string values for GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, APP_URL, PGHOST, PGPORT,
PGUSER, PGPASSWORD, and PGDATABASE; missing values throw MISSING_CONFIG. Empty strings are accepted. Convert PGPORT with
`Number` without range or NaN validation. No I/O occurs merely by importing this module.

Read optional PGCHANNELBINDING: `prefer` and `require` enable the driver's
best-effort channel binding; other values, including `disable` and an unset
variable, leave it disabled. `require` does not enforce channel binding: the
driver may fall back when the server does not offer it.

### `src/lib/server/registry.ts`

#### `buildServices`

```typescript
export function buildServices(): Promise<void>;
```

Read configuration, construct the database through `src/lib/server/db` and the
adapter set, and assign the exported bindings. Await successful startup before
using either binding. Repeated calls replace them, matching the current lifecycle;
this refactor does not add pool shutdown behavior.

#### `db`

```typescript
export let db: AppDatabase;
```

The application database binding initialized by `buildServices`. Request entry
points pass it explicitly to repository operations and use cases. No global
repository instances or repository-set factory remain.

#### `adapters`

```typescript
export let adapters: AdapterSet;
```

The adapter set initialized by `buildServices`; uninitialized before successful
startup. Network calls occur only when adapter methods are invoked.

### `src/lib/server/auth.ts`

Provide shared request adaptation used only by hooks, remote functions, and route
handlers. This module may use SvelteKit cookies/request events and runtime mode;
models and use cases must not import it. Importing it performs no database,
network, or cookie operation.

#### `AUTH_COOKIE_NAME`

```typescript
export const AUTH_COOKIE_NAME = 'auth_session';
```

#### `OAuthCookieData`

```typescript
export type OAuthCookieData = {
  state: string;
  next?: string;
  signUp?: { username?: string; name?: string };
};
```

Validated request transport data stored in the GitHub state cookie. Keep its Zod
schema private because validation belongs exclusively to this request helper.

#### `OAuthCookieDataInput`

```typescript
export type OAuthCookieDataInput = Omit<OAuthCookieData, 'state'>;
```

#### `setAuthCookie`

```typescript
export function setAuthCookie(cookies: Cookies, session: Session): void;
```

Set `auth_session` with the session ID, `/` path, HTTP-only flag, supplied expiry,
and production-only secure flag. Preserve existing cookie behavior; no new
same-site option is introduced.

#### `createGitHubAuthUrl`

```typescript
export function createGitHubAuthUrl(cookies: Cookies, githubOAuth: GitHubOAuth, input: OAuthCookieDataInput): URL;
```

Generate OAuth state through Arctic, combine it with supplied transport data,
and set JSON `github_oauth_state` at `/` with HTTP-only, lax same-site,
production-only secure, and ten-minute max age. Return the adapter's authorization
URL for that state. This helper owns the cookie; the adapter receives only the
state value.

#### `readGitHubCallbackData`

```typescript
export function readGitHubCallbackData(request: RequestEvent): {
  code: string;
  data: OAuthCookieData;
};
```

Read callback `code` and `state`, require the state cookie, parse and validate it,
and require an exact state match. Preserve existing BAD_REQUEST messages for
missing fields, missing cookie, schema-invalid cookie, or mismatched state.
As currently implemented, malformed cookie JSON propagates its parse error to the
route's error normalization. This helper neither exchanges provider credentials
nor deletes the state cookie on success.

#### `attachLocals`

```typescript
export function attachLocals(event: RequestEvent): Promise<void>;
```

At the request boundary, read `auth_session` and call the session-validation use
case with the registry database and `now` from `adapters/clock.ts`. Refresh the cookie only when the
returned session requests it, then load user and roles concurrently through
repository functions. Set the existing `App.Locals` API with nullable logged-in
user, `requireLoggedInUser`, `hasPermission`, and `requirePermission`; preserve
UNAUTHORIZED and FORBIDDEN operation labels. Missing/invalid sessions or absent
users produce a null user. Invalid cookies are not deleted here. Errors propagate
through the existing hook/route behavior.
