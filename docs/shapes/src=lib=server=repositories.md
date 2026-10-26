# src/lib/server/repositories

Declare PostgreSQL storage structures and database types, construct repository services, and expose article, bookmark,
comment, invitation, role, session, and user persistence. Repository operations own their transactions; acting-user
authorization belongs to callers.

## Files

### `src/lib/server/repositories/article.ts`

#### `PgArticleRepository`

```typescript
export declare class PgArticleRepository {
  constructor(db: AppDatabase);
  getById(articleId: string): Promise<Article>;
  getContentById(articleId: string): Promise<ArticleContent>;
  getCardById(articleId: string): Promise<ArticleCard>;
  list(page: Pagination): Promise<Paginated<ArticleListItem>>;
  listFeeds(last: number): Promise<ArticleFeedsItem[]>;
  listByUserId(userId: string, page: Pagination): Promise<Paginated<ArticleListItem>>;
  listReplies(articleId: string): Promise<ArticleCard[]>;
  listUserBookmarks(userId: string, page: Pagination): Promise<Paginated<ArticleListItem>>;
  create(input: ArticleInput): Promise<string>;
  update(articleId: string, patch: Partial<ArticlePatch>): Promise<void>;
}
```

All public methods use the shared database error wrapper. The constructor retains the supplied database; it performs no
query.

- `getById`, `getCardById`, and `getContentById` throw NOT_FOUND when absent. Full/card reads join the current author;
  content reads do not. Full reads decode paths and attach the direct parent card; a missing referenced parent throws
  INTERNAL_SERVER_ERROR.
- `list`, `listByUserId`, and `listUserBookmarks` return one-based pages ordered by article creation descending. Counts
  and rows use separate statements without a shared snapshot. Bookmark counts count relationship rows, and duplicate
  bookmarks can duplicate results. Empty pages have empty items; parent cards are populated where needed.
- `listFeeds(last)` returns at most `last` records ordered by update time descending. `listReplies` returns all direct
  responses at any depth; no result ordering is specified by its query.
- `create` generates a unique six-character ID through a read/check loop, captures current time, and stores root-to-self
  ancestry. Parent lookup happens before the transaction. Insertion and direct-parent reply-count increment share a
  transaction. Return the new ID.
- `update` accepts a partial title/content patch and performs an update without checking existence, authorization, or
  content type. It does not explicitly advance `updatedAt`.

No public operation checks the acting user’s permissions; remotes own those checks.

### `src/lib/server/repositories/bookmark.ts`

#### `PgBookmarkRepository`

```typescript
export declare class PgBookmarkRepository {
  constructor(db: AppDatabase);
  getBookmarkStatus(articleId: string, userId?: string): Promise<BookmarkStatus>;
  create(articleId: string, userId: string): Promise<void>;
  delete(articleId: string, userId: string): Promise<void>;
}
```

All methods use the shared database error wrapper; authorization belongs to the remote.

- `getBookmarkStatus` returns whether the supplied user has any matching row, plus the actual relationship-row count for
  the article. Without userId, isBookmarked is false. Reads do not promise a shared snapshot.
- `create` inserts one relationship and increments the article’s persisted bookmark count in one transaction, using the
  current time. It does not check for an existing bookmark or article.
- `delete` deletes all matching rows and decrements the persisted count once in a transaction, including when no row was
  deleted.

Observed limitation: writes are not idempotent, duplicates are permitted by the current schema, and the persisted count
can diverge from relationship rows.

### `src/lib/server/repositories/comment.ts`

#### `PgCommentRepository`

```typescript
export declare class PgCommentRepository {
  constructor(db: AppDatabase);
  listByArticle(articleId: string): Promise<Comment[]>;
  listByUser(userId: string, page: Pagination): Promise<Paginated<CommentListItem>>;
  getById(commentId: string): Promise<Comment>;
  create(input: CommentInput): Promise<string>;
  update(commentId: string, patch: Partial<CommentPatch>): Promise<void>;
}
```

All public methods use the shared database error wrapper; authorization belongs to callers.

- `listByArticle` returns all matching comments ordered by creation ascending, with current author data and decoded
  paths.
- `listByUser` pages individual comments ordered by update time descending, then groups that page by article. Count is
  the total comment count, and group order follows the first encountered comment. Count and row reads have no shared
  snapshot.
- `getById` throws NOT_FOUND when missing and returns the decoded comment with its author.
- `create` generates a unique six-character ID. If replying, read the target and extend its path, or throw NOT_FOUND. It
  does not require the target to belong to the supplied article. Insert and article-comment-count increment share a
  transaction; parent lookup precedes it. Return the new ID.
