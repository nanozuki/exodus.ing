# src/lib/models

Define shared business records, projections, aggregates, and pure functions used
by client and server modules. Group related data by business concept; replace the former `domain/entities` and `domain/values`
directories with this one module.

Models neither obtain external capabilities nor perform observable effects. They
must not import server infrastructure, SvelteKit request APIs, or component code.
Repository-specific SQL, transaction mechanisms, and operation parameters stay
in repositories; use-case dependency/parameter/result types stay beside their
operation. Page-only `ArticleDetail` and `CommentView` belong beside their remote functions. Cookie
transport data and cookie writers belong to the server request-boundary helper.
Invitation quota calculation belongs directly in the relevant use case.

Imports have no observable effects.

## Files

### `src/lib/models/article.ts`

#### `Article`

```typescript
export interface Article {
  id: string;
  path: IdPath;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  author: UserSummary;
  contentType: ArticleContentType;
  content: string;
  replyTo?: ArticleSummary;
}
```

`path` is the root-to-self article identity path. `replyTo` is the direct parent projection when present. Markdown
content stores source; external content stores the original URL. The author summary comes from the current user record.

#### `ArticleContentType`

```typescript
export type ArticleContentType = 'markdown' | 'external';
```

#### `ArticleSummary`

```typescript
export interface ArticleSummary {
  id: string;
  title: string;
  author: UserSummary;
}
```

#### `ArticleListItem`

```typescript
export interface ArticleListItem {
  id: string;
  path: IdPath;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  author: UserSummary;
  contentType: ArticleContentType;
  content: string;
  replyTo?: ArticleSummary;
  replyCount: number;
  bookmarkCount: number;
  commentCount: number;
}
```

Interaction counts are persisted projections. `replyCount` counts direct article responses, not every descendant.

#### `ArticleFeedsItem`

```typescript
export interface ArticleFeedsItem {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  author: UserSummary;
  contentType: ArticleContentType;
  content: string;
}
```

#### `ArticleContent`

```typescript
export interface ArticleContent {
  id: string;
  title: string;
  content: string;
  contentType: ArticleContentType;
}
```

### `src/lib/models/bookmark.ts`

#### `BookmarkState`

```typescript
export interface BookmarkState {
  articleId: string;
  count: number;
  bookmarked: boolean | null;
}
```

`count` is the actual number of bookmark relationships for the article.
`bookmarked` is `null` for an anonymous viewer; for an authenticated viewer it
indicates whether at least one matching relationship exists. Raw relationship
rows remain storage details represented by `BookmarkRow` in the database module.

### `src/lib/models/comment.ts`

#### `Comment`

```typescript
export interface Comment {
  id: string;
  path: IdPath;
  createdAt: Date;
  updatedAt: Date;
  articleId: string;
  author: UserSummary;
  content: string;
}
```

`path` identifies the root-to-self comment chain; `articleId` identifies the discussion. Text content is rendered as
text, preserving line breaks.

#### `CommentSummary`

```typescript
export interface CommentSummary {
  id: string;
  updatedAt: Date;
  content: string;
}
```

#### `CommentListItem`

```typescript
export interface CommentListItem {
  article: ArticleSummary;
  comments: CommentSummary[];
}
```

Group a page of a user’s comment records by their owning article. Pagination counts individual comments rather than
these grouped items.

### `src/lib/models/invite_code.ts`

#### `InviteCode`

```typescript
export interface InviteCode {
  id: number;
  code: string;
  inviterId: string;
  roleKey: string;
  usedAt: Date | null;
}
```

#### `InviteCodeSummary`

```typescript
export type InviteCodeSummary = Pick<InviteCode, 'code' | 'roleKey'>;
```

#### `InviteStats`

```typescript
export interface InviteStats {
  articleCount: number;
  validCodeCount: number;
  invitedCount: number;
}
```

Count articles authored by the inviter, unused invitation codes issued by that inviter, and role assignments attributed to that inviter. All three counts describe the same database snapshot. Quota policy is calculated by use cases.

### `src/lib/models/role.ts`

#### `Role`

```typescript
export declare enum Role {
  ArticleAuthor = 'article_author',
}
```

#### `Permission`

