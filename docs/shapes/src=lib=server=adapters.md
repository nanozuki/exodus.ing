# src/lib/server/adapters

Provide request-independent GitHub OAuth, DNS TXT lookup, clock, and session-ID
capabilities. Request parsing, OAuth state-cookie validation, and session
cookies belong to `src/lib/server/auth.ts`; account and session decisions belong
to use cases. Adapters do not import SvelteKit request/cookie types.

## Files

### `src/lib/server/adapters/github_auth.ts`

#### `GitHubUser`

```typescript
export type GitHubUser = {
  id: number;
  username: string;
};
```

#### `GitHubOAuth`

```typescript
export class GitHubOAuth {
  constructor(config: Config);
  createAuthUrl(state: string): URL;
  getUser(code: string): Promise<GitHubUser>;
}
```

Construct the GitHub client using configured credentials and
`${appUrl}/auth/github/callback`. `createAuthUrl` builds authorization with the
supplied state and no scopes. `getUser` exchanges the supplied code, fetches
`https://api.github.com/user` with the access token and existing headers, and
maps provider id/login to GitHubUser. Preserve existing error mapping:
OAuth2RequestError becomes BAD_REQUEST; other failures in the exchange/fetch
block become INTERNAL_SERVER_ERROR. HTTP status/provider JSON validation remain
as before. Neither method reads/writes cookies or inspects a request.
`OAuthResult` is removed because request transport and provider identity no
longer share an adapter result.

### `src/lib/server/adapters/index.ts`

#### `createAdapterSet`

```typescript
export function createAdapterSet(config: Config): {
  githubOAuth: GitHubOAuth;
  name_resolver: { resolveTxt: typeof resolveTxt };
};
```

Construct a fresh GitHubOAuth instance and expose shared DNS lookup;
construction performs no provider or DNS request.

#### `AdapterSet`

```typescript
export type AdapterSet = ReturnType<typeof createAdapterSet>;
```

### `src/lib/server/adapters/name_resolver.ts`

#### `resolveTxt`

```typescript
export function resolveTxt(domain: string): Promise<string[]>;
```

Fetch Cloudflare DNS-over-HTTPS at
`https://1.1.1.1/dns-query?name=<domain>&type=TXT` with
`accept: application/dns-json`. DNS Status 3 (nonexistent domain) returns `[]`;
other nonzero statuses and unsuccessful HTTP responses throw EXTERNAL_API_ERROR.
Return each answer's raw `data`, or `[]` when Answer is absent. Transport/JSON
failures propagate. TXT chunk/unquote handling and answer-type filtering are
unchanged.

### `src/lib/server/adapters/session_id.ts`

#### `generateSessionId`

```typescript
export function generateSessionId(): string;
```

Generate a 32-character session identifier from
`0123456789abcdefghijklmnopqrstuvwxyz` using Nano ID, preserving the existing
session-code generator's behavior. Request entry points inject this capability
into session/account use cases. No identifier is generated merely by importing
the module.

### `src/lib/server/adapters/clock.ts`

#### `now`

```typescript
export function now(): Date;
```

Return the current time as a new `Date`. Request entry points import this
capability and supply it as `deps.now` to operations that need the current time.
Use cases read it once when related decisions need the same instant. Importing
the module does not read the clock.
