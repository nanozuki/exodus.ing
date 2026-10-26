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
declare const component: Component<{ article: ArticleCard }>;
export default component;
```

Render links to the current author profile and article using the supplied public projection; perform no query.

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

Render items in supplied order. When count exceeds ARTICLE_PAGE_SIZE (20), show Pager using pageNumber and the caller’s
pageLink.

### `src/lib/component/ArticleListItem.svelte`

#### `default`

```typescript
interface ArticleHeaderProps {
  article: ArticleListItem;
}

declare const component: Component<ArticleHeaderProps>;
export default component;
```

Render an article link, author, created date, optional direct parent, and positive interaction counts. External records
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

Render supplied article groups and comment text/update timestamps in supplied order. Show Pager when count exceeds
COMMENT_PAGE_SIZE (20), using record count and pageNumber.

### `src/lib/component/Dialog.svelte`

#### `default`

```typescript
interface DialogProps {
  trigger: Snippet;
  content: Snippet;
  open: ReturnType<typeof $bindable<boolean>>;
  dialogProps?: CreateDialogProps;
}

declare const component: Component<DialogProps>;
export default component;
```

Expose two-way open binding with runtime default false and caller-provided trigger/content snippets. Synchronize open
with Melt UI dialog state; portal the overlay/content while open. Without dialogProps, use role=alertdialog. Trigger
actions are supplied by the caller.

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
  name: string;
  username: string;
}

declare const component: Component<UserBadgeProps>;
export default component;
```

Render the display name linked to `/u/@<username>` without encoding or data lookup.

### `src/lib/component/markdown.css`

Import-time stylesheet effect: apply .markdown-scoped typography for headings, paragraphs, lists, quotes, code, images,
and horizontally scrollable tables. Images fill the container width. Nested quote backgrounds alternate through the
explicit nesting levels. Consumers can override --p-margin-top and --p-margin-bottom; colors/fonts use the application
theme tokens. No script exports.
