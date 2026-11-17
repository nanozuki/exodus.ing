# src/routes/auth/github/callback

Complete GitHub sign-in or account creation, persist a session, set its
authentication cookie, and return to the requested destination.

## Files

### `src/routes/auth/github/callback/+server.ts`

#### `GET`

```typescript
export declare function GET(request: RequestEvent): Promise<Response>;
```

Read and validate callback request/state data with `readGitHubCallbackData`,
then obtain the trusted provider identity through
`adapters.githubOAuth.getUser(code)`. Call
`loginWithGitHub({ db, now, random }, { githubUser, signUp })`, injecting the
clock and random adapters with the trusted provider identity and signup hints.
That use case handles account lookup/creation and session creation. Set the auth
cookie with `setAuthCookie`, then respond 302 to
`sanitizeNext(next, getConfig().appUrl)`. Let failures propagate unchanged to
SvelteKit default error handling; the state cookie is already deleted on every
path by `readGitHubCallbackData`. User and session creation do not share a
transaction.
