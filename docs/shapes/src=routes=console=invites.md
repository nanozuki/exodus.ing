# src/routes/console/invites

Render invitation quota, unused codes, inviter, and invitees for authors, including creation, deletion, and copy
controls.

## Files

### `src/routes/console/invites/+page.svelte`

#### `default`

```typescript
declare const component: Component<Record<string, never>>;
export default component;
```

Await getConsoleInviteData({}). Show optional welcome text, inviter relationship, quota, unused codes, and invitees.
Offer creation only for positive quota. Delete by submitted code; copy via navigator.clipboard and mark the last copied
code. Clipboard failures are not handled locally. Remotes refresh the projection after writes.
