# src/routes

Render the shared application shell, homepage article list, and application
error page. Layout and page remote queries supply viewer identity and homepage
data. Components call these queries directly; there are no page/layout load
functions or inherited loader data in this application.

Page/layout query arguments explicitly carry route and search values needed for
their result. Read trusted actor/session data from request locals. Initial
rendering awaits queries during SSR; client rendering uses reactive query
arguments. Loader `data`, `parent()`, and implicit URL dependencies do not form
part of this contract.

## Files

### `src/routes/+error.svelte`

#### `default`

```typescript
declare const component: Component<Record<string, never>>;
export default component;
```

Use `$app/state.page` to show the HTTP status, tagged Chinese title, and message
when an error exists; otherwise show the unknown-error text. No explicit
component props.

### `src/routes/+layout.svelte`

#### `default`

```typescript
type Props = { children: Snippet };
declare const component: Component<Props>;
export default component;
```

Call `loadLayoutData()` from the adjacent layout remote and render the viewer
returned by that query. Import the application stylesheet, request Google Fonts
through head links, and render the shared header plus children. Show a
navigation spinner while navigating. Signed-in viewers pass the returned user to
UserBadge for their profile link; visitors get an encoded current
path/query/hash as the authentication next destination. No loader `data` prop is
consumed.

### `src/routes/+page.svelte`

#### `default`

```typescript
type Props = Record<string, never>;
declare const component: Component<Props>;
export default component;
```

Reactively pass the current `page` search-parameter string (or null) to
`loadPageData`. Render its article page with `?page=<n>` links and the existing
empty state. Set EXODUS title and homepage social metadata. Initial rendering
awaits the query on the server; client pagination updates the query argument.

### `src/routes/page.remote.ts`

#### `loadPageData`

```typescript
export declare const loadPageData: RemoteQueryFunction<
  { page: string | null },
  { page: number; articles: Paginated<ArticleListItem> }
>;
```

Parse the supplied URL value with the existing parseInt behavior; absent,
invalid, or zero values default to 1. Reject negative values through the
existing minimum-page validation. Keep pageSize = 20 private to this remote
function, pass it to `listArticles`, and return the parsed page together with
its articles, including the effective pageSize. Input parsing and page
composition belong here; no use-case wrapper is introduced. The explicit
argument controls query identity on navigation.

### `src/routes/layout.remote.ts`

#### `loadLayoutData`

```typescript
export declare const loadLayoutData: RemoteQueryFunction<
  void,
  { user: LoggedInUser | null }
>;
```

Return the viewer from trusted request locals, or null for anonymous requests.
The hook has already validated the session and handled cookie renewal; this read
query does not write cookies. The root layout and descendant consumers may call
the same query and share its framework cache; it is not a module-global user
cache. Viewer-sensitive pages may consume this ancestor layout query directly
without loader `data` or `parent()`.

After a mutation changes the active session, profile, username, or roles, obtain
viewer-dependent query results through a fresh request. Preserve default
remote-form invalidation on those redirecting mutations, or explicitly refresh
active queries from the client when custom enhancement replaces that behavior.
Do not refresh this query from stale same-request locals after changing the
stored user or role. OAuth returns use a fresh document request. Each protected
remote and use case still performs its own required authorization; cached layout
data is presentation state, not proof of permission.
