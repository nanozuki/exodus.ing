# src/lib/server/repositories

Provide database reads, writes, model mapping, and internal transactions for articles, bookmarks, comments, invitations, roles, sessions, and users. Consumers pass `AppDatabase` from `src/lib/server/db/schema.ts` directly to standalone exported functions. There are no repository classes, repository sets, or global database reads.

Repository operations return models from `src/lib/models/`, or compositions of
those models. Operation-specific object parameters are exported as `XxxParams`
beside their function; inputs need not be models. Shared model values may also
serve directly as inputs. Use cases own permissions, business decisions, quota calculation, and session lifetime policy. Repositories own SQL, consistency, generated storage identifiers, and persistence timestamps. Do not access request context, cookies, DNS, or frontend state.

Every exported database operation wraps its complete body with `wrap`, using its exact exported function name as the operation label. Throw expected HTTP errors inside that wrapper; it preserves those errors and normalizes unexpected failures. All internal helpers execute within their owning operation's wrapper. Do not query at import time.

Required singular reads throw `NOT_FOUND`; optional reads return `null`. Complete collections return all matches, including `[]`; paginated collections use the one-based `Pagination`/`Paginated<T>` contract,
return the requested `pageNumber` and `pageSize`, and return empty `items` when
appropriate. Empty relationship collections do not establish whether their owner exists. Updates and deletes perform no additional existence checks.

All transaction contexts remain internal. Related writes and reads governing them use one transaction. Related result/count queries use a consistent snapshot, including paginated lists and invite statistics. Separate calls made by a use case or remote do not share a transaction. Preserve current table constraints and identifier formats.

## Files

### `src/lib/server/repositories/article.ts`

Read article models and projections; insert/update persisted articles and their direct-parent reply count.

#### `getArticleById`

```typescript
export declare function getArticleById(db: AppDatabase, articleId: string): Promise<Article>;
```

Map the current author to `UserSummary`, decode the ancestry path, and attach its direct parent summary. Missing article throws `NOT_FOUND`; a stored path referencing an unavailable parent is an `INTERNAL_SERVER_ERROR`. Related mapping reads use a consistent snapshot.

#### `getArticleContentById`

```typescript
export declare function getArticleContentById(db: AppDatabase, articleId: string): Promise<ArticleContent>;
```

Read editable content without requiring an author join. Missing article throws `NOT_FOUND`.

#### `getArticleSummaryById`

```typescript
export declare function getArticleSummaryById(db: AppDatabase, articleId: string): Promise<ArticleSummary>;
```

Map the current author to `UserSummary`; missing result throws `NOT_FOUND`.

#### `listArticles`

```typescript
export declare function listArticles(db: AppDatabase, page: Pagination): Promise<Paginated<ArticleListItem>>;
```

Order by creation time descending, decode paths, and populate parent summaries. Return the total count and requested page from a consistent snapshot.

#### `listArticlesOfUser`

```typescript
export declare function listArticlesOfUser(
  db: AppDatabase,
  userId: string,
  page: Pagination,
): Promise<Paginated<ArticleListItem>>;
```

Apply the same mapping, ordering, and snapshot rules as `listArticles`, restricted to the author.

#### `listBookmarkedArticlesOfUser`

```typescript
export declare function listBookmarkedArticlesOfUser(
  db: AppDatabase,
  userId: string,
  page: Pagination,
): Promise<Paginated<ArticleListItem>>;
```

Apply the article list mapping and creation-descending ordering. Count bookmark relationships; existing duplicate relationships may duplicate returned rows, preserving the unchanged schema behavior.

#### `getRepliesOfArticle`

```typescript
export declare function getRepliesOfArticle(db: AppDatabase, articleId: string): Promise<ArticleSummary[]>;
```

Return every direct response at any ancestry depth, without truncation. Result order is unspecified.

#### `listArticleFeeds`

```typescript
export declare function listArticleFeeds(db: AppDatabase, page: Pagination): Promise<Paginated<ArticleFeedsItem>>;
```

Return a page ordered by update time descending and a consistent total. The feed route requests its existing limit as the first page and consumes `items`.

#### `CreateArticleParams`

```typescript
export interface CreateArticleParams {
  title: string;
  authorId: string;
  contentType: ArticleContentType;
  content: string;
  replyToId?: string;
}
```

Supply the author, content, and optional direct parent for a new article.

#### `createArticle`

```typescript
export declare function createArticle(db: AppDatabase, params: CreateArticleParams): Promise<Article>;
```

