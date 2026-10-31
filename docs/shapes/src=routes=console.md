# src/routes/console

Guard console navigation for the authenticated viewer and provide role-dependent
destinations to child settings pages.

## Files

### `src/routes/console/+layout.svelte`

#### `default`

```typescript
type Props = { children: Snippet };
declare const component: Component<Props>;
export default component;
```

Reactively call `loadLayoutData({ pathname: page.url.pathname })` from the
adjacent layout remote. Await its guarded result before rendering the
role-filtered navigation and child snippet; keep exact-path active state. Child
settings pages may call this same ancestor query with the same pathname to share
the result.

### `src/routes/console/routes.ts`

#### `ConsoleRoute`

```typescript
export type ConsoleRoute = {
  route: string;
  title: string;
};
```

#### `consoleRoutes`

```typescript
export const consoleRoutes = {
  profile: { route: '/console/profile', title: '个人资料' },
  bookmarks: { route: '/console/bookmarks', title: '收藏' },
  account: { route: '/console/account', title: '账户' },
  invites: { route: '/console/invites', title: '邀请' },
  beWriter: { route: '/console/be-writer', title: '成为作者' },
};
```

#### `getConsoleRoutes`

```typescript
export declare function getConsoleRoutes(user: LoggedInUser): ConsoleRoute[];
```

Return profile, bookmarks, account in that order, followed by invites for
CreateArticle viewers or be-writer for readers. Calculate permissions from the
supplied roles through the shared model function. This synchronous presentation
helper has no request-context or external dependency.

### `src/routes/console/layout.remote.ts`

#### `loadLayoutData`

```typescript
export declare const loadLayoutData: RemoteQueryFunction<
  { pathname: string },
  { user: LoggedInUser; routes: ConsoleRoute[] }
>;
```

Require the authenticated user from request locals with the existing settings
operation label. Compute the permitted routes from that user and require exact
membership of the supplied pathname. Redirect 302 to the first permitted route
when absent; otherwise return user and routes. `pathname` is validated request
input used for navigation presentation, never an authorization credential.
Changing it changes query identity, including navigation within an already
mounted console layout. Protected operations still enforce permissions
independently.

This query redirects both the `/console` index and disallowed console pages.
After identity or role changes, refresh viewer/menu state according to the
[root layout query's invalidation contract](src=routes.md).

### `src/routes/console/+page.svelte`

#### `default`

```typescript
declare const component: Component<Record<string, never>>;
export default component;
```

Keep `/console` as a page route with no application content. The awaited console
layout query owns its redirect to the first permitted destination.
