# src/lib/domain/entities

Define article, bookmark, comment, invitation, role, session, and user contracts shared by repositories, remotes, and
presentation consumers. Include permission/quota helpers and the current authentication-cookie writer; persistence
belongs to repositories.

## Files

### `src/lib/domain/entities/article.ts`

#### `Article`

```typescript
export interface Article {
  id: string;
  path: IdPath;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  contentType: ArticleContentType;
  content: string;
  replyTo?: ArticleCard;
}
```

`path` is the root-to-self article identity path. `replyTo` is the direct parent projection when present. Markdown
content stores source; external content stores the original URL. Author display fields come from the current user
record.

#### `ArticleDetail`

```typescript
export interface ArticleDetail extends Article {
  markup: string;
}
```

`markup` is compiled HTML for Markdown and the empty string for external articles in the article-detail remote.

#### `ArticleContentType`

```typescript
export type ArticleContentType = 'markdown' | 'external';
```

#### `ArticleInput`

```typescript
export interface ArticleInput {
  title: string;
  authorId: string;
  contentType: ArticleContentType;
  content: string;
  replyToId?: string;
}
```

#### `ArticlePatch`

```typescript
export interface ArticlePatch {
  title: string;
  content: string;
}
```

Updates expose title and content; callers may pass a partial patch to the repository. Content type and reply ancestry
are outside this patch.

#### `ArticleCard`

```typescript
export interface ArticleCard {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
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
  authorId: string;
  authorName: string;
  authorUsername: string;
  contentType: ArticleContentType;
  content: string;
  replyTo?: ArticleCard;
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
  authorName: string;
  authorUsername: string;
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

#### `ARTICLE_PAGE_SIZE`

```typescript
export declare const ARTICLE_PAGE_SIZE = 20;
```

Homepage, profile, and bookmark article lists use 20 items per page.

### `src/lib/domain/entities/bookmark.ts`

#### `Bookmark`

```typescript
export interface Bookmark {
  userId: string;
  articleId: string;
  createdAt: Date;
}
```

#### `BookmarkStatus`

```typescript
export interface BookmarkStatus {
  isBookmarked: boolean;
  bookmarkCount: number;
}
```

### `src/lib/domain/entities/comment.ts`

#### `Comment`

```typescript
export interface Comment {
  id: string;
  path: IdPath;
  createdAt: Date;
  updatedAt: Date;
  articleId: string;
  author: Author;
  content: string;
}
```

`path` identifies the root-to-self comment chain; `articleId` identifies the discussion. Text content is rendered as
text, preserving line breaks.

#### `CommentView`

```typescript
export type CommentView = Comment & {
  replyTo?: Comment;
};
```

`replyTo`, when present, is the direct parent comment, resolved by the remote from the fetched discussion.

#### `CommentCard`

```typescript
export interface CommentCard {
  id: string;
  updatedAt: Date;
  content: string;
}
```

#### `CommentListItem`

```typescript
export interface CommentListItem {
  article: ArticleCard;
  comments: CommentCard[];
}
```

Group a page of a user’s comment records by their owning article. Pagination counts individual comments rather than
these grouped items.

#### `CommentInput`

```typescript
export interface CommentInput {
  articleId: string;
  userId: string;
  content: string;
  replyToId?: string;
}
```

#### `CommentPatch`

```typescript
export interface CommentPatch {
  content: string;
}
```

#### `COMMENT_PAGE_SIZE`

```typescript
export declare const COMMENT_PAGE_SIZE = 20;
```

Profile comment queries page over 20 comment records.

### `src/lib/domain/entities/invite_code.ts`

Supporting types and declarations used by the public signatures below (not additional exports):

```typescript
interface InviteQuotaInput {
  articleCount: number;
  validCodeCount: number;
  invitedCount: number;
}
```

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

#### `InviteCodeCard`

```typescript
export type InviteCodeCard = Pick<InviteCode, 'code' | 'roleKey'>;
```

#### `isInviteCodeValid`

```typescript
export declare function isInviteCodeValid(inviteCode: InviteCode): boolean;
```

Return true exactly when `usedAt === null`; this check does not query storage or reserve the code.

#### `InviteQuotaAlgorithm`

```typescript
export type InviteQuotaAlgorithm = (input: InviteQuotaInput) => number;
```

Receives `{ articleCount: number; validCodeCount: number; invitedCount: number }`. This input type is not itself
exported.

#### `inviteCodeQuota`

```typescript
export declare function inviteCodeQuota(input: InviteQuotaInput): number;
```

Return `Math.max(articleCount - validCodeCount - invitedCount, 0)`. Inputs are supplied counts; no I/O or storage
mutation occurs.

#### `InviteCodeInput`

```typescript
export interface InviteCodeInput {
  inviterId: string;
  roleKey: string;
}
```

### `src/lib/domain/entities/role.ts`

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
  username: string;
  name: string;
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

### `src/lib/domain/entities/session.ts`

#### `AUTH_COOKIE_NAME`

```typescript
export declare const AUTH_COOKIE_NAME = 'auth_session';
```

#### `Session`

```typescript
export type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
};
```

#### `setAuthCookie`

```typescript
export declare function setAuthCookie(cookies: Cookies, session: Session): void;
```

Write `auth_session` at `/` with the session ID, HTTP-only enabled, expiry equal to the session expiry, and `secure`
equal to `import.meta.env.PROD`. Cookie-writing errors propagate.

### `src/lib/domain/entities/user.ts`

#### `User`

```typescript
export interface User {
  id: string;
  username: string;
  githubId: number | null;
  name: string;
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

#### `UserInput`

```typescript
export interface UserInput {
  username: string;
  githubId: number | null;
  name: string;
  aboutMe: string;
}
```

#### `UserPatch`

```typescript
export interface UserPatch {
  username: string;
  name: string;
  aboutMe: string;
}
```
