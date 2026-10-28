# src/lib/component

Provide reusable Svelte presentation, form, dialog, and pagination components. Consumers supply projections and
callbacks; persistence and authorization belong to callers.

## Files

### `src/lib/component/Action.svelte`

#### `default`

```typescript
type BaseActionProps = {
  ['class']?: string;
  processing?: boolean;
  children: Snippet;
};
type ActionProps =
  | ({
      element: 'a';
    } & BaseActionProps &
      HTMLAnchorAttributes)
  | ({
      element: 'button';
    } & BaseActionProps &
      HTMLButtonAttributes);

declare const component: Component<ActionProps>;
export default component;
```

Render an anchor or button according to the discriminant, forward remaining HTML attributes/events, merge classes, and
render the children snippet. processing changes colors only; it does not disable interaction.

### `src/lib/component/ArticleCard.svelte`

#### `default`

```typescript
declare const component: Component<{ article: ArticleSummary }>;
export default component;
```

Render links to the current author profile and article using the supplied ArticleSummary. Pass its nested author UserSummary to UserBadge; perform no query.

### `src/lib/component/ArticleList.svelte`

#### `default`

```typescript
interface Props {
  ['class']?: string;
  articles: Paginated<ArticleItem>;
  pageLink: (page: number) => string;
}

declare const component: Component<Props>;
export default component;
```

Render items in supplied order. When count exceeds the returned pageSize, show Pager using the paginated result’s count, pageSize, and pageNumber and the caller’s pageLink.

### `src/lib/component/ArticleListItem.svelte`

#### `default`

```typescript
interface ArticleHeaderProps {
  article: ArticleListItem;
}

declare const component: Component<ArticleHeaderProps>;
export default component;
```

Render an article link, author, created date, optional direct parent, and positive interaction counts. Pass article.author and any direct parent’s author UserSummary to UserBadge. External records
also show a separate original-URL link opening with noopener/noreferrer.

### `src/lib/component/Button.svelte`

#### `default`

```typescript
type Variant = 'normal' | 'primary' | 'danger' | 'accent';
interface ButtonProps extends HTMLButtonAttributes {
  variant?: Variant;
  pending?: number;
  children: Snippet;
}

declare const component: Component<ButtonProps>;
export default component;
```

Default variant to normal and pending to zero. Disable when pending > 0 or the passed disabled attribute is true; set
aria-busy from pending. Forward other button attributes and event callbacks.

### `src/lib/component/ButtonLink.svelte`

#### `default`

```typescript
type Variant = 'normal' | 'primary' | 'danger' | 'accent' | 'disabled';
interface ButtonLinkProps extends HTMLAnchorAttributes {
  variant?: Variant;
  children: Snippet;
}

declare const component: Component<ButtonLinkProps>;
export default component;
```

Render an anchor with the selected variant (default normal), children, merged classes, and forwarded HTML
attributes/events. The disabled variant changes styling only; callers control href and aria-disabled.

### `src/lib/component/CommentList.svelte`

#### `default`

```typescript
interface Props {
  ['class']?: string;
  comments: Paginated<CommentListItem>;
  pageLink: (page: number) => string;
}

declare const component: Component<Props>;
export default component;
```

Render supplied article groups and comment text/update timestamps in supplied order. Show Pager when count exceeds the returned pageSize, using the paginated result’s count, pageSize, and pageNumber.

### `src/lib/component/Dialog.svelte`

#### `default`

```typescript
interface DialogProps {
  trigger: Snippet;
  content: Snippet<[close: () => void]>;
  labelledby: string;
}

declare const component: Component<DialogProps>;
export default component;
```

Own the trigger button, custom overlay, native modal dialog, and Melt open state. The trigger snippet supplies
button content only. labelledby identifies the heading supplied in content. Pass close to the content snippet. Closing through the snippet callback, Escape, or an
outside click restores trigger focus. Reopening starts with fresh content rather than discarded edits. Use ordinary
dialog semantics; no externally bound open state or Melt-specific configuration is exposed.

### `src/lib/component/Input.svelte`

#### `default`

```typescript
interface Props extends HTMLInputAttributes {
  label: string;
  description?: string;
  error?: string;
  issues?: RemoteFormIssue[];
}

declare const component: Component<Props>;
export default component;
```

Forward standard input attributes and events, bind value both ways, and render label, optional description/error, and
supplied issue messages. A supplied name is used for the label’s for attribute; an ID is not synthesized. issues is
optional in the declared props; its omitted-value behavior was not separately exercised.

### `src/lib/component/InputTextArea.svelte`

#### `default`

```typescript
interface Props extends HTMLTextareaAttributes {
  label: string;
  description?: string;
  error?: string;
  issues?: RemoteFormIssue[];
  addition?: Snippet;
}

declare const component: Component<Props>;
export default component;
```

Bind value both ways, forward standard textarea attributes/events, and render label, optional description/error,
supplied issue messages, and an optional addition snippet. issues is optional in the declared props; its omitted-value
behavior was not separately exercised.

### `src/lib/component/Loading.svelte`

#### `default`

```typescript
declare const component: Component<Record<string, never>>;
export default component;
```

Render a CSS-animated spinner without component props or application I/O. The --size custom property controls
width/height and defaults to --spacing-l.

### `src/lib/component/Logo.svelte`

#### `default`

```typescript
declare const component: Component<Record<string, never>>;
export default component;
```

Render the inline EXODUS SVG mark without props or I/O. --size controls dimensions and defaults to --spacing-l; its path
uses --color-text.

### `src/lib/component/Markdown.svelte`

#### `default`

```typescript
interface MarkdownProps {
  markup: string;
}

declare const component: Component<MarkdownProps>;
export default component;
```

Import markdown.css and insert supplied markup as raw HTML inside .markdown. Sanitization belongs to the upstream
compiler; this component does not sanitize or escape the markup.

### `src/lib/component/Pager.svelte`

#### `default`

```typescript
interface Props {
  count: number;
  pageSize: number;
  page: number;
  siblingCount?: number;
  pageLink: (page: number) => string;
}

declare const component: Component<Props>;
export default component;
```

Compute total pages with ceil(count/pageSize), use one-based page, and default siblingCount to 1. Always include page 1,
include the last page when distinct, and shift the sibling window at boundaries with ellipsis markers. Use pageLink for
destinations; omit href and set aria-disabled for unavailable previous/next links. No runtime range or zero-size
validation is added.

### `src/lib/component/UserBadge.svelte`

#### `default`

```typescript
interface UserBadgeProps {
  user: UserSummary;
}

declare const component: Component<UserBadgeProps>;
export default component;
```

Render user.name linked to `/u/@<user.username>` without encoding or data lookup. Accept the shared UserSummary projection from article authors, invitation relations, or a fuller User/LoggedInUser value; display requires no additional user lookup.

### `src/lib/component/markdown.css`

Import-time stylesheet effect: apply .markdown-scoped typography for headings, paragraphs, lists, quotes, code, images,
and horizontally scrollable tables. Images fill the container width. Nested quote backgrounds alternate through the
explicit nesting levels. Consumers can override --p-margin-top and --p-margin-bottom; colors/fonts use the application
theme tokens. No script exports.
