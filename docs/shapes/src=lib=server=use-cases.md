# src/lib/server/use-cases

Implement server business operations that require external capabilities. Callers
supply capabilities in `deps` and invocation data in `params`; use cases import
repository functions and pass `deps.db`, never import the service registry, own
transactions, read request context/environment, set cookies, redirect, or refresh
remote queries. Repository operations own persistence consistency. Deterministic
Markdown compilation and business calculations stay in their owning operations;
only actual shared business scenarios receive separate exported functions.

`AppDatabase` comes from `src/lib/server/db/schema.ts`; business data comes from
`src/lib/models`. Callers supply trusted authenticated actors, provider identities,
parsed URLs, and request-independent input values. Repository/adapter failures
propagate; expected business failures use tagged application errors, with field
keys for correctable input failures. Each use case declares only the dependencies it uses. Request entry
points supply `now` from `adapters/clock.ts`; use cases never obtain the current
time directly.

## Files

### `src/lib/server/use-cases/article.ts`

#### `SaveMarkdownArticleResult`

```typescript
export type SaveMarkdownArticleResult = { ok: true; articleId: string } | { ok: false; issues: MarkdownArticleIssue[] };
```

A rejected Markdown document is a business validation result. The remote owns
mapping issues to its `content` field. `MarkdownArticleIssue` remains the shared
Markdown module's existing issue type.

#### `SaveExternalArticleResult`

```typescript
export type SaveExternalArticleResult = { ok: true; articleId: string } | { ok: false; reason: 'unverified-domain' };
```

A domain verification failure produces no persistence changes. The remote owns
the URL field's validation message.

#### `getEditableArticle`

```typescript
export function getEditableArticle(
  deps: { db: AppDatabase },
  params: { actor: LoggedInUser; articleId: string },
): Promise<Article>;
```

Require `CreateArticle` permission, load the required article, and return it only
to its author. Preserve the editor route's FORBIDDEN error for editing another
author's article. Missing articles retain NOT_FOUND. This operation is consumed
by the editor's `loadPageData` remote; it does not parse route IDs or URL search parameters.

#### `saveMarkdownArticle`

```typescript
export function saveMarkdownArticle(
  deps: { db: AppDatabase },
  params: {
    actor: LoggedInUser;
    articleId?: string;
    content: string;
    replyToId?: string;
  },
): Promise<SaveMarkdownArticleResult>;
```

Require `CreateArticle` permission. Compile the supplied Markdown and return its
issues without writes when validation fails. Derive the title from that same
compilation. With `articleId`, require the existing article's author to equal the
actor, preserving BAD_REQUEST for another author's article, then update title and
content. Without `articleId`, create a Markdown article attributed to the actor,
including an optional reply relationship. Return the saved ID; never redirect.
As before, updating content does not change the stored content type or parent.

#### `verifyDomainOwnership`

```typescript
export function verifyDomainOwnership(
  deps: { resolveTxt: (hostname: string) => Promise<string[]> },
  params: { url: URL; verificationCode: string },
): Promise<boolean>;
```

Resolve TXT records for `url.hostname` and return whether any record includes
`exodus-site-verification=<verificationCode>`. Preserve existing substring
matching and resolver failure propagation. Parsing/validating a submitted URL,
authorizing the requesting actor, and preparing hostname display state belong to
the remote.

#### `saveExternalArticle`

```typescript
export function saveExternalArticle(
  deps: {
    db: AppDatabase;
    resolveTxt: (hostname: string) => Promise<string[]>;
  },
  params: {
    actor: LoggedInUser;
    articleId?: string;
    url: URL;
    content: string;
    title: string;
    replyToId?: string;
  },
): Promise<SaveExternalArticleResult>;
```

`content` is the original validated URL string; `url` must be parsed from that
same string by the request boundary. Keeping
both preserves the currently stored text instead of normalizing it through
`URL.toString()`. Require `CreateArticle`, verify the actor's verification code
through `verifyDomainOwnership`, and return `unverified-domain` without writes
when verification fails. Preserve validation order: verification precedes loading
an existing article. Updating requires ownership and changes title/content;
creation records an external article with the actor and optional parent. Preserve
BAD_REQUEST for another author's article; return the saved ID on success.

### `src/lib/server/use-cases/comment.ts`

#### `saveComment`

```typescript
export function saveComment(
  deps: { db: AppDatabase },
  params: {
    actor: LoggedInUser;
    articleId?: string;
    content: string;
    commentId?: string;
    replyToId?: string;
  },
): Promise<{ articleId: string; commentId: string }>;
```

With `commentId`, load the required comment, reject another author's edit with
the existing BAD_REQUEST, and update its content. Return the stored article ID,
ignoring any submitted replacement article or parent. Without `commentId`, require
`articleId` (BAD_REQUEST when absent) and create the actor's comment with optional
parent. Return identifiers for the request boundary to refresh and redirect.
Content parsing and nonempty-form validation remain at the remote boundary.

