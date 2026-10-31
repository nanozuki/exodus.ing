# src/routes/console/be-writer

Render invitation redemption for readers who want author privileges, with form
validation and operation feedback.

## Files

### `src/routes/console/be-writer/+page.svelte`

#### `default`

```typescript
declare const component: Component<Record<string, never>>;
export default component;
```

Submit a required inviteCode through acceptInviteCode directly, using its field
attributes and displaying field issues. Submission exceptions propagate to the
error page.

### `src/routes/console/be-writer/page.remote.ts`

Apply the
[request-boundary conventions](../architecture.md#request-boundaries-and-remote-functions)
to this remote entry point.

#### `acceptInviteCode`

```typescript
export declare const acceptInviteCode: RemoteForm<
  {
    inviteCode: string;
  },
  never
>;
```

Require login and nonempty inviteCode. Call
`acceptInviteCode({ db, now }, { actor, code: inviteCode })`, injecting the
clock adapter and trusted actor with the submitted code. The use case and
repository consume the code and grant its role atomically, rejecting competing
reuse. After redemption, reload the actor's roles and set the shared viewer
query explicitly; avoid globally refreshing the old reader-only route while
redirecting. Redirect 302 to /console/invites?welcome=true only after successful
completion. Map PARAMETER_INVALID `inviteCode` to a field issue; other errors
propagate to the error page.
