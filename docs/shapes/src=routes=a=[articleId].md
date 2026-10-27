# src/routes/a/[articleId]

Render article detail, direct article responses, comments, and viewer-specific interaction controls. Remote operations
adapt requests and delegate business authorization to use cases; components preserve independent form instances and direct-parent links.

## Files

### `src/routes/a/[articleId]/+page.svelte`

#### `default`

```typescript
type Props = {
  params: { articleId: string };
};
declare const component: Component<Props>;
export default component;
```

Derive articleId reactively from params. Call `loadPageData({ articleId })` for article detail and responses, the root `loadLayoutData()` for viewer state, and the component-owned comment/bookmark queries in parallel. Render
Markdown HTML or the external-content notice/link, article social metadata, author-only edit links, responses, and
comments. Independent top/bottom bookmark form keys prevent form-state sharing; live query identity follows navigation.

### `src/routes/a/[articleId]/BookmarkBadge.svelte`

#### `default`

```typescript
type BookmarkProps = {
  articleId: string;
  key: string;
  status: BookmarkState;
};

declare const component: Component<BookmarkProps>;
export default component;
```

Use `operateArticleBookmark.for(key)` so callers can render independent form instances. Submit remove only when status.bookmarked is true; false and anonymous null submit add. Include articleId and display the current bookmark state and positive count. The status.articleId must match the articleId prop. Permission/authentication belongs to the remote.

### `src/routes/a/[articleId]/CommentBadge.svelte`

#### `default`

```typescript
interface CommentBadgeProps {
  count: number;
}

declare const component: Component<CommentBadgeProps>;
export default component;
```

Render the comment action and positive count. Observed destination is #reply-section, the article-response section,
rather than #comment-section; the current destination targets the article-response section.

### `src/routes/a/[articleId]/Comments.svelte`

#### `default`

```typescript
type CommentsProps = {
  articleId: string;
  comments: CommentView[];
  user: User | null;
};

declare const component: Component<CommentsProps>;
export default component;
```

Render #comment-section and stable #comment-<id> anchors. Signed-in viewers can compose/reply, and only the comment
author sees edit controls. Replying selects the direct target, clears editing/content, and focuses/scrolls the input;
editing loads the existing content. Cancel and successful submission reset local state. Anonymous viewers get an encoded
return destination. Display comment text line-by-line without HTML interpretation, parent attribution, author, and
created timestamp. Pass each comment’s author and any direct parent’s author UserSummary to UserBadge. The remote owns write authorization.

### `src/routes/a/[articleId]/EditBadge.svelte`

#### `default`

```typescript
interface EditBadgeProps {
  user: User | null;
  article: Article;
}

declare const component: Component<EditBadgeProps>;
export default component;
```

Show `/a/<article.id>/edit` only when a user exists and its ID matches article.author.id. This visibility condition does
not replace the server editor guard.

### `src/routes/a/[articleId]/Replies.svelte`

#### `default`

```typescript
type Props = {
  articleId: string;
  replies: ArticleSummary[];
  user: LoggedInUser | null;
};

declare const component: Component<Props>;
export default component;
```

Render direct responses in supplied order under #reply-section. Authors get `/a/new/edit?replyTo=<id>`; readers get
author-onboarding guidance; visitors get sign-in with the reply editor retained as next. Author permission is checked
with userHasPermission.

### `src/routes/a/[articleId]/ReplyBadge.svelte`

#### `default`

```typescript
interface ReplyBadgeProps {
  count: number;
}

declare const component: Component<ReplyBadgeProps>;
export default component;
```

Render an action to #reply-section with a positive direct-response count when nonzero.

### `src/routes/a/[articleId]/Title.svelte`

#### `default`

```typescript
type Props = {
  article: ArticleDetail;
  children?: Snippet;
};

declare const component: Component<Props>;
export default component;
```

Render title, author link, created date, optional direct-parent attribution, and optional children snippet for caller-supplied actions. Pass article.author and any direct parent’s author UserSummary to UserBadge.

### `src/routes/a/[articleId]/page.remote.ts`