### `src/lib/server/use-cases/invite_code.ts`

#### `getInviteQuota`

```typescript
export function getInviteQuota(deps: { db: AppDatabase }, params: { userId: string }): Promise<number>;
```

Read one consistent `InviteStats` aggregate from the repository and calculate
`Math.max(articleCount - validCodeCount - invitedCount, 0)` directly here.

#### `createInviteCode`

```typescript
export function createInviteCode(deps: { db: AppDatabase }, params: { actor: LoggedInUser }): Promise<InviteCode>;
```

Require `CreateArticle`, load a consistent statistics aggregate, and calculate the
same quota directly in this operation. Reject zero quota with existing BAD_REQUEST
`邀请码配额已用完`. Ask the repository to create an `ArticleAuthor` invite for the
actor with those exact statistics as a concurrency precondition. The repository
rechecks them and inserts atomically; a changed snapshot rejects with BAD_REQUEST
`邀请状态已变化，请重试`. Do not retry automatically or inject a business callback
into the repository. This prevents separate read/create calls from over-issuing
invitations while keeping the quota formula outside persistence.

#### `acceptInviteCode`

```typescript
export function acceptInviteCode(
  deps: { db: AppDatabase; now: () => Date },
  params: { actor: LoggedInUser; code: string },
): Promise<void>;
```

Load the invite and report PARAMETER_INVALID with `inviteCode` for a missing or previously used code.
Read `now` once, then call the atomic invitation-redemption repository operation
with the authenticated actor ID and timestamp. That operation rechecks unused
state inside its transaction, grants the code's role, and marks it used together.
A competing redemption cannot grant another role; any failed write rolls back
both effects. Preserve consumption when the actor already has that role; do not
introduce new self-invite or role-policy restrictions in this refactor.

### `src/lib/server/use-cases/session.ts`

#### `ValidateSessionResult`

```typescript
export type ValidateSessionResult = {
  session: Session;
  refresh: boolean;
};
```

#### `createSession`

```typescript
export function createSession(
  deps: {
    db: AppDatabase;
    now: () => Date;
    generateSessionId: () => string;
  },
  params: { userId: string },
): Promise<Session>;
```

Read the clock once and generate one session ID; persist a session expiring exactly
30 days after that instant. No cookie handling occurs here. Production composition
supplies the existing 32-character session-code generator.

#### `validateSession`

```typescript
export function validateSession(
  deps: { db: AppDatabase; now: () => Date },
  params: { sessionId: string },
): Promise<ValidateSessionResult | null>;
```

Read the clock once and load the session. Missing sessions return null. At or after
expiration, delete the session and return null. When a nonexpired session has at
most 20 days remaining, extend expiry to 30 days after the same clock value and
return `refresh: true`; otherwise return it unchanged with `refresh: false`.
Boundary equality is inclusive. Repository failures propagate, and successful
results carry the exact expiration that was persisted.

### `src/lib/server/use-cases/user.ts`

#### `validateSignUp`

```typescript
export function validateSignUp(deps: { db: AppDatabase }, params: { username?: string; name?: string }): Promise<void>;
```

For a supplied username, reject a leading `@` and an existing exact username; for
a supplied display name, reject an existing exact name. Preserve PARAMETER_INVALID
field keys/messages. Remote input adaptation trims optional form values and turns
empty values into absence before calling this operation. This preflight is not an
atomic reservation; creation still relies on database uniqueness constraints.

#### `updateUsername`

```typescript
export function updateUsername(
  deps: { db: AppDatabase },
  params: { actor: LoggedInUser; username: string },
): Promise<void>;
```

Reject a leading `@` with existing PARAMETER_INVALID feedback. Do nothing when the
username equals the actor's current username; otherwise update only that actor.
Preserve exact input (no added trimming, character policy, or uniqueness precheck).
The remote performs its existing redirect after either successful outcome.

#### `loginWithGitHub`

```typescript
export function loginWithGitHub(
  deps: {
    db: AppDatabase;
    now: () => Date;
    generateSessionId: () => string;
  },
  params: {
    githubUser: { id: number; username: string };
    signUp?: { username?: string; name?: string };
  },
): Promise<Session>;
```

Consume a trusted GitHub identity returned by the OAuth adapter. Reuse an account
with the provider ID, or create one using the supplied signup username/name with
GitHub username fallbacks and an empty biography. Reject a chosen username starting
with `@` as before. Existing account data is not overwritten by signup hints.
Create a session through `createSession` and return it. Provider exchange, OAuth
state/cookie parsing, cookie updates, and next-URL redirects stay in request code.
As before, account creation and session insertion are separate persistence calls.
