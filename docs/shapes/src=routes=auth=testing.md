# src/routes/auth/testing

Render the development/test simulated-login selector; its remote operations enforce environment restrictions.

## Files

### `src/routes/auth/testing/+page.svelte`

#### `default`

```typescript
declare const component: Component<Record<string, never>>;
export default component;
```

Await loadPageData and show each returned user as a submit button with roles. Pass next through when it starts with
`/`, otherwise `/`. Submit through FormState; the remote performs environment enforcement.

### `src/routes/auth/testing/page.remote.ts`

SvelteKit remote entry point. Validate request inputs and obtain trusted actors at this boundary; preserve the framework query refresh, form fields, enhancement, and pending APIs. Pass explicit capabilities to use cases or call repositories directly for data access.

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

Reject when PROD is true and MODE is not test. Otherwise getUsers and concurrent getRolesOfUser calls supply every stored user's id, username, name, and roles. Environment gating and page projection stay at this remote boundary.

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

Use the same environment restriction. Require a nonempty userId, find the user or throw NOT_FOUND, and call `createSession({ db, now, generateSessionId }, { userId })` using the clock and session-ID adapter functions. Set its cookie through the server auth request helper. Redirect 303 to next when it starts with /, otherwise /. Preserve the existing string-prefix behavior, including protocol-relative values.
