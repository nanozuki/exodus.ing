# src/routes/auth

Render separate registration and login forms using GitHub OAuth and preserve the requested return destination.

## Files

### `src/routes/auth/+page.svelte`

#### `default`

```typescript
declare const component: Component<Record<string, never>>;
export default component;
```

Read optional next from the current URL. Submit independent registration and login forms through FormState, with
optional signup username/name and issue feedback. Show simulated-login navigation only when PROD is false; the remote
independently checks its environment.

### `src/routes/auth/page.remote.ts`

SvelteKit remote entry point. Validate request inputs and obtain trusted actors at this boundary; preserve the framework query refresh, form fields, enhancement, and pending APIs. Pass explicit capabilities to use cases or call repositories directly for data access.

#### `registerByGithub`

```typescript
export declare const registerByGithub: RemoteForm<
  {
    next?: string | undefined;
    username?: string | undefined;
    name?: string | undefined;
  },
  never
>;
```

Trim optional username/name and treat blank results as absent. Call validateSignUp for prefix/duplicate checks, then preserve nonempty next and optional signup fields through createGitHubAuthUrl in the server auth request helper. Redirect 302 to GitHub. Preflight uniqueness reads do not reserve identities; OAuth cookies remain request adaptation.

#### `loginByGithub`

```typescript
export declare const loginByGithub: RemoteForm<
  {
    next?: string | undefined;
  },
  never
>;
```

Preserve a nonempty optional next value in OAuth state through createGitHubAuthUrl, then redirect 302 to the provider. No local user is created here.
