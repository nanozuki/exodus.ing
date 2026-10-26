# src/routes/console/account

Render account identity and a confirm/cancel username-edit dialog using the authenticated console layout data.

## Files

### `src/routes/console/account/+page.svelte`

#### `default`

```typescript
type Props = { data: { user: LoggedInUser; routes: ConsoleRoute[] } };
declare const component: Component<Props>;
export default component;
```

Display username and GitHub ID. Open a bindable dialog to edit username, provide cancel without submission, and submit
updateUsername with field issues and operation error feedback. FormState closes the dialog after fulfilled submission.
