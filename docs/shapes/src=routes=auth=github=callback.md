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
`loginWithGitHub({ db, now, generateSessionId }, { githubUser, signUp })`,
injecting the clock and session-ID adapter functions with the trusted provider
identity and signup hints. That use case handles account lookup/creation and
session creation. Set the auth cookie with `setAuthCookie`, then respond 302 to
next when it starts with `/`, otherwise `/`. This accepts protocol-relative
URLs. Let failures propagate unchanged to SvelteKit default error handling; no
catch-and-rethrow conversion or custom error hook is added. User creation and
session creation are not one transaction.
