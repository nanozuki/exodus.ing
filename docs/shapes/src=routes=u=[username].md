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

React to params.username and query-string tab/page; clamp page to at least 1. Await loadPageData, render the
sanitized biography and selected list, and preserve `tab`, `page`, and #list-top in navigation. Readers have only
comments; writers can switch tabs. Show console and logout actions only to the profile owner, plus new-article
navigation when that owner is a writer. Render collection-specific empty states.

### `src/routes/u/[username]/page.remote.ts`

SvelteKit remote entry point. Validate request inputs and obtain trusted actors at this boundary; preserve the framework query refresh, form fields, enhancement, and pending APIs. Pass explicit capabilities to use cases or call repositories directly for data access.

Supporting nonexported types used in `loadPageData`:

```typescript
type Tab = 'articles' | 'comments';
type ListData = { tabs: Tab[] } & (
  | { tab: 'articles'; articles: Paginated<ArticleListItem> }
  | { tab: 'comments'; comments: Paginated<CommentListItem> }
);
```

#### `logout`

```typescript
export declare const logout: RemoteForm<void, never>;
```

Delete auth_session at / and redirect 303 to /. Preserve existing behavior: the database session remains valid. This form is owned by the user profile page, its only current consumer.

#### `loadPageData`

```typescript
export declare const loadPageData: RemoteQueryFunction<
  {
    username: string;
    tab?: string | undefined;
    page?: number | undefined;
  },
  {
    user: {
      aboutMe: VFileValue;
      id: string;
      username: string;
      githubId: number | null;
      name: string;
      verifyCode: string;
    };
    listData: ListData;
    isMyself: boolean;
    isWriter: boolean;
  }
>;
```

Resolve @username by exact username and other strings by user ID (including the repository legacy-ID rule), or throw NOT_FOUND. Compose user/role repositories, shared permission checks, Markdown presentation, tabs, pagination, and viewer flags directly in this page remote. Writers get articles/comments and default to articles unless tab is exactly comments; readers get only comments. Validate page >= 1 and default to 1. Keep pageSize = 20 private to this remote function, pass it when loading the selected collection, and retain the effective pageSize in the paginated result. Preserve the existing public output fields, including githubId and verifyCode.
