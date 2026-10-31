# src/lib/server/db

Own PostgreSQL connection construction, schema declarations, inferred storage
row types, and the generated SQL schema used by local database tooling.
Consumers are repositories, the server composition boundary, and database
management scripts. This module owns no business workflows or repository
registry. Moving the schema preserves table and column definitions, indexes,
nullability, defaults, and the existing absence of foreign keys; no database
migration is part of this extraction.

## Files

### `src/lib/server/db/index.ts`

#### `getDatabase`

```typescript
export declare function getDatabase(config: Config): Promise<AppDatabase>;
```

Construct a node-postgres Drizzle database using `config.database`, the exported
schema, and SQL logging. Log construction duration; this function does not
explicitly issue a readiness query or expose pool cleanup.

### `src/lib/server/db/schema.ts`

These declarations specify table builders and inferred public row types. The
shared timestamps fields default to now and are required. Tables have no
declared foreign keys. Columns are mutable through Drizzle query APIs;
row/insert shapes come from the corresponding $inferSelect/$inferInsert members.

Supporting types and declarations used by the public signatures below (not
additional exports):

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
  (table) => [
    index('session_user_id_idx').on(table.userId),
    index('expires_at_idx').on(table.expiresAt),
  ],
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
    uniqueIndex('user_auth_provider_user_id_idx').on(
      table.provider,
      table.providerUserId,
    ),
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

Nullable provider and signup/state fields support pending authentication data.
Expiry is required; state is uniquely indexed.

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

Title is unique per user. Interaction counts default to zero. Paths are stored
as trailing-slash strings; the database does not validate ancestry or
contentType values.

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
  (table) => [
    index('bookmark_user_id_idx').on(table.userId),
    index('bookmark_article_id_idx').on(table.articleId),
  ],
);
```

Indexes support user/article lookup; there is no primary key or unique pair
constraint.

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

The primary key is (userId, roleKey); inviter is nullable. This table is
exported but omitted from the `schema` object.

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

Contains the eight listed tables and omits tUserRole. Repositories still import
tUserRole directly.

#### `ArticleRow`

```typescript
export type ArticleRow = typeof tArticle.$inferSelect;
```

#### `BookmarkRow`

```typescript
export type BookmarkRow = typeof tBookmark.$inferSelect;
```

#### `CommentRow`

```typescript
export type CommentRow = typeof tComment.$inferSelect;
```

#### `InviteCodeRow`

```typescript
export type InviteCodeRow = typeof tInviteCode.$inferSelect;
```

#### `PendingAuthRow`

```typescript
export type PendingAuthRow = typeof tPendingAuth.$inferSelect;
```

#### `SessionRow`

```typescript
export type SessionRow = typeof tSession.$inferSelect;
```

#### `UserAuthRow`

```typescript
export type UserAuthRow = typeof tUserAuth.$inferSelect;
```

#### `UserRow`

```typescript
export type UserRow = typeof tUser.$inferSelect;
```

#### `UserRoleRow`

```typescript
export type UserRoleRow = typeof tUserRole.$inferSelect;
```

#### `AppDatabase`

```typescript
export type AppDatabase = NodePgDatabase<typeof schema>;
```

Use the node-postgres Drizzle database parameterized by the exported schema.
Transaction contexts remain internal to repository operations.

### `src/lib/server/db/database.sql`

Implicit entry point: provisioning executes this SQL in a newly created template
database. It creates the same nine tables, keys, defaults, and indexes described
by schema.ts. Statements are unconditional CREATE statements, not an idempotent
migration or an upgrade path. It contains no foreign keys; existing databases
are not automatically upgraded.
