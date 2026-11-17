# src/lib/server

Provide runtime composition and request-boundary authentication support. The
registry initializes the database and provider adapters; request helpers manage
cookies, OAuth request data, post-sign-in redirect targets, and locals. Business
operations live in use cases and do not import the registry or request helpers.

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

Default to `process.env`. Require string values for GITHUB_CLIENT_ID,
GITHUB_CLIENT_SECRET, APP_URL, PGHOST, PGPORT, PGUSER, PGPASSWORD, and
PGDATABASE; missing values throw MISSING_CONFIG. Empty strings are accepted.
Convert PGPORT with `Number` without range or NaN validation. No I/O occurs
merely by importing this module.

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
using either binding. Repeated calls replace them without shutting down the
previous pool.

#### `db`

```typescript
export let db: AppDatabase;
```

The application database binding initialized by `buildServices`. Request entry
points pass it explicitly to repository operations and use cases.

#### `adapters`

```typescript
export let adapters: AdapterSet;
```

The adapter set initialized by `buildServices`; uninitialized before successful
startup. Network calls occur only when adapter methods are invoked.

### `src/lib/server/auth.ts`

Provide shared request adaptation used only by hooks, remote functions, and
route handlers. This module may use SvelteKit cookies/request events and runtime
mode; models and use cases must not import it. Importing it performs no
database, network, or cookie operation.

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
export function setAuthCookie(
  cookies: Cookies,
  session: { token: string; expiresAt: Date },
): void;
```

Set `auth_session` to the session token with `/` path, HTTP-only flag, lax
same-site, supplied expiry, and production-only secure flag.

#### `sanitizeNext`

```typescript
export function sanitizeNext(next: string | undefined, appUrl: string): string;
```

Return the absolute redirect target for a post-sign-in `next` value: `appUrl`'s
origin followed by `next` when `next` starts with `/`, and by `/` otherwise,
including absent or empty values. The leading `/` ends the URL authority, so no
`next` value changes the host: `//evil.example` and `/a/..//evil.example` stay
paths on the app origin, while `@evil.example` and `https://evil.example` become
`/`. `next` is not otherwise normalized or validated. Callers pass the
configured `APP_URL`, not the request URL, whose origin depends on the `Host`
the request arrived with. Every redirect to a user-supplied `next` uses this
helper.

#### `createGitHubAuthUrl`

```typescript
export function createGitHubAuthUrl(
  cookies: Cookies,
  githubOAuth: GitHubOAuth,
  input: OAuthCookieDataInput,
): URL;
```

Generate OAuth state through Arctic, combine it with supplied transport data,
and set JSON `github_oauth_state` at `/` with HTTP-only, lax same-site,
production-only secure, and ten-minute max age. Return the adapter's
authorization URL for that state. This helper owns the cookie; the adapter
receives only the state value.

#### `readGitHubCallbackData`

```typescript
export function readGitHubCallbackData(request: RequestEvent): {
  code: string;
  data: OAuthCookieData;
};
```

Read and then delete `github_oauth_state` before any validation, so the state
cookie is removed whether the callback succeeds or fails, including later
provider-exchange failures. Read callback `code` and `state`, require the state
cookie, parse and validate it, and require an exact state match. Missing fields,
missing cookie, schema-invalid cookie, or mismatched state produce the
established BAD_REQUEST messages. Malformed cookie JSON propagates its parse
error to the route's error normalization. This helper does not exchange provider
credentials or sanitize `next`.

#### `attachLocals`

```typescript
export function attachLocals(event: RequestEvent): Promise<void>;
```

At the request boundary, read the `auth_session` token and call the
session-validation use case with the registry database and `now` from
`adapters/clock.ts`. When the result requests a refresh, rewrite the cookie with
the same token and the renewed expiry. Then load user and roles concurrently
through repository functions. Set the existing `App.Locals` API with nullable
logged-in user, `requireLoggedInUser`, `hasPermission`, and `requirePermission`;
preserve UNAUTHORIZED and FORBIDDEN operation labels. Missing/invalid sessions
or absent users produce a null user. Invalid cookies are not deleted here.
Errors propagate through the existing hook/route behavior.
