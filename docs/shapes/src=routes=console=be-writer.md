# src/routes/console/be-writer

Render invitation redemption for readers who want author privileges, with form validation and operation feedback.

## Files

### `src/routes/console/be-writer/+page.svelte`

#### `default`

```typescript
declare const component: Component<Record<string, never>>;
export default component;
```

Submit a required inviteCode through FormState(acceptInviteCode); display schema issues and operation errors.

### `src/routes/console/be-writer/page.remote.ts`

SvelteKit remote entry point. Validate request inputs and obtain trusted actors at this boundary; preserve the framework query refresh, form fields, enhancement, and pending APIs. Pass explicit capabilities to use cases or call repositories directly for data access.

#### `acceptInviteCode`

```typescript
export declare const acceptInviteCode: RemoteForm<
  {
    inviteCode: string;
  },
  never
>;
```

Require login and nonempty inviteCode. Call `acceptInviteCode({ db, now }, { actor, code: inviteCode })`, injecting the clock adapter and trusted actor with the submitted code. The use case and repository now consume the code and grant its role atomically, rejecting competing reuse. Redirect 302 to /console/invites?welcome=true only after successful completion.
