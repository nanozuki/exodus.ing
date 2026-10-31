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

Apply the
[request-boundary conventions](../architecture.md#request-boundaries-and-remote-functions)
to this remote entry point.

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
updateUser with an UpdateUserParams object containing only the trusted actor ID,
name, and aboutMe; redirect 303 to /console/profile. No explicit uniqueness
precheck is added. Map PARAMETER_INVALID `name` to a field issue; other errors
propagate to the error page.