- `update` writes content and the current updatedAt without verifying existence. A partial patch without content still
  supplies undefined content to the query builder.

Observed gap: cross-article reply targets and missing owning articles are not explicitly rejected by this repository.

### `src/lib/server/repositories/database.sql`

Implicit entry point: provisioning executes this SQL in a newly created template database. It creates the same nine
tables, keys, defaults, and indexes described by schema.ts. Statements are unconditional CREATE statements, not an
idempotent migration or an upgrade path. It contains no foreign keys; existing databases are not automatically upgraded.

### `src/lib/server/repositories/index.ts`

#### `getDatabase`

```typescript
export declare function getDatabase(config: Config): Promise<AppDatabase>;
```

Construct a node-postgres Drizzle database using `config.database`, the exported schema, and SQL logging. Log
construction duration; this function does not explicitly issue a readiness query or expose pool cleanup.

#### `createRepositorySet`

```typescript
export declare function createRepositorySet(db: AppDatabase): {
  article: PgArticleRepository;
  bookmark: PgBookmarkRepository;
  comment: PgCommentRepository;
  inviteCode: PgInviteCodeRepository;
  role: PgRoleRepository;
  user: PgUserRepository;
  session: PgSessionRepository;
};
```

Construct one instance of every repository class against the same database. Sharing a database does not make separate
operations transactional.

#### `RepositorySet`

```typescript
export type RepositorySet = ReturnType<typeof createRepositorySet>;
```

### `src/lib/server/repositories/invite_code.ts`

#### `PgInviteCodeRepository`

```typescript
export declare class PgInviteCodeRepository {
  constructor(db: AppDatabase);
  create(input: InviteCodeInput, algo: InviteQuotaAlgorithm): Promise<InviteCode>;
  findByCode(code: string): Promise<InviteCode | null>;
  useCode(code: string): Promise<void>;
  getUserUnusedCodes(userId: string): Promise<InviteCodeCard[]>;
  getUserInviteQuota(userId: string, algo: InviteQuotaAlgorithm): Promise<number>;
  delete(userId: string, code: string): Promise<void>;
}
```

All methods use the shared database error wrapper.

- `create` counts authored articles, unused codes, and invited-role rows in one serializable transaction, passes them to
  the supplied algorithm, and rejects nonpositive quota with BAD_REQUEST. Insert a new random 16-character code and
  return the complete invitation. Serialization failures are surfaced, without automatic retry.
- `findByCode` returns null when absent. `useCode` timestamps an unused matching row and silently succeeds when no row
  matches; it returns no claim/result indicator.
- `getUserUnusedCodes` returns code/role projections for unused invitations without a specified order.
- `getUserInviteQuota` reads its three counts separately and computes quota without a shared transaction.
- `delete` scopes deletion by inviter ID and code, including used codes, and performs no existence check.

Code consumption and assigning the invited role are separate operations; this class does not provide atomic redemption.

### `src/lib/server/repositories/role.ts`

#### `PgRoleRepository`

```typescript
export declare class PgRoleRepository {
  constructor(db: AppDatabase);
  specifyRoleByOther(userId: string, role: Role, inviterId: string): Promise<void>;
  getUserRoles(userId: string): Promise<Role[]>;
  getInviter(userId: string): Promise<Relation | undefined>;
  getInvitees(userId: string): Promise<Relation[]>;
}
```

All methods use the shared database error wrapper.

- `specifyRoleByOther` returns without change when the user/role pair exists; otherwise insert it with inviter and
  current invitedAt. The check and insert are separate statements, so concurrent insertion can fail at the primary key.
- `getUserRoles` casts stored role keys to Role without runtime validation or specified ordering.
- `getInviter` returns the first matching inviter projection, or undefined. Its query has no explicit ordering if
  multiple role rows match.
- `getInvitees` returns matching role-based relationships by invitedAt descending; multiple role rows could represent
  the same user.

### `src/lib/server/repositories/schema.ts`

These declarations specify table builders and inferred public row types. The shared timestamps fields default to now and
are required. Tables have no declared foreign keys. Columns are mutable through Drizzle query APIs; row/insert shapes
come from the corresponding $inferSelect/$inferInsert members.

Supporting types and declarations used by the public signatures below (not additional exports):

```typescript
const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
};
```

#### `tUser`

```typescript
export const tUser = pgTable('user', {
  id: text('id').notNull().primaryKey(),
  ...timestamps,
  username: text('username').notNull().unique(),
  githubId: integer('github_id').unique(),
  name: text('name').notNull().unique(),
  aboutMe: text('about_me').notNull(),
  verifyCode: text('verify_code').notNull(),
});
```

