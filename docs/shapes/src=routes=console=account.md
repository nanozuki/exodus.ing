# src/routes/console/account

Render account identity and a confirm/cancel username-edit dialog using the
authenticated console layout query.

## Files

### `src/routes/console/account/+page.svelte`

#### `default`

```typescript
type Props = Record<string, never>;
declare const component: Component<Props>;
export default component;
```

Call the ancestor console `loadLayoutData({ pathname: page.url.pathname })` and
display its user's username and GitHub ID. Use an internally controlled dialog
to edit username, provide cancel without submission, and submit updateUsername
directly with remote-field attributes, the current username as the
rendering/reset default, and field issues. Submission exceptions propagate to
the error page. A local attachment preserves initial native-submission feedback
and resets the HTML form on subsequent dialog-content mounts, clearing discarded
field values and issues without moving focus. Successful submission navigates to
the updated profile; the dialog ends with the page. The trigger snippet supplies
button content; cancellation uses the content snippet’s close callback.

### `src/routes/console/account/page.remote.ts`

Apply the
[request-boundary conventions](../architecture.md#request-boundaries-and-remote-functions)
to this remote entry point.

#### `updateUsername`

```typescript
export declare const updateUsername: RemoteForm<
  {
    username: string;
  },
  never
>;
```

Require login and nonempty username. Call updateUsername use case with the
trusted actor and exact submitted value, then redirect 301 to /u/@<username>.
The use case owns prefix rejection and unchanged-value no-op behavior; no
trimming, broader character restriction, or uniqueness precheck is added. Map
PARAMETER_INVALID `username` to a field issue; other errors propagate to the
error page.
