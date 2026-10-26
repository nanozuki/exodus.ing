# src/lib/testing

Provide the deterministic shared dataset used by local provisioning and browser journeys, including relationships and
derived interaction counts.

## Files

### `src/lib/testing/data.ts`

Import-time effect: build the shared dataset in memory once, including deterministic minute-spaced timestamps from
2026-01-01 UTC. No database or network work occurs on import.

Supporting types and declarations used by the public signatures below (not additional exports):

```typescript
type TestDataset = {
  users: UserSeed[];
  articles: ArticleSeed[];
  bookmarks: BookmarkSeed[];
  comments: CommentSeed[];
  userRoles: UserRoleSeed[];
  inviteCodes: InviteCodeSeed[];
};
```

#### `UserSeed`

```typescript
export type UserSeed = typeof tUser.$inferInsert;
```

#### `ArticleSeed`

```typescript
export type ArticleSeed = typeof tArticle.$inferInsert;
```

#### `BookmarkSeed`

```typescript
export type BookmarkSeed = typeof tBookmark.$inferInsert;
```

#### `CommentSeed`

```typescript
export type CommentSeed = typeof tComment.$inferInsert;
```

#### `UserRoleSeed`

```typescript
export type UserRoleSeed = typeof tUserRole.$inferInsert;
```

#### `InviteCodeSeed`

```typescript
export type InviteCodeSeed = typeof tInviteCode.$inferInsert;
```

#### `testDataset`

```typescript
export declare const testDataset: TestDataset;
```

Contains six users (alice, bob, carol, dave, frank, erin), 26 articles, 28 comments, bookmarks, three author role
records, and four invitation codes. Encoded paths and interaction counts derive from the same relationship fixtures.
Exported objects and arrays are mutable; callers must isolate mutations themselves.

#### `getAuthor`

```typescript
export declare function getAuthor(article: ArticleSeed): UserSeed;
```

Find the dataset user matching article.userId, or throw Error when absent.

#### `articleSamples`

```typescript
export declare const articleSamples: {
  markdownSample: ArticleSeed;
  commentSample: ArticleSeed;
  interactiveSample: ArticleSeed;
  externalSample: ArticleSeed;
};
```

markdownSample and commentSample reference A25; interactiveSample references A21; externalSample references A01. Values
are references into testDataset, not independent copies.
