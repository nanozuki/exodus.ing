# src/lib/server

Read runtime configuration, construct global repository/adapter services, and attach session-derived authorization
helpers to request locals. The hooks initialize and use these services.

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

### `src/lib/server/registry.ts`

#### `buildServices`

```typescript
export declare function buildServices(): Promise<void>;
```

Read configuration, construct the database and both service sets, then assign the exported bindings. Await before
request consumers access them; repeated calls replace the bindings. No pool shutdown is exposed.

#### `repositories`

```typescript
export declare let repositories: RepositorySet;
```

An exported mutable binding populated by `buildServices`; it is uninitialized at runtime before successful startup.

#### `adapters`

```typescript
export declare let adapters: AdapterSet;
```

An exported mutable binding populated by `buildServices`; it is uninitialized at runtime before successful startup.

#### `attachLocals`

```typescript
export declare function attachLocals(event: RequestEvent): Promise<void>;
```

Read `auth_session`, validate/renew it through the session repository, refresh its cookie when requested, and load user
plus roles concurrently. Replace `event.locals` with `loggedInUser`, `requireLoggedInUser`, `hasPermission`, and
`requirePermission`. Missing/invalid sessions yield a null user; absent users also yield null. Authorization helpers
throw UNAUTHORIZED or FORBIDDEN with the caller’s operation label. Invalid cookies are not deleted here; database and
cookie failures propagate.
