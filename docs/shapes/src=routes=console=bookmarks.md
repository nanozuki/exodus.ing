# src/routes/console/bookmarks

Render the current user’s paginated saved articles and an empty state using the authenticated article remote.

## Files

### `src/routes/console/bookmarks/+page.svelte`

#### `default`

```typescript
declare const component: Component<Record<string, never>>;
export default component;
```

Parse current URL page and clamp to at least 1, await listBookmarkedArticles, and render the list/pager or the
no-bookmarks message. Links preserve page through the query string.
