# src/lib

Provide tagged application errors and Markdown compilation shared by server
operations, remotes, and components. Storage and request orchestration belong to
their owning directories.

## Files

### `src/lib/errors.ts`

#### `ErrorValue`

Map each business error tag to its parameter type:

| Tag                     | Parameters                                 | HTTP status |
| ----------------------- | ------------------------------------------ | ----------- |
| `BAD_REQUEST`           | `string`                                   | 400         |
| `PARAMETER_INVALID`     | `Record<string, string>` of field messages | 400         |
| `UNAUTHORIZED`          | `{ operation: string }`                    | 401         |
| `FORBIDDEN`             | `{ operation: string }`                    | 403         |
| `NOT_FOUND`             | `{ resource: string }`                     | 404         |
| `INTERNAL_SERVER_ERROR` | `string`                                   | 500         |
| `DATABASE_ERROR`        | `{ operation: string; cause: string }`     | 500         |
| `MISSING_CONFIG`        | `{ item: string }`                         | 500         |
| `EXTERNAL_API_ERROR`    | `{ operation: string; message: string }`   | 502         |

#### `ErrorTag`

`keyof ErrorValue`: the supported business error tags.

#### `errorTagTitle`

Mutable record mapping every `ErrorTag` to its Chinese UI title.

#### `ErrorDetail`

Discriminated union of `{ tag, value }` pairs from `ErrorValue`. Checking `tag`
narrows `value` to that tag's parameters; mismatched pairs are rejected.

#### `throwError`

`throwError(...args: ErrorArgs): never`. The private `ErrorArgs` type is a union
of `[tag, value]` tuples preserving the same relationship as `ErrorDetail`.

Build the tag-specific message and throw through SvelteKit
`error(status, message, { detail: { tag, value } })`, using the status mapping
above. Preserve the established messages. HTTP status is provided by the
framework's `status`, without a duplicate `code` property. Callers recognize
HTTP errors with SvelteKit's `isHttpError`.

### `src/lib/markdown.ts`

#### `compileMarkdown`

`compileMarkdown(content: string): Promise<Value>`.

Return an empty string for empty input; otherwise parse Markdown, YAML
frontmatter, GFM and raw HTML, sanitize through the default rehype policy, and
serialize HTML, retaining article titles. Parser/processor failures reject.

#### `MarkdownArticleIssue`

Enum with `MissingTitle = 'MissingTitle'`.

#### `articleIssueMessages`

Mutable `Record<MarkdownArticleIssue, IssueMessage>`, where the private
`IssueMessage` contains string `title` and `description`. MissingTitle reports
“缺少标题” and explains “标题为第一个一级标题”.

#### `throwArticleIssue`

`throwArticleIssue(issue: MarkdownArticleIssue, field: string): never`.

Throw PARAMETER_INVALID for the named field, using the issue's title from
`articleIssueMessages`.

#### `CompiledArticle`

Result with `markup: string`, `title: string`, and
`issues: MarkdownArticleIssue[]`.

#### `compileArticle`

`compileArticle(article: string): Promise<CompiledArticle>`.

Use the first top-level H1 as title, taking only its direct text children.
Remove that heading and all preceding nodes from the body; sanitize and
serialize the remaining Markdown. A missing or empty extracted title produces
MissingTitle and an empty title string. Source headings pass to the compiler
without extra normalization; sanitization uses the default policy.