Generate a unique six-character storage ID and capture the persistence timestamp. Read any parent and its ancestry inside the transaction that inserts the article and increments that direct parent’s reply count. A missing parent throws `NOT_FOUND`. Complete author lookup and result mapping within that same transaction before commit, then return the mapped article; author/title uniqueness conflicts become `title` field errors; authorization and content policy belong to use cases.

#### `UpdateArticleParams`

```typescript
export interface UpdateArticleParams {
  id: string;
  title?: string;
  content?: string;
}
```

Identify the article and supplied editable fields. Omitted fields remain
unchanged; content type and reply ancestry are immutable through this operation.
These parameters do not provide authorization or existence guarantees.

#### `updateArticle`

```typescript
export declare function updateArticle(db: AppDatabase, params: UpdateArticleParams): Promise<void>;
```

Update the supplied title/content fields by ID without checking existence. Author/title uniqueness conflicts become `title` field errors. Preserve the current behavior of not explicitly advancing `updatedAt`.

### `src/lib/server/repositories/bookmark.ts`

Read bookmark state and keep relationship changes consistent with the article’s persisted bookmark count.

#### `GetBookmarkStateOfArticleParams`

```typescript
export interface GetBookmarkStateOfArticleParams {
  articleId: string;
  userId?: string;
}
```

Omit the user ID to request anonymous bookmark state.

#### `getBookmarkStateOfArticle`

```typescript
export declare function getBookmarkStateOfArticle(
  db: AppDatabase,
  params: GetBookmarkStateOfArticleParams,
): Promise<BookmarkState>;
```

Return the requested `articleId`, actual relationship-row count, and viewer
bookmark state from one consistent snapshot. An omitted user gives
`bookmarked: null`; an authenticated user gets a boolean indicating whether any
matching relationship exists. Absence of rows gives count zero.

#### `CreateBookmarkParams`

```typescript
export interface CreateBookmarkParams {
  articleId: string;
  userId: string;
}
```

Identify the user–article relationship to insert.

#### `createBookmark`

```typescript
export declare function createBookmark(db: AppDatabase, params: CreateBookmarkParams): Promise<BookmarkState>;
```

Insert one relationship with the persistence timestamp and increment the
article count in one transaction. Read and return the updated `BookmarkState`
for the supplied article and user within that same transaction before commit;
`count` counts actual relationship rows and `bookmarked` is true. Preserve current
duplicate-insertion semantics and do not add an existence check or a unique
constraint in this refactor.

#### `DeleteBookmarkParams`

```typescript
export interface DeleteBookmarkParams {
  articleId: string;
  userId: string;
}
```

Identify all user–article relationships to delete.

#### `deleteBookmark`

```typescript
export declare function deleteBookmark(db: AppDatabase, params: DeleteBookmarkParams): Promise<void>;
```

Delete all matching user/article relationships in one transaction and decrement the article’s persisted count by the number of rows actually deleted. Deleting zero rows leaves the count unchanged. This intentionally fixes the prior unconditional single decrement.

### `src/lib/server/repositories/comment.ts`

Read comment records and per-user grouped projections; insert/update comments while preserving article counts.

#### `getCommentsOfArticle`

```typescript
export declare function getCommentsOfArticle(db: AppDatabase, articleId: string): Promise<Comment[]>;
```

Return all comments ordered by creation ascending, join their authors, and decode ancestry paths. Never truncate the complete collection.

#### `listCommentsOfUser`

```typescript
export declare function listCommentsOfUser(
  db: AppDatabase,
  userId: string,
  page: Pagination,
): Promise<Paginated<CommentListItem>>;
```

Page raw comments by update time descending, then group each page by article. `count` is the number of raw matching comments, not groups; a group can recur on another page. Read count and rows consistently.

#### `getCommentById`

```typescript
export declare function getCommentById(db: AppDatabase, commentId: string): Promise<Comment>;
```

Join the author and decode the ancestry path; missing comment throws `NOT_FOUND`.

#### `CreateCommentParams`

```typescript
export interface CreateCommentParams {
  articleId: string;
  userId: string;
  content: string;
  replyToId?: string;
}
```

Supply the discussion, author, text, and optional parent comment.

#### `createComment`

```typescript
export declare function createComment(db: AppDatabase, params: CreateCommentParams): Promise<Comment>;
```

Generate a unique six-character ID and persistence timestamp. Read any reply parent in the same transaction as insertion and article comment-count increment; missing reply parent throws `NOT_FOUND`. The article count update must affect an existing article; otherwise throw `NOT_FOUND` and roll back the comment. Complete author lookup and result mapping within that same transaction before commit, then return the mapped comment. Preserve current reply-path behavior; this refactor does not introduce new cross-article reply validation.