```typescript
export declare enum Permission {
  CreateArticle = 'create_article',
}
```

#### `rolePermissions`

```typescript
export const rolePermissions: Record<Role, Permission[]> = {
  [Role.ArticleAuthor]: [Permission.CreateArticle],
};
```

The exported record is mutable; the current author role grants only article creation.

#### `hasPermission`

```typescript
export declare function hasPermission(roles: Role[], permission: Permission): boolean;
```

Return true when any supplied role grants the permission. The implementation assumes each role exists in
`rolePermissions`; unknown runtime values can throw.

#### `Relation`

```typescript
export interface Relation {
  user: UserSummary;
  invitedAt: Date;
}
```

#### `UserRelations`

```typescript
export interface UserRelations {
  inviter: Relation | undefined;
  invitees: Relation[];
}
```

#### `UserRole`

```typescript
export interface UserRole {
  userId: string;
  roleKey: Role;
  inviterId: string | null;
  invitedAt: Date;
}
```

Represent one assigned user–role relationship. A null inviter denotes an assignment without an inviter. The pair `(userId, roleKey)` identifies the relationship.

### `src/lib/models/session.ts`

#### `Session`

```typescript
export type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
};
```

### `src/lib/models/user.ts`

#### `User`

```typescript
export interface User extends UserSummary {
  githubId: number | null;
  aboutMe: string;
  verifyCode: string;
}
```

#### `LoggedInUser`

```typescript
export interface LoggedInUser extends User {
  roles: Role[];
}
```

#### `userHasPermission`

```typescript
export declare function userHasPermission(user: LoggedInUser | null, permission: Permission): boolean;
```

Return false for `null`; otherwise test whether any assigned role grants the permission. As with `hasPermission`,
runtime role keys are assumed to be known.

#### `UserSummary`

```typescript
export interface UserSummary {
  id: string;
  username: string;
  name: string;
}
```

Reusable public identity projection for article and comment authors, navigation,
and invitation relationships. The full `User` adds GitHub identity, profile
text, and verification data.

### `src/lib/models/id_path.ts`

#### `IdPath`

```typescript
export type IdPath = string[];
```

#### `encodeIdPath`

```typescript
export declare function encodeIdPath(path: IdPath): string;
```

Join segments with `/` and append a trailing slash. An empty path encodes as `/`; segment contents are not validated or
escaped.

#### `decodeIdPath`

```typescript
export declare function decodeIdPath(path: string): IdPath;
```

Split on `/` and discard empty segments, tolerating repeated or absent trailing separators.

#### `PathEncoded`

```typescript
export type PathEncoded<
  T extends {
    path: IdPath;
  },
> = Omit<T, 'path'> & {
  path: string;
};
```

#### `PathDecoded`

```typescript
export type PathDecoded<
  T extends {
    path: string;
  },
> = Omit<T, 'path'> & {
  path: IdPath;
};
```

#### `decodePathField`

```typescript
export declare function decodePathField<
  T extends {
    path: string;
  },
>(item: T): PathDecoded<T>;
```

Return a shallow copy with only `path` decoded to segments; leave the input object unchanged.

#### `encodePathField`

```typescript
export declare function encodePathField<
  T extends {
    path: IdPath;
  },
>(item: T): PathEncoded<T>;
```

Return a shallow copy with only `path` converted to its string representation; leave the input object unchanged.

#### `getPathParent`

```typescript
export declare function getPathParent(path: IdPath): string | undefined;
```

Return the penultimate segment, or `undefined` when fewer than two segments exist.

### `src/lib/models/page.ts`

#### `Pagination`

```typescript
export interface Pagination {
  pageNumber: number;
  pageSize: number;
}
```

`pageNumber` is one-based. These interfaces impose no runtime validation; consumers and query boundaries determine
acceptable values.

#### `Paginated`

```typescript
export interface Paginated<T> {
  pageNumber: number;
  pageSize: number;
  count: number;
  items: T[];
}
```

`pageNumber` and `pageSize` describe the requested page. `count` is the total
matching record count before pagination; `items` is the selected page. Grouping
comment records can produce fewer items than `pageSize`, which still counts raw
comment records. Page-size choices belong to remote functions and route handlers,
not shared models.