SvelteKit remote entry point. Validate request inputs and obtain trusted actors at this boundary; preserve the framework query refresh, form fields, enhancement, and pending APIs. Pass explicit capabilities to use cases or call repositories directly for data access.

#### `ArticleDetail`

```typescript
export interface ArticleDetail extends Article {
  markup: string;
}
```

Article-page presentation result. Markdown source is compiled into sanitized
markup and its display title; external articles retain their stored title and use
empty markup. Consumers import this type from the owning page remote.

#### `loadPageData`

```typescript
export declare const loadPageData: RemoteQueryFunction<
  { articleId: string },
  { article: ArticleDetail; replies: ArticleSummary[] }
>;
```

Validate the explicit route ID and combine detail with direct article responses. Preserve the existing detail lookup's six-character conversion for exactly 16-character legacy IDs; the replies lookup keeps the supplied ID as before. Compile Markdown into sanitized markup and its H1 display title; external articles retain their stored title and empty markup. Unknown content types throw INTERNAL_SERVER_ERROR and missing details retain NOT_FOUND. ArticleDetail belongs to this page remote. Comments and bookmark state remain independently refreshable queries owned by their components.

### `src/routes/a/[articleId]/BookmarkBadge.remote.ts`

SvelteKit remote entry point. Validate request inputs and obtain trusted actors at this boundary; preserve the framework query refresh, form fields, enhancement, and pending APIs. Pass explicit capabilities to use cases or call repositories directly for data access.

#### `getArticleBookmarkStatus`

```typescript
export declare const getArticleBookmarkStatus: RemoteQueryFunction<string, BookmarkState>;
```

Call getBookmarkStateOfArticle directly with the database and GetBookmarkStateOfArticleParams containing articleId and the current viewer’s optional userId. Return BookmarkState with the articleId, actual bookmark-row count, and bookmarked state; anonymous viewers receive bookmarked=null.

#### `operateArticleBookmark`

```typescript
export declare const operateArticleBookmark: RemoteForm<
  {
    action: 'add' | 'remove';
    articleId: string;
  },
  {
    success: boolean;
  }
>;
```

Accept add/remove and a string articleId. Anonymous submissions redirect 303 to /auth?next=/a/<id>. Signed-in submissions call createBookmark with CreateBookmarkParams or deleteBookmark with DeleteBookmarkParams, both scoped to the viewer. createBookmark returns the updated BookmarkState and deleteBookmark returns void; refresh the status query after either mutation and return success=true. Preserve duplicate-add behavior; deleting a missing bookmark no longer decrements stored counters, as required by repository consistency.

### `src/routes/a/[articleId]/Comments.remote.ts`

SvelteKit remote entry point. Validate request inputs and obtain trusted actors at this boundary; preserve the framework query refresh, form fields, enhancement, and pending APIs. Pass explicit capabilities to use cases or call repositories directly for data access.

#### `CommentView`

```typescript
export type CommentView = Comment & { replyTo?: Comment };
```

Comment presentation with its direct reply target attached when present in the
loaded article's comments. Missing targets leave `replyTo` undefined. Consumers
import this type from the owning component remote.

#### `listCommentsOfArticle`

```typescript
export declare const listCommentsOfArticle: RemoteQueryFunction<string, CommentView[]>;
```

Read all article comments in creation order through getCommentsOfArticle. Attach each non-root comment's direct parent when found in the same result; otherwise leave replyTo undefined. CommentView and this display composition belong to Comments.remote.ts.

#### `postComment`

```typescript
export declare const postComment: RemoteForm<
  {
    content: string;
    articleId?: string | undefined;
    commentId?: string | undefined;
    replyToId?: string | undefined;
  },
  never
>;
```

Require a signed-in actor and nonempty content. Pass input and trusted actor to saveComment. Use its returned article/comment IDs to refresh this component's comments query and redirect 303 to /a/<article>#comment-<comment>. Ownership decisions and create/edit persistence orchestration live in the use case. No new cross-article reply restriction is introduced.