#### `UpdateCommentParams`

```typescript
export interface UpdateCommentParams {
  id: string;
  content?: string;
}
```

Identify the existing comment and supplied content update. Article, author, and
ancestry remain unchanged.

#### `updateComment`

```typescript
export declare function updateComment(db: AppDatabase, params: UpdateCommentParams): Promise<void>;
```

Update supplied content and advance `updatedAt` using the persistence clock, without checking existence.

### `src/lib/server/repositories/invite_code.ts`

Persist invitation codes and expose consistent quota inputs. Quota arithmetic belongs to the invitation use case.

#### `findInviteCodeByCode`

```typescript
export declare function findInviteCodeByCode(db: AppDatabase, code: string): Promise<InviteCode | null>;
```

#### `getUnusedInviteCodesOfUser`

```typescript
export declare function getUnusedInviteCodesOfUser(db: AppDatabase, userId: string): Promise<InviteCodeSummary[]>;
```

Return every unused code/role projection for the inviter; ordering is unspecified.

#### `getInviteStatsOfUser`

```typescript
export declare function getInviteStatsOfUser(db: AppDatabase, userId: string): Promise<InviteStats>;
```

Read authored article count, unused invitation count, and invited role-row count from one consistent snapshot. Do not calculate quota.

#### `CreateInviteCodeParams`

```typescript
export interface CreateInviteCodeParams {
  inviterId: string;
  roleKey: string;
  expectedStats: InviteStats;
}
```

`expectedStats` is the consistent invitation-statistics snapshot on which the
use case approved creation. The repository atomically compares current
statistics with this snapshot before inserting. It is a concurrency precondition,
not a quota policy callback.

#### `createInviteCode`

```typescript
export declare function createInviteCode(db: AppDatabase, params: CreateInviteCodeParams): Promise<InviteCode>;
```

Inside a serializable transaction, read all three statistics and require equality with `params.expectedStats`, then generate a 16-character code and insert the unused invitation. A changed snapshot throws `BAD_REQUEST` with retry guidance before writing. The caller computes and checks quota before passing the snapshot; this operation does not receive or execute a quota algorithm. Serialization failures remain normalized database failures with no automatic retry.

#### `DeleteInviteCodeParams`

```typescript
export interface DeleteInviteCodeParams {
  inviterId: string;
  code: string;
}
```

Scope deletion to the supplied inviter; these parameters do not authorize the
actor.

#### `deleteInviteCode`

```typescript
export declare function deleteInviteCode(db: AppDatabase, params: DeleteInviteCodeParams): Promise<void>;
```

Scope deletion by inviter and code, including used codes, without checking existence.

### `src/lib/server/repositories/role.ts`

Read assigned roles and invitation relationships, and atomically persist invitation redemption.

#### `getRolesOfUser`

```typescript
export declare function getRolesOfUser(db: AppDatabase, userId: string): Promise<Role[]>;
```

Return all assigned role keys without runtime validation or specified ordering, retaining the existing storage contract.

#### `findInviterOfUser`

```typescript
export declare function findInviterOfUser(db: AppDatabase, userId: string): Promise<Relation | null>;
```

Return the first matching inviter as `Relation.user: UserSummary` with its
invitation time, or `null`. No choice ordering is guaranteed when several role rows match; callers normalize any existing UI-level optionality.

#### `getInviteesOfUser`

```typescript
export declare function getInviteesOfUser(db: AppDatabase, userId: string): Promise<Relation[]>;
```

Return role-based invitee relationships with `user: UserSummary`, ordered by
invitation time descending. Several roles may produce several rows for the same user.

#### `CreateRoleOfUserByInviteCodeParams`

```typescript
export interface CreateRoleOfUserByInviteCodeParams {
  code: string;
  userId: string;
  usedAt: Date;
}
```

Supply the code, authenticated recipient, and one instant for both code
consumption and any newly assigned role.

#### `createRoleOfUserByInviteCode`

```typescript
export declare function createRoleOfUserByInviteCode(
  db: AppDatabase,
  params: CreateRoleOfUserByInviteCodeParams,
): Promise<UserRole>;
```

Within one transaction, lock and require the matching unused code, create its user-role relationship if absent, and set `usedAt` to the supplied instant. Missing or already used codes throw `PARAMETER_INVALID` with the `inviteCode` field, including competing redemption. If the user already has the role, retain and return that relationship and still consume the code, preserving current behavior. The role and inviter are read from the code. A failed role write leaves the code unused; concurrent attempts cannot both redeem it. This replaces the separate code-consumption and role-grant writes.

