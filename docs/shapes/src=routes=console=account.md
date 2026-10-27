# src/routes/console/account

Render account identity and a confirm/cancel username-edit dialog using the authenticated console layout query.

## Files

### `src/routes/console/account/+page.svelte`

#### `default`

```typescript
type Props = Record<string, never>;
declare const component: Component<Props>;
export default component;
```

Call the ancestor console `loadLayoutData({ pathname: page.url.pathname })` and display its user's username and GitHub ID. Open a bindable dialog to edit username, provide cancel without submission, and submit
updateUsername with field issues and operation error feedback. FormState closes the dialog after fulfilled submission.

### `src/routes/console/account/page.remote.ts`

SvelteKit remote entry point. Validate request inputs and obtain trusted actors at this boundary; preserve the framework query refresh, form fields, enhancement, and pending APIs. Pass explicit capabilities to use cases or call repositories directly for data access.

#### `updateUsername`

```typescript
export declare const updateUsername: RemoteForm<
  {
    username: string;
  },
  never
>;
```

Require login and nonempty username. Call updateUsername use case with the trusted actor and exact submitted value, then redirect 301 to /u/@<username>. The use case owns prefix rejection and unchanged-value no-op behavior; no trimming, broader character restriction, or uniqueness precheck is added.
