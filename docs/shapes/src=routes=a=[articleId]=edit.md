# src/routes/a/[articleId]/edit

Guard article creation/editing and render the selected Markdown or external-link editor, preserving reply context.
Remotes own publication writes and final redirects.

## Files

### `src/routes/a/[articleId]/edit/+page.server.ts`

#### `load`

```typescript
export declare const load: PageServerLoad;
```

Require CreateArticle. Treat route ID new as creation; otherwise load the article and reject nonownership as FORBIDDEN.
Return user, optional articleId/replyToId, and contentType parsed only as markdown/external or null. A reply target is
not validated by this loader; child queries/repository operations resolve it.

### `src/routes/a/[articleId]/edit/+page.svelte`

#### `default`

```typescript
type Props = {
  data: {
    user: LoggedInUser;
    articleId: string | undefined;
    replyToId: string | undefined;
    contentType: ArticleContentType | null;
  };
};
declare const component: Component<Props>;
export default component;
```

Load existing content and optional parent card through remote queries. Prefer stored contentType over the URL choice.
Offer Markdown/external selection for a new unselected type, preserving replyTo in links. Markdown uses a bindable
editor and hidden articleId/replyToId/content fields; validation disables publication. External mode delegates to
ExternalArticleForm.

### `src/routes/a/[articleId]/edit/ExternalArticleForm.svelte`

#### `default`

```typescript
type Props = {
  articleId?: string;
  replyToId?: string;
  article?: ArticleContent;
  user: LoggedInUser;
};

declare const component: Component<Props>;
export default component;
```

Initialize remote URL/title fields from the initial article once using untrack. Submit articleId/replyToId via hidden
fields and display field/form errors. Derive hostname from current URL input, tolerating parse failures, and show the
current user’s required TXT record. Publication verifies DNS through the remote; this component performs no DNS request.

### `src/routes/a/[articleId]/edit/MarkdownEditor.svelte`

#### `default`

```typescript
interface Props {
  content?: ReturnType<typeof $bindable<string>>;
  onValidateChange?: (valid: boolean) => void;
  onTitleChange?: (title: string) => void;
}

declare const component: Component<Props>;
export default component;
```

Expose optional bindable content with default empty string, validation callback, and title callback. Compile source with
a 500ms debounce through runed resource. Toggle editing/preview, show extracted title and sanitized markup, and display
compilation issues. Effects notify callbacks from current issues/title; the initial fallback has no issues until a
compilation result is available. Rejection behavior is owned by the resource library and is unverified here.
