# src/routes/console/profile

Render profile editing for the authenticated console viewer using the profile remote form.

## Files

### `src/routes/console/profile/+page.svelte`

#### `default`

```typescript
type Props = { data: { user: LoggedInUser; routes: ConsoleRoute[] } };
declare const component: Component<Props>;
export default component;
```

Initialize name and biography from layout user data and submit updateProfile. Display field issues and caught form
errors; the name input is required.
