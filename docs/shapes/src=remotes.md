# src/remotes

Expose SvelteKit remote queries and forms for articles, authentication, bookmarks, comments, invitations, development
login, and user settings. Derive trusted actors from request locals, validate boundary inputs, and coordinate
persistence and post-write navigation.

## Files

### `src/remotes/articles.remote.ts`

Exports are SvelteKit RemoteQueryFunction or RemoteForm objects, preserving their framework query refresh, form fields,
enhancement, and pending APIs. Inputs are validated by the source Zod schemas before handlers run.

#### `getArticleDetailById`

```typescript
export declare const getArticleDetailById: RemoteQueryFunction<string, ArticleDetail>;
```

Accept a string ID; shorten exactly 16-character legacy IDs to six characters. For Markdown, compile source and replace
title with the extracted H1. For external content, return markup="" and stored title. Unknown content types throw
INTERNAL_SERVER_ERROR. Missing records follow the repository’s NOT_FOUND behavior.

#### `getArticleContentById`

```typescript
export declare const getArticleContentById: RemoteQueryFunction<string, ArticleContent>;
```

Read stored source/title/type without compilation or legacy-ID normalization. This query itself has no permission check.

#### `getArticleCardById`

```typescript
export declare const getArticleCardById: RemoteQueryFunction<string, ArticleCard>;
```

Read the public article card without legacy-ID normalization.

#### `listArticles`

```typescript
export declare const listArticles: RemoteQueryFunction<number, Paginated<ArticleListItem>>;
```

Require page >= 1 (not necessarily an integer), then request the repository page with ARTICLE_PAGE_SIZE.

#### `listRepliesOfArticle`

```typescript
export declare const listRepliesOfArticle: RemoteQueryFunction<string, ArticleCard[]>;
```

Read all direct responses for the supplied article ID; an absent parent does not itself produce NOT_FOUND.

#### `listBookmarkedArticles`

```typescript
export declare const listBookmarkedArticles: RemoteQueryFunction<number, Paginated<ArticleListItem>>;
```

Require a signed-in viewer and page >= 1; scope the 20-item page to that viewer.

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

Require CreateArticle permission and nonempty source. Compile the first H1 title and reject the first compilation issue
as PARAMETER_INVALID. For updates, require ownership or throw BAD_REQUEST; update title/content. For creation, pass the
optional direct reply target to the repository. Successful writes redirect 303 to the resulting article. Updating
through this form does not verify the stored article’s contentType.

#### `verifyDomainOwnership`

```typescript
export declare const verifyDomainOwnership: RemoteForm<
  {
    url: string;
  },
  {
    url: string;
    hostname: string;
    verified: boolean;
  }
>;
```

Require CreateArticle and a valid URL. Resolve its hostname’s TXT records; return the submitted URL, hostname, and
whether any raw record includes `exodus-site-verification=<viewer.verifyCode>` as a substring. No article is written.
DNS failures propagate.

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

Require CreateArticle, a valid URL, and a string title (an empty title is accepted by the schema). Check DNS ownership
on every submission; failure throws PARAMETER_INVALID for url. Updates require ownership or throw BAD_REQUEST, then
write title and URL; creation stores contentType=external and optional reply ancestry. Redirect 303 to the article.
Updates do not verify the existing content type; no linked page is fetched.

### `src/remotes/auth.remote.ts`

#### `registerByGithub`

```typescript
export declare const registerByGithub: RemoteForm<
  {
    next?: string | undefined;
    username?: string | undefined;
    name?: string | undefined;
  },
  never
>;
```

Trim optional username/name and treat blank results as absent. Reject usernames beginning with @ and existing
usernames/names as PARAMETER_INVALID. Store nonempty next and optional signup fields in OAuth state via the adapter,
then redirect 302 to GitHub. These preflight uniqueness reads do not reserve identity values.

#### `loginByGithub`

```typescript
export declare const loginByGithub: RemoteForm<
  {
    next?: string | undefined;
  },
  never
>;
```

Preserve a nonempty optional next value in OAuth state and redirect 302 to the provider. No local user is created here.

#### `logout`

```typescript
export declare const logout: RemoteForm<void, never>;
```

Delete auth_session at `/` and redirect 303 to `/`. Observed behavior: the corresponding database session remains valid;
this form does not call invalidateSession.

### `src/remotes/bookmarks.remote.ts`

#### `getArticleBookmarkStatus`

```typescript
export declare const getArticleBookmarkStatus: RemoteQueryFunction<string, BookmarkStatus>;
```

Return the article’s actual bookmark-row count and current viewer’s state; anonymous viewers receive isBookmarked=false.

#### `operateArticleBookmark`

```typescript
export declare const operateArticleBookmark: RemoteForm<
  {
    action: 'add' | 'remove';
    articleId: string;
  },
  {
    success: boolean;
  }
>;
```

Accept action add/remove and a string articleId. Anonymous submissions redirect 303 to `/auth?next=/a/<id>`. Signed-in
submissions call repository create/delete, refresh the status query, and return success=true. This operation adds no
duplicate-write protection or article existence check beyond repository behavior.

### `src/remotes/comments.remote.ts`

#### `listCommentsOfArticle`

```typescript
export declare const listCommentsOfArticle: RemoteQueryFunction<string, CommentView[]>;
```

Read all article comments in creation order and attach each non-root comment’s direct parent when found in the same
result. Missing parents remain undefined.

