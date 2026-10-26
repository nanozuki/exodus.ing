# src/routes/a/[articleId]

Render article detail, direct article responses, comments, and viewer-specific interaction controls. Remote operations
own reads and authorization; components preserve independent form instances and direct-parent links.

## Files

### `src/routes/a/[articleId]/+page.svelte`

#### `default`

```typescript
type Props = { data: { user: LoggedInUser | null }; params: { articleId: string } };
declare const component: Component<Props>;
export default component;
```

Derive articleId reactively from params and start detail, direct-response, comment, and bookmark-status queries. Render
Markdown HTML or the external-content notice/link, article social metadata, author-only edit links, responses, and
comments. Independent top/bottom bookmark form keys prevent form-state sharing; live query identity follows navigation.

### `src/routes/a/[articleId]/BookmarkBadge.svelte`

#### `default`

```typescript
type BookmarkProps = {
  articleId: string;
  key: string;
  status: BookmarkStatus;
};

declare const component: Component<BookmarkProps>;
export default component;
```

Use `operateArticleBookmark.for(key)` so callers can render independent form instances. Submit add/remove according to
status, include articleId, and display current bookmark state and positive count. Permission/authentication belongs to
the remote.

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
created timestamp. The remote owns write authorization.

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

Show `/a/<article.id>/edit` only when a user exists and its ID matches article.authorId. This visibility condition does
not replace the server editor guard.

### `src/routes/a/[articleId]/Replies.svelte`

#### `default`

```typescript
type Props = {
  articleId: string;
  replies: ArticleCard[];
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

Render title, author link, created date, optional direct-parent attribution, and optional children snippet for
caller-supplied actions.
