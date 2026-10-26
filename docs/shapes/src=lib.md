# src/lib

Provide tagged application errors and Markdown compilation shared by server operations, remotes, and components. Storage
and request orchestration belong to their owning directories.

## Files

### `src/lib/errors.ts`

#### `ErrorValue`

```typescript
export type ErrorValue = {
  BAD_REQUEST: string;
  PARAMETER_INVALID: Record<string, string>;
  FORBIDDEN: {
    operation: string;
  };
  UNAUTHORIZED: {
    operation: string;
  };
  NOT_FOUND: {
    resource: string;
  };
  INTERNAL_SERVER_ERROR: string;
  DATABASE_ERROR: {
    operation: string;
    cause: string;
  };
  MISSING_CONFIG: {
    item: string;
  };
  EXTERNAL_API_ERROR: {
    operation: string;
    message: string;
  };
};
```

#### `ErrorTag`

```typescript
export type ErrorTag = keyof ErrorValue;
```

#### `errorTagTitle`

```typescript
export declare const errorTagTitle: {
  [Tag in ErrorTag]: string;
};
```

Map every error tag to its Chinese UI title. The record is exported and mutable.

#### `AppError`

```typescript
export interface AppError<Tag extends keyof ErrorValue> {
  tag: Tag;
  value: ErrorValue[Tag];
  code: number;
  message: string;
}
```

#### `createError`

```typescript
export declare function createError<Tag extends ErrorTag>(tag: Tag, value: ErrorValue[Tag]): AppError<Tag>;
```

Produce `{ tag, value, code, message }`. BAD_REQUEST/PARAMETER_INVALID map to 400, UNAUTHORIZED to 401, FORBIDDEN to
403, NOT_FOUND to 404, EXTERNAL_API_ERROR to 502, and the remaining tags to 500. Messages are built from the
tag-specific values.

#### `throwAppError`

```typescript
export declare function throwAppError<Tag extends ErrorTag>(appError: AppError<Tag>): never;
```

Throw via SvelteKit `error` using the application error’s code and structured body.

#### `throwError`

```typescript
export declare function throwError<Tag extends ErrorTag>(tag: Tag, value: ErrorValue[Tag]): never;
```

Construct the tagged application error and throw it through `throwAppError`.

#### `isHttpError`

```typescript
export declare function isHttpError(e: unknown): e is HttpError;
```

Use a structural check for a non-null object with numeric `status` and non-null object `body`; the body’s
application-error fields are not validated.

#### `catchError`

```typescript
export declare function catchError(e: unknown): AppError<ErrorTag>;
```

Return the body of a structurally recognized HTTP error unchanged. Log ordinary `Error` objects and convert them to
INTERNAL_SERVER_ERROR with their message. Log and rethrow non-Error values.

### `src/lib/markdown.ts`

Supporting types and declarations used by the public signatures below (not additional exports):

```typescript
type IssueMessage = {
  title: string;
  description: string;
};
```

#### `compileMarkdown`

```typescript
export declare const compileMarkdown: (content: string) => Promise<Value>;
```

Return an empty string for empty input; otherwise parse Markdown, YAML frontmatter, GFM and raw HTML, sanitize through
the default rehype policy, and serialize HTML. Does not remove an article title. Parser/processor failures reject.

#### `MarkdownArticleIssue`

```typescript
export declare enum MarkdownArticleIssue {
  MissingTitle = 'MissingTitle',
}
```

#### `articleIssueMessages`

```typescript
export declare const articleIssueMessages: Record<MarkdownArticleIssue, IssueMessage>;
```

MissingTitle reports “缺少标题” and explains “标题为第一个一级标题”. The exported record is mutable.

#### `throwArticleIssue`

```typescript
export declare function throwArticleIssue(issue: MarkdownArticleIssue, field: string): never;
```

Throw PARAMETER_INVALID for the named field, using the issue’s title from `articleIssueMessages`.

#### `CompiledArticle`

```typescript
export type CompiledArticle = {
  markup: string;
  title: string;
  issues: MarkdownArticleIssue[];
};
```

#### `compileArticle`

```typescript
export declare const compileArticle: (article: string) => Promise<CompiledArticle>;
```

Use the first top-level H1 as title, taking only its direct text children. Remove that heading and all preceding nodes
from the body; sanitize and serialize the remaining Markdown. A missing or empty extracted title produces MissingTitle
and an empty title string. No input-heading normalization or custom sanitizer policy is added.