#### `listCommentsOfUser`

```typescript
export declare const listCommentsOfUser: RemoteQueryFunction<
  {
    userId: string;
    page?: number | undefined;
  },
  Paginated<CommentListItem>
>;
```

Accept userId and optional numeric page, defaulting to 1. The schema does not impose an integer or minimum-page
constraint. Return the repository’s 20-record page grouped by article.

#### `postComment`

```typescript
export declare const postComment: RemoteForm<
  {
    content: string;
    articleId?: string | undefined;
    commentId?: string | undefined;
    replyToId?: string | undefined;
  },
  never
>;
```

Require a signed-in actor and nonempty content. With commentId, require authorship or throw BAD_REQUEST, update the same
comment, and derive its article ID from storage. Without commentId, require articleId or throw BAD_REQUEST, then create
with the actor ID and optional replyToId. Refresh that article’s comment query and redirect 303 to
`/a/<article>#comment-<comment>`. The operation does not enforce that a reply target belongs to the same article.

### `src/remotes/invite_codes.remote.ts`

#### `getConsoleInviteData`

```typescript
export declare const getConsoleInviteData: RemoteQueryFunction<
  Record<string, never>,
  {
    inviter: Relation | undefined;
    invitees: Relation[];
    unusedCodes: InviteCodeCard[];
    quota: number;
  }
>;
```

Accept an empty object and require CreateArticle permission. Fetch inviter, invitees, unused codes, and quota
concurrently; these reads have no common snapshot.

#### `acceptInviteCode`

```typescript
export declare const acceptInviteCode: RemoteForm<
  {
    inviteCode: string;
  },
  never
>;
```

Require login and nonempty inviteCode. Reject missing or already-used codes with BAD_REQUEST. Mark the code used, then
assign its role with its inviter, then redirect 302 to `/console/invites?welcome=true`. Observed limitation: lookup,
consumption, and role assignment are separate calls, so redemption is not atomic and concurrent consumption is not
acknowledged to the caller.

#### `createInviteCode`

```typescript
export declare const createInviteCode: RemoteForm<void, void>;
```

Require CreateArticle, create an author invitation using inviteCodeQuota, then refresh console invite data.

#### `deleteInviteCode`

```typescript
export declare const deleteInviteCode: RemoteForm<
  {
    code: string;
  },
  void
>;
```

Require CreateArticle and nonempty code, delete only the viewer’s matching code, then refresh console invite data.

### `src/remotes/testing.remote.ts`

#### `listTestingUsers`

```typescript
export declare const listTestingUsers: RemoteQueryFunction<
  void,
  {
    users: {
      id: string;
      username: string;
      name: string;
      roles: Role[];
    }[];
  }
>;
```

Reject when PROD is true and MODE is not test. Otherwise return every stored user’s id, username, name, and roles;
perform role lookups concurrently.

#### `simulateTestingLogin`

```typescript
export declare const simulateTestingLogin: RemoteForm<
  {
    userId: string;
    next?: string | undefined;
  },
  never
>;
```

Use the same environment restriction. Require a nonempty userId, look up the user or throw NOT_FOUND, create a normal
session, and set its auth cookie. Redirect 303 to next when it starts with `/`, otherwise `/`. The string-prefix test
accepts protocol-relative `//...` values.

### `src/remotes/users.remote.ts`

Supporting types and declarations used by the public signatures below (not additional exports):

```typescript
type Tab = 'articles' | 'comments';

type ListData = {
  tabs: Tab[];
} & (
  | {
      tab: 'articles';
      articles: Awaited<ReturnType<typeof repositories.article.listByUserId>>;
    }
  | {
      tab: 'comments';
      comments: Awaited<ReturnType<typeof repositories.comment.listByUser>>;
    }
);
```

#### `getUserPageData`

```typescript
export declare const getUserPageData: RemoteQueryFunction<
  {
    username: string;
    tab?: string | undefined;
    page?: number | undefined;
  },
  {
    user: {
      aboutMe: VFileValue;
      id: string;
      username: string;
      githubId: number | null;
      name: string;
      verifyCode: string;
    };
    listData: ListData;
    isMyself: boolean;
    isWriter: boolean;
  }
>;
```

Resolve `@username` by exact username and other strings by user ID (including the repository’s legacy-ID rule), or throw
NOT_FOUND. Readers get only the comments tab; writers get articles/comments and default to articles unless tab is
exactly comments. Validate page >= 1 and default to 1, compile aboutMe as sanitized Markdown, return the selected
20-item collection and viewer identity flags. Observed result: spreading the stored User also exposes githubId and
verifyCode in this public query.

#### `updateProfile`

```typescript
export declare const updateProfile: RemoteForm<
  {
    name: string;
    aboutMe: string;
  },
  never
>;
```

Require login, a nonempty display name, and string aboutMe. Update only the authenticated viewer, then redirect 303 to
`/console/profile`. No explicit display-name uniqueness precheck is performed; database errors can surface.

#### `updateUsername`

```typescript
export declare const updateUsername: RemoteForm<
  {
    username: string;
  },
  never
>;
```

Require login and nonempty username. Reject a leading @ as PARAMETER_INVALID. If unchanged, redirect 301 without a
write; otherwise update and redirect 301 to `/u/@<username>`. There is no trimming, broader character restriction, or
explicit uniqueness precheck.
