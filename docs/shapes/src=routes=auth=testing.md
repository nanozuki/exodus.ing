# src/routes/auth/testing

Render the development/test simulated-login selector. Both remote operations
reject when PROD is true and MODE is not test.

For remote request adaptation, follow the
[request-boundary conventions](../architecture.md#request-boundaries-and-remote-functions).

## Files

### `src/routes/auth/testing/+page.svelte`

#### `default`

```typescript
declare const component: Component<Record<string, never>>;
export default component;
```

Await loadPageData and show each returned user as a submit button with roles.
Pass next through when it starts with `/`, otherwise `/`. Submit the remote form
directly, using remote-field attributes for hidden next and each userId submit
button. The remote performs environment enforcement; submission exceptions
propagate to the error page.

### `src/routes/auth/testing/page.remote.ts`

#### `loadPageData`

```typescript
export declare const loadPageData: RemoteQueryFunction<
  void,
  {
    users: {
      id: string;
      username: string;
      name: string;
      roles: Role[];
    }[];
  }
>;
```

Compose getUsers with concurrent getRolesOfUser calls to list every stored user
with their roles.

#### `simulateTestingLogin`

```typescript
export declare const simulateTestingLogin: RemoteForm<
  {
    userId: string;
    next?: string | undefined;
  },
  never
>;
```

Require a nonempty userId, find the user or throw NOT_FOUND, and call
`createSession({ db, now, generateSessionId }, { userId })` using the clock and
session-ID adapter functions. Set its cookie through the server auth request
helper. Redirect 303 to next when it starts with /, otherwise /. Preserve the
existing string-prefix behavior, including protocol-relative values.