### `src/lib/server/repositories/session.ts`

Persist supplied session data. Use cases own ID generation, current-time reads, expiration decisions, and renewal policy.

#### `findSessionById`

```typescript
export declare function findSessionById(db: AppDatabase, sessionId: string): Promise<Session | null>;
```

#### `createSession`

```typescript
export declare function createSession(db: AppDatabase, session: Session): Promise<Session>;
```

Persist and return the supplied ID, user, and expiration without applying lifetime policy.

#### `UpdateSessionParams`

```typescript
export interface UpdateSessionParams {
  id: string;
  expiresAt: Date;
}
```

Supply the new expiration for an existing session. Lifetime and renewal policy
remain in the use case.

#### `updateSession`

```typescript
export declare function updateSession(db: AppDatabase, params: UpdateSessionParams): Promise<void>;
```

Update expiration by session ID without checking existence.

#### `deleteSession`

```typescript
export declare function deleteSession(db: AppDatabase, sessionId: string): Promise<void>;
```

Delete by session ID without checking existence. This is also the persistence step for expiration detected by a use case.

### `src/lib/server/repositories/user.ts`

Read user identity/profile data and persist supplied profile changes.

#### `findUserById`

```typescript
export declare function findUserById(db: AppDatabase, id: string): Promise<User | null>;
```

Retain legacy lookup behavior: an ID of exactly 16 characters is shortened to its first six characters before querying.

#### `findUserByUsername`

```typescript
export declare function findUserByUsername(db: AppDatabase, username: string): Promise<User | null>;
```

Perform an exact optional lookup.

#### `findUserByName`

```typescript
export declare function findUserByName(db: AppDatabase, name: string): Promise<User | null>;
```

Perform an exact optional lookup.

#### `findUserByGitHubId`

```typescript
export declare function findUserByGitHubId(db: AppDatabase, githubId: number): Promise<User | null>;
```

Perform an exact optional lookup.

#### `getUsers`

```typescript
export declare function getUsers(db: AppDatabase): Promise<User[]>;
```

Return every user ordered by ID ascending, without truncation.

#### `CreateUserParams`

```typescript
export interface CreateUserParams {
  username: string;
  githubId: number | null;
  name: string;
  aboutMe: string;
}
```

Supply the identity and profile fields for a new user.

#### `createUser`

```typescript
export declare function createUser(db: AppDatabase, params: CreateUserParams): Promise<User>;
```

Generate a unique six-character ID and a 32-character verification code, capture persistence timestamps, and insert the identity/profile. Return the public `User` model. Normalize uniqueness failures through `wrap`.

#### `UpdateUserParams`

```typescript
export interface UpdateUserParams {
  id: string;
  username?: string;
  name?: string;
  aboutMe?: string;
}
```

Identify the user and supplied editable fields. Omitted fields remain
unchanged; GitHub identity and verification code are not editable through this
operation.

#### `updateUser`

```typescript
export declare function updateUser(db: AppDatabase, params: UpdateUserParams): Promise<void>;
```

Apply supplied username/name/about-me fields without existence checks or an explicit `updatedAt` change. Known username/name uniqueness conflicts are field errors through `wrap`. Username rules and acting-user authorization belong to callers.

### `src/lib/server/repositories/utils.ts`

Shared operation wrapping and storage identifier generation. These helpers are module collaboration exports, not database operations themselves.

#### `wrap`

```typescript
export declare function wrap<T>(operation: string, fn: () => Promise<T>): Promise<T>;
```

Time and log successful operations. Before normalizing failures, inspect PostgreSQL
error causes for code `23505` and known constraints: `updateUser` maps username/name
uniqueness to PARAMETER_INVALID `username`/`name`; `createArticle` and `updateArticle`
map author/title uniqueness to PARAMETER_INVALID `title`. Other constraints and
operations retain DATABASE_ERROR. Preserve HTTP errors; normalize ordinary errors to `DATABASE_ERROR` with the operation name and message, and other thrown values using JSON serialization. Preserve current serialization failure behavior.

#### `newNanoId`

```typescript
export declare function newNanoId(): string;
```

Generate six lowercase alphanumeric characters. Uniqueness checking belongs to the owning insert operation.

#### `newCode`

```typescript
export declare function newCode(): string;
```

Generate 16 lowercase alphanumeric characters for invitation storage.

#### `newVerifyCode`

```typescript
export declare function newVerifyCode(): string;
```

Generate 32 lowercase alphanumeric characters for a user’s verification code.
