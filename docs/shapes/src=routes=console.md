# src/routes/console

Guard console navigation for the authenticated viewer and provide role-dependent destinations to child settings pages.

## Files

### `src/routes/console/+layout.server.ts`

#### `load`

```typescript
export declare const load: LayoutServerLoad;
```

Require login, compute permitted console routes, and require exact pathname membership. If not present, redirect 302 to
the first permitted route. Return `{ user: LoggedInUser; routes: ConsoleRoute[] }`.

### `src/routes/console/+layout.svelte`

#### `default`

```typescript
type Props = { children: Snippet; data: { user: LoggedInUser; routes: ConsoleRoute[] } };
declare const component: Component<Props>;
export default component;
```

Render role-filtered navigation with an exact-path active state and the supplied children snippet.

### `src/routes/console/+page.server.ts`

#### `load`

```typescript
export declare const load: PageServerLoad;
```

Await parent data and redirect 301 to its first console route.

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

Provide the fixed route/title entries for profile, bookmarks, account, invites, and becoming a writer.

#### `getConsoleRoutes`

```typescript
export declare function getConsoleRoutes(locals: App.Locals): Promise<ConsoleRoute[]>;
```

Return profile, bookmarks, account in that order, followed by invites for CreateArticle viewers or be-writer for
readers. The async function performs no additional I/O itself.
