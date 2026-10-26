# src/routes

Render the shared application shell, homepage article list, and application error page. Server loaders provide viewer
identity and homepage pagination; data operations remain in remotes.

## Files

### `src/routes/+error.svelte`

#### `default`

```typescript
declare const component: Component<Record<string, never>>;
export default component;
```

Use `$app/state.page` to show the HTTP status, tagged Chinese title, and message when an error exists; otherwise show
the unknown-error text. No explicit component props.

### `src/routes/+layout.server.ts`

#### `load`

```typescript
export declare const load: LayoutServerLoad;
```

Return `{ user: locals.loggedInUser }` for all descendant pages. No additional database query occurs in the loader.

### `src/routes/+layout.svelte`

#### `default`

```typescript
type Props = { children: Snippet; data: { user: LoggedInUser | null } };
declare const component: Component<Props>;
export default component;
```

Import the application stylesheet, request Google Fonts through head links, and render the shared header plus children.
Show a navigation spinner while navigating. Signed-in viewers get their profile link; visitors get an encoded current
path/query/hash as the authentication next destination.

### `src/routes/+page.server.ts`

#### `load`

```typescript
export declare const load: PageServerLoad;
```

Parse the page query parameter with parseInt and fall back to 1 for absent, invalid, or zero values. Negative values
survive parsing; the article remote subsequently rejects values below 1. Return `{ page: number }`.

### `src/routes/+page.svelte`

#### `default`

```typescript
type Props = { data: { user: LoggedInUser | null; page: number } };
declare const component: Component<Props>;
export default component;
```

Await listArticles(data.page), render the list/pager with `?page=<n>` links, and display the current empty-state text
when items is empty. Set EXODUS title and homepage social metadata.
