# src/routes/console/profile

Render profile editing for the authenticated console viewer using the profile
remote form.

## Files

### `src/routes/console/profile/+page.svelte`

#### `default`

```typescript
type Props = Record<string, never>;
declare const component: Component<Props>;
export default component;
```

Call the ancestor console `loadLayoutData({ pathname: page.url.pathname })` and
use its name and biography as remote-field rendering/reset defaults. Submit
updateProfile directly and display field issues; the name input is required.
Submission exceptions propagate to the error page.

### `src/routes/console/profile/page.remote.ts`

SvelteKit remote entry point. Validate request inputs and obtain trusted actors
at this boundary; preserve the framework query refresh, form fields,
enhancement, and pending APIs. Pass explicit capabilities to use cases or call
repositories directly for data access.

#### `updateProfile`

```typescript
export declare const updateProfile: RemoteForm<
  {
    name: string;
    aboutMe: string;
  },
  never
>;
```

Require login, nonempty display name, and string aboutMe. Directly call
updateUser with a UpdateUserParams containing only the trusted actor ID, name,
and aboutMe; redirect 303 to /console/profile. No explicit uniqueness precheck
is added. Map PARAMETER_INVALID `name` to a field issue; other errors propagate
to the error page.
