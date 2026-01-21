# Plan: Build E2E Testing

## Goals

- Use Playwright as the main confidence layer for E2E tests
- Add unit/integration tests for logic-heavy modules as a supplement
- Persistent test dataset via Postgres template DB for fast dev/testing resets
- Add CI pipeline to run E2E tests before merging
- Add Dependabot to keep dependencies up to date

## Architecture

- Use scripts to build template Postgres DB and clone/reset dev database
- Template DB name is fixed: `exodus-template`
- Per-spec test DB name: `exodus-test-${specBaseName}` (sanitize filename)
- Test setup clones DB and drops it after each spec suite
- Use TypeScript first; fish shell second
- Scripts live in `src/scripts/`
- Database connection uses `EXODUSING_DATABASE` from `src/lib/server/config.ts`

## Principles

- Testing code should be readable, maintainable, and production-standard
- Seed data uses fixed IDs and timestamps for stable assertions
- Seed data uses `encodeIdPath` for article/comment paths

## Implementation Steps

### Build testing dataset (COMPLETED)

All data models defined in `src/lib/server/repositories/schema.ts`

#### Testing dataset should cover these features:

- Article list pagination
  - Check the article listing order
  - Check first article's content
  - Page size is `ARTICLE_PAGE_SIZE`
- Markdown rendering with all features and styles
  - markdown styles defined in `src/lib/component/markdown.css`
  - include a full-featured markdown sample written in Chinese
- External article content rendering (`contentType = external`)
- User roles, `ArticleAuthor`, and no-role users
- Bookmarks: user bookmarked list and pagination
- Comments on articles, user comments list, and pagination
- Article replies
  - one article has multiple reply articles
  - replies can be multiple levels deep
- Comment replies
  - one comment has multiple reply comments
  - replies can be multiple levels deep
- User invitations
  - Some users are invited by site admin
  - Some users are invited to be author by another author
  - Some users create invite codes that are unused

#### Testing Dataset Design:

**General**

- Use fixed timestamps (e.g. `2024-01-01T00:00:00Z` with 1-minute increments)
- Use fixed IDs for deterministic assertions
- Use `encodeIdPath` for article/comment paths
- `contentType` values: `markdown` or `external`
- `inviterId` null means site admin invited

**tUser (6 users)**

- `user_reader_3`: `frank` (no role)
- `user_author_1`: `alice` (ArticleAuthor)
- `user_author_2`: `bob` (ArticleAuthor)
- `user_reader_1`: `carol` (no role)
- `user_reader_2`: `dave` (no role)
- `user_invited_author`: `erin` (ArticleAuthor, invited by `user_author_1`)

**tUserRole**

- (`user_author_1`, `article_author`, inviter `null` → site admin)
- (`user_author_2`, `article_author`, inviter `null` → site admin)
- (`user_invited_author`, `article_author`, invited by `user_author_1`)

**tInviteCode**

- `INVITE_AUTHOR1_USED`: role `article_author`, inviter `user_author_1`, `usedAt` set
- `INVITE_AUTHOR2_USED`: role `article_author`, inviter `user_author_2`, `usedAt` set
- `INVITE_AUTHOR1_UNUSED`: role `article_author`, inviter `user_author_1`, unused
- `INVITE_AUTHOR2_UNUSED`: role `article_author`, inviter `user_author_2`, unused

**tArticle (26 articles to trigger pagination)**

- `A01–A20`: normal articles (10 by `user_author_1`, 10 by `user_author_2`)
- Replies (multi-level):
  - `A21` root article
  - `A22` reply to `A21`
  - `A23` reply to `A21`
  - `A24` reply to `A22` (depth 3)
- `A25` newest article: full markdown showcase (English)
  - headings H1-H6, paragraphs, links, `hr`, image, blockquote nesting
  - inline code, code block, table, ordered/unordered lists
- `A26` newest article: full markdown showcase (Chinese)
  - same feature coverage as `A25`, but content is entirely Chinese
- Five external article with `contentType = external`
- Ensure `replyCount`, `bookmarkCount`, `commentCount` reflect the seed data

**tBookmark**

- `user_reader_1` bookmarks 22 articles (pagination > `ARTICLE_PAGE_SIZE`)
- `user_reader_2` bookmarks 3 articles
- At least one article (e.g. `A25`) is bookmarked by 3+ users to verify multi-bookmark counts

**tComment**

- On `A25`: 8 top-level comments with nested replies to depth 3
- On `A21`: 4 comments
- `user_reader_1` has 22 comments total across articles (pagination > `COMMENT_PAGE_SIZE`)

**tInviteCode / tSession / tUserAuth / tPendingAuth**

- No initial data required for sessions/auth flows

### Create a “build template DB” script (COMPLETED)

Create scripts to:

- `create-template-db`: drop and recreate template DB, seed dataset
- `create-dev-db`: drop and recreate dev DB, clone from template

### Add login simulation for testing (COMPLETED)

- Add a button after "使用 GitHub 登录", label "模拟登录", variant="normal"
- Click button to open a new window `/auth/testing?next=...`
- `/auth/testing/+page.server.ts` blocks production (`import.meta.env.PROD`)
- `/auth/testing/+page.svelte` lists all users with raw role keys in button labels
- Clicking a user button creates a session cookie like `handleGithubCallback`
- If `next` exists, redirect to `next`, otherwise redirect to `/`
- Close the window after login completes

This function is only available in dev/test environment

### Setup testing

- Add one example e2e test case with Playwright
- For each spec, clone template DB to per-spec DB
- Drop per-spec DB after the spec suite completes
- Run Playwright as a single run (no sharding initially)

### Design test cases

**Public**

- `/` (home)
  - Renders article list with pagination (`ARTICLE_PAGE_SIZE = 20`)
  - Clicking article opens `/a/[articleId]`
  - Shows reply/comment/bookmark counts
- `/a/[articleId]`
  - Renders markdown showcase (all styles from `src/lib/component/markdown.css`)
  - Shows reply chain to depth 3
  - Shows comments with nested replies
  - Bookmark toggle updates count
  - Edit badge visible for author, hidden for non-author
- `/u/[username]`
  - Shows user profile
  - Shows user article list pagination
  - Shows user comment list pagination (`COMMENT_PAGE_SIZE = 20`)
- `/feeds/articles.json`
  - Returns JSON with `id/title/author/updatedAt`
  - Response length matches `last` query param

**Auth**

- `/auth`
  - Shows GitHub/Google sign-in UI (no OAuth flow in e2e)

**Console (requires auth)**

- `/console/profile`
  - Update profile (name/about) persists
- `/console/account`
  - Renders account settings; verify data loads
- `/console/bookmarks`
  - Bookmarked article list + pagination
- `/console/invites` (author only)
  - Create invite code
  - Lists invitees and unused codes
- `/console/be-writer` (non-author only)
  - Accept invite code flow

**Article Edit**

- `/a/[articleId]/edit`
  - Author can edit title/content and save
  - Non-author redirected or blocked

### Implement test cases

- Extract common code to helper function/object/class
- Make all tests green locally

### Add Github Actions

1. Use `services: postgres` to start Postgres
2. Run in PRs, only merge to main when all tests are green
3. Add Dependabot to upgrade dependencies weekly and auto-merge when checks pass

## Success Criteria

1. I can run the dev environment, reset the dataset, preview all features.
2. I can run all E2E tests locally; each spec has a separate database and is easy to create/drop.
3. All E2E tests run in CI and pass.
4. Dependencies update weekly; auto-merge if all tests are green.

## Future Improvements

1. Automated generate src/lib/server/repositories/database.sql