Username, GitHub ID, and display name are unique; GitHub ID is nullable.

#### `tSession`

```typescript
export const tSession = pgTable(
  'session',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('user_id').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => [index('session_user_id_idx').on(table.userId), index('expires_at_idx').on(table.expiresAt)],
);
```

#### `tUserAuth`

```typescript
export const tUserAuth = pgTable(
  'user_auth',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('user_id').notNull(),
    provider: text('provider').notNull(),
    providerUserId: text('provider_user_id').notNull(),
    providerUsername: text('provider_username'),
    providerEmail: text('provider_email'),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    uniqueIndex('user_auth_provider_user_id_idx').on(table.provider, table.providerUserId),
    index('user_auth_user_id_idx').on(table.userId),
  ],
);
```

#### `tPendingAuth`

```typescript
export const tPendingAuth = pgTable(
  'pending_auth',
  {
    id: text('id').notNull().primaryKey(),
    authType: text('auth_type').notNull(),
    state: text('state'),
    provider: text('provider'),
    providerUserId: text('provider_user_id'),
    providerUsername: text('provider_username'),
    providerEmail: text('provider_email'),
    payload: jsonb('payload'),
    next: text('next'),
    signUpUsername: text('sign_up_username'),
    signUpName: text('sign_up_name'),
    createdAt: timestamps.createdAt,
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => [
    uniqueIndex('pending_auth_state_idx').on(table.state),
    index('pending_auth_expires_at_idx').on(table.expiresAt),
  ],
);
```

Nullable provider and signup/state fields support pending authentication data. Expiry is required; state is uniquely
indexed.

#### `tInviteCode`

```typescript
export const tInviteCode = pgTable(
  'invite_code',
  {
    id: serial('id').primaryKey(),
    code: text('code').notNull().unique(),
    roleKey: text('role_key').notNull(),
    inviterId: text('inviter_id').notNull(),
    usedAt: timestamp('used_at'),
  },
  (table) => [index('invite_code_inviter_id_idx').on(table.inviterId)],
);
```

#### `tArticle`

```typescript
export const tArticle = pgTable(
  'article',
  {
    id: text('id').notNull().primaryKey(),
    ...timestamps,
    userId: text('user_id').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    contentType: text('content_type').$type<ArticleContentType>().notNull(),
    path: text('path').notNull(),
    replyCount: integer('reply_count').default(0).notNull(),
    bookmarkCount: integer('bookmark_count').default(0).notNull(),
    commentCount: integer('comment_count').default(0).notNull(),
  },
  (table) => [
    uniqueIndex('article_title_idx').on(table.title, table.userId),
    index('article_user_id_idx').on(table.userId),
    index('article_path_idx').on(table.path),
  ],
);
```

Title is unique per user. Interaction counts default to zero. Paths are stored as trailing-slash strings; the database
does not validate ancestry or contentType values.

#### `tComment`

```typescript
export const tComment = pgTable(
  'comment',
  {
    id: text('id').notNull().primaryKey(),
    path: text('path').notNull(),
    ...timestamps,
    userId: text('user_id').notNull(),
    articleId: text('article_id').notNull(),
    content: text('content').notNull(),
  },
  (table) => [
    index('comment_article_id_idx').on(table.articleId),
    index('comment_user_id_idx').on(table.userId),
    index('comment_path_idx').on(table.path),
  ],
);
```

#### `tBookmark`

```typescript
export const tBookmark = pgTable(
  'bookmark',
  {
    userId: text('user_id').notNull(),
    articleId: text('article_id').notNull(),
    createdAt: timestamps.createdAt,
  },
  (table) => [index('bookmark_user_id_idx').on(table.userId), index('bookmark_article_id_idx').on(table.articleId)],
);
```

Indexes support user/article lookup; there is no primary key or unique pair constraint.

#### `tUserRole`

```typescript
export const tUserRole = pgTable(
  'user_role',
  {
    userId: text('user_id').notNull(),
    roleKey: text('role_key').notNull(),
    invitedAt: timestamp('invited_at').defaultNow().notNull(),
    inviterId: text('inviter_id'),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleKey] }),
    index('user_role_inviter_id_idx').on(table.inviterId),
  ],
);
```

The primary key is (userId, roleKey); inviter is nullable. This table is exported but omitted from the `schema` object.

#### `schema`

```typescript
export const schema = {
  tArticle,
  tBookmark,
  tComment,
  tInviteCode,
  tPendingAuth,
  tSession,
  tUserAuth,
  tUser,
};
```

Contains the eight listed tables and omits tUserRole. Repositories still import tUserRole directly.

#### `ArticleModel`

