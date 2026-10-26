# src/routes/u/[username]

Render public writer or reader profiles, preserve selected collection and pagination in the URL, and show owner-only
account actions.

## Files

### `src/routes/u/[username]/+page.svelte`

#### `default`

```typescript
type Props = { params: { username: string } };
declare const component: Component<Props>;
export default component;
```

React to params.username and query-string tab/page; clamp page to at least 1. Await getUserPageData, render the
sanitized biography and selected list, and preserve `tab`, `page`, and #list-top in navigation. Readers have only
comments; writers can switch tabs. Show console and logout actions only to the profile owner, plus new-article
navigation when that owner is a writer. Render collection-specific empty states.
