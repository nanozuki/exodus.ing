# src/routes/auth

Render separate registration and login forms using GitHub OAuth and preserve the
requested return destination.

For remote request adaptation, follow the
[request-boundary conventions](../architecture.md#request-boundaries-and-remote-functions).

## Files

### `src/routes/auth/+page.svelte`

#### `default`

```typescript
declare const component: Component<Record<string, never>>;
export default component;
```

Read optional next from the current URL. Submit independent registration and
login remote forms directly, using remote-field attributes for optional signup
username/name and hidden next values. Display signup field issues; submission
exceptions propagate to the error page. Show simulated-login navigation only
when PROD is false; the remote independently checks its environment.

### `src/routes/auth/page.remote.ts`

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

Trim optional username/name and treat blank results as absent. Call
validateSignUp for prefix/duplicate checks, then preserve nonempty next and
optional signup fields through createGitHubAuthUrl in the server auth request
helper. Redirect 302 to GitHub. Preflight uniqueness reads do not reserve
identities; OAuth cookies remain request adaptation. Map PARAMETER_INVALID
`username` and `name` to field issues; other errors propagate to the error page.

#### `loginByGithub`

```typescript
export declare const loginByGithub: RemoteForm<
  {
    next?: string | undefined;
  },
  never
>;
```

Preserve a nonempty optional next value in OAuth state through
createGitHubAuthUrl, then redirect 302 to the provider. No local user is created
here.
