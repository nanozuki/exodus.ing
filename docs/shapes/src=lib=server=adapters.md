# src/lib/server/adapters

Provide GitHub OAuth and DNS TXT lookup capabilities. OAuth state and cookies belong here; account creation and session
persistence belong to their request handlers and repositories.

## Files

### `src/lib/server/adapters/github_auth.ts`

#### `GitHubUser`

```typescript
export type GitHubUser = {
  id: number;
  username: string;
};
```

#### `OAuthResult`

```typescript
export type OAuthResult = {
  user: GitHubUser;
  data: OAuthCookieData;
};
```

#### `GitHubOAuth`

```typescript
export declare class GitHubOAuth {
  constructor(config: Config);
  createAuthUrl(cookies: Cookies, input: OAuthCookieDataInput): URL;
  handleCallback(request: RequestEvent): Promise<OAuthResult>;
}
```

Construct the GitHub client using configured credentials and `${appUrl}/auth/github/callback`. `createAuthUrl` sets the
JSON `github_oauth_state` cookie at `/` with HTTP-only, lax same-site, production-only secure, and a ten-minute max age,
then requests authorization with no scopes. `handleCallback` requires code, state, a schema-valid cookie, and matching
state; it exchanges the code and fetches GitHub identity. OAuth2RequestError becomes BAD_REQUEST and errors inside the
provider-exchange block become INTERNAL_SERVER_ERROR. Cookie JSON parsing occurs before that block and can throw
directly. HTTP status and provider JSON shape are not explicitly checked. The state cookie remains after success.

### `src/lib/server/adapters/index.ts`

#### `createAdapterSet`

```typescript
export declare function createAdapterSet(config: Config): {
  githubOAuth: GitHubOAuth;
  name_resolver: {
    resolveTxt: typeof resolveTxt;
  };
};
```

Construct a fresh GitHubOAuth instance and expose the shared `resolveTxt` function under `name_resolver`. Construction
performs no provider or DNS request.

#### `AdapterSet`

```typescript
export type AdapterSet = ReturnType<typeof createAdapterSet>;
```

### `src/lib/server/adapters/name_resolver.ts`

#### `resolveTxt`

```typescript
export declare function resolveTxt(domain: string): Promise<string[]>;
```

Fetch Cloudflare DNS-over-HTTPS at `https://1.1.1.1/dns-query?name=<domain>&type=TXT` with
`accept: application/dns-json`. A nonzero DNS Status throws EXTERNAL_API_ERROR. Return each answer’s raw `data`, or `[]`
when Answer is absent. Transport/JSON failures propagate; the function does not join TXT chunks, unquote records,
validate HTTP status, or filter answer types.