```typescript
export type ArticleModel = typeof tArticle.$inferSelect;
```

#### `BookmarkModel`

```typescript
export type BookmarkModel = typeof tBookmark.$inferSelect;
```

#### `CommentModel`

```typescript
export type CommentModel = typeof tComment.$inferSelect;
```

#### `InviteCodeModel`

```typescript
export type InviteCodeModel = typeof tInviteCode.$inferSelect;
```

#### `PendingAuthModel`

```typescript
export type PendingAuthModel = typeof tPendingAuth.$inferSelect;
```

#### `SessionModel`

```typescript
export type SessionModel = typeof tSession.$inferSelect;
```

#### `UserAuthModel`

```typescript
export type UserAuthModel = typeof tUserAuth.$inferSelect;
```

#### `UserModel`

```typescript
export type UserModel = typeof tUser.$inferSelect;
```

#### `UserRoleModel`

```typescript
export type UserRoleModel = typeof tUserRole.$inferSelect;
```

#### `AppDatabase`

```typescript
export type AppDatabase = NodePgDatabase<typeof schema>;
```

Use the node-postgres Drizzle database parameterized by the exported schema. Transaction contexts remain internal to
repository operations.

### `src/lib/server/repositories/session.ts`

#### `ValidateSessionResult`

```typescript
export type ValidateSessionResult = {
  session: Session;
  refresh: boolean;
};
```

#### `PgSessionRepository`

```typescript
export declare class PgSessionRepository {
  constructor(db: AppDatabase);
  create(userId: string): Promise<Session>;
  validateSession(sessionId: string): Promise<ValidateSessionResult | null>;
  cleanAllExpired(): Promise<void>;
  invalidateSession(sessionId: string): Promise<void>;
  invalidateAllSessions(userId: string): Promise<void>;
}
```

The constructor retains the database. These public methods currently do not use the shared database error wrapper, so
database errors propagate directly.

- `create` inserts a generated 32-character ID with expiry 30 days after the current instant; return the stored session.
- `validateSession` returns null when missing. At or after expiry, delete the session and return null. When current time
  reaches expiry minus 20 days, extend expiry to 30 days from now and return refresh=true; otherwise refresh=false. The
  read/update/delete operations are separate statements.
- `cleanAllExpired` deletes expirations strictly earlier than now, whereas validation expires at equality as well.
- `invalidateSession` and `invalidateAllSessions` delete matching rows without requiring their existence.

The repository does not set cookies; the registry refreshes cookies from its result.

### `src/lib/server/repositories/user.ts`

#### `PgUserRepository`

```typescript
export declare class PgUserRepository {
  constructor(db: AppDatabase);
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByName(name: string): Promise<User | null>;
  findByGitHubId(githubId: number): Promise<User | null>;
  listAll(): Promise<User[]>;
  create(input: UserInput): Promise<User>;
  update(userId: string, patch: Partial<UserPatch>): Promise<void>;
}
```

The constructor retains the database; authorization and input validation belong to callers.

- `findById` returns null when absent and shortens exactly 16-character IDs to their first six characters for legacy
  compatibility. This lookup bypasses the shared database wrapper.
- `findByUsername` and `findByName` perform exact optional lookups and return null when absent. `findByGitHubId` is also
  optional. These methods use the wrapper, as do list/create/update database operations.
- `listAll` returns every user ordered by ID ascending.
- `create` generates a unique six-character ID and a 32-character verification code, sets both timestamps to now, and
  inserts the supplied identity/profile. Its declared return type is User; the returned object also contains timestamps
  and roles=[] at runtime. Database uniqueness errors are wrapped.
- `update` applies a partial UserPatch without checking existence or explicitly updating updatedAt.

### `src/lib/server/repositories/utils.ts`

#### `wrap`

```typescript
export declare function wrap<T>(method: string, fn: () => Promise<T>): Promise<T>;
```

Time and log successful operations. Preserve SvelteKit HTTP errors; convert ordinary Errors to DATABASE_ERROR with the
operation and message, and other thrown values using JSON.stringify. Failures during serialization can escape directly.

#### `newNanoId`

```typescript
export declare function newNanoId(): string;
```

Generate six characters from lowercase ASCII letters and digits. Collision checking belongs to callers.

#### `newCode`

```typescript
export declare function newCode(): string;
```

Generate a 16-character lowercase alphanumeric code without querying uniqueness.

#### `newVerifyCode`

```typescript
export declare function newVerifyCode(): string;
```

Generate a 32-character lowercase alphanumeric verification code.

#### `newSessionCode`

```typescript
export declare function newSessionCode(): string;
```

Generate a 32-character lowercase alphanumeric session ID.
