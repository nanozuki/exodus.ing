# src/routes/a/[articleId]/edit

Guard article creation/editing and render the selected Markdown or external-link editor, preserving reply context.
Remotes own publication writes and final redirects.

## Files

### `src/routes/a/[articleId]/edit/+page.svelte`

#### `default`

```typescript
type Props = { params: { articleId: string } };
declare const component: Component<Props>;
export default component;
```

Reactively call `loadPageData` with the route article ID and explicit replyTo/contentType search values. Use its user, optional editable article, parent summary, resolved content type, and identifiers. Await server authorization before rendering editing controls. Offer Markdown/external selection for a new unselected type and preserve reply links. Markdown uses its bindable editor and hidden fields; external mode delegates to ExternalArticleForm. No inherited loader data or separate initial article-content/summary queries remain.

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

### `src/routes/a/[articleId]/edit/page.remote.ts`

SvelteKit remote entry point. Validate request inputs and obtain trusted actors at this boundary; preserve the framework query refresh, form fields, enhancement, and pending APIs. Pass explicit capabilities to use cases or call repositories directly for data access.

#### `loadPageData`

```typescript
export declare const loadPageData: RemoteQueryFunction<
  { articleId: string; replyTo: string | null; contentType: string | null },
  {
    user: LoggedInUser;
    articleId: string | undefined;
    replyToId: string | undefined;
    contentType: ArticleContentType | null;
    article: ArticleContent | undefined;
    replyTo: ArticleSummary | undefined;
  }
>;
```

Require CreateArticle from trusted request locals. Treat route ID `new` as creation; otherwise call `getEditableArticle({ db }, { actor, articleId })` to enforce authorship and obtain the stored article. Map its editable content directly, avoiding a second article read. Preserve FORBIDDEN for another author's editor and NOT_FOUND for missing records. Resolve a nonempty supplied replyTo to its required ArticleSummary; missing reply targets retain NOT_FOUND. Stored content type wins for edits; for new articles recognize only markdown/external, otherwise null. The query receives all route/search values explicitly, validates them, and derives the actor only from locals. It also enforces access when invoked directly without the layout. Return all initial editor data without redirecting on success.

#### `createOrUpdateMarkdownArticle`

```typescript
export declare const createOrUpdateMarkdownArticle: RemoteForm<
  {
    content: string;
    articleId?: string | undefined;
    replyToId?: string | undefined;
  },
  never
>;
```

Require CreateArticle permission and nonempty source. Pass the trusted actor and input to saveMarkdownArticle with the database. Map an unsuccessful result's first Markdown issue to the existing PARAMETER_INVALID content feedback. On success, redirect 303 to the saved article ID. Business compilation, ownership decisions, and persistence orchestration live in the use case. Updating does not change or verify the stored content type.

### `src/routes/a/[articleId]/edit/ExternalArticleForm.remote.ts`

SvelteKit remote entry point. Validate request inputs and obtain trusted actors at this boundary; preserve the framework query refresh, form fields, enhancement, and pending APIs. Pass explicit capabilities to use cases or call repositories directly for data access.

#### `createOrUpdateExternalArticle`

```typescript
export declare const createOrUpdateExternalArticle: RemoteForm<
  {
    url: string;
    title: string;
    articleId?: string | undefined;
    replyToId?: string | undefined;
  },
  never
>;
```

Require CreateArticle, a valid URL, and a string title (the schema still accepts an empty title). Parse the URL and pass that parsed value with its exact original string, trusted actor, and other fields to saveExternalArticle. Map an unverified-domain result to existing PARAMETER_INVALID URL feedback. On success redirect 303 to the saved ID. DNS verification and ownership decisions live in the use case; no linked page is fetched and existing content types are not changed.
