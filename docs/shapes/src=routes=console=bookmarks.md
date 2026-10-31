# src/routes/console/bookmarks

Render the current user’s paginated saved articles and an empty state using the
authenticated article remote.

## Files

### `src/routes/console/bookmarks/+page.svelte`

#### `default`

```typescript
declare const component: Component<Record<string, never>>;
export default component;
```

Parse current URL page and clamp to at least 1, await `loadPageData({ page })`,
and render the list/pager or the no-bookmarks message. Links preserve page
through the query string.

### `src/routes/console/bookmarks/page.remote.ts`

Apply the
[request-boundary conventions](../architecture.md#request-boundaries-and-remote-functions)
to this remote entry point.

#### `loadPageData`

```typescript
export declare const loadPageData: RemoteQueryFunction<
  { page: number },
  { articles: Paginated<ArticleListItem> }
>;
```

Require a signed-in viewer and page >= 1. Keep pageSize = 20 private to this
remote function, pass it to `listBookmarkedArticlesOfUser`, and return
`{ articles }` with its effective pageSize. The supplied page participates in
query identity.
