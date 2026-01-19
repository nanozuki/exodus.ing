# Plan: Build E2E Testing

## Goals

- Use playwright build e2e testing, as the main confidence layer
- For some logic-heavy parts, Add some unit/integration tests as a supplement.
- Persistant testing data set. Use Postgres template to produce testing and
  development databases and reset them fast
- Build pipelines to run e2e tests before merging
- Add dependency bot to keep dependencies up to date

## Architecture

- use script to build template Postgres DB, clone/reset dev database
- use testing code to clone DB and delete after tests
- use TypeScript as first choice for write scripts, fish shell as second choice.
  Scripts lie in `src/scripts/` folder.

## Principles

- Testing code should readable and maintainable and production-standard

## Implementation Steps

### Build testing dataset

All data models defined in @src/lib/server/repository/schema.ts

#### Testing Dataset should show these features:

- Article List Pagination
  - Page size is `ARTICLE_PAGE_SIZE`
- Markdown rendering with all features and styles
  - markdown styles defined in @src/lib/complement/markdown.css
- User roles, `ArticleAuthor`, and none-role users
- Bookmarks, and user bookmarked article list, and it's pagination
- comments on articles, and user comments list, and it's pagination
- Article's replies
  - one article has multiple articles reply to it
  - reply can be multiple levels deep
- comments replies
  - one comment has multiple comments reply to it
  - reply can be multiple levels deep
- User invitation
  - Some user are invited by site admin
  - Some user are invited to be auther by other author
  - Some user create invite code but not used

#### Testing Dataset Design:

**HELP ME:** Complete the testing dataset design to cover all features mentioned
above. For example:

- tInviteCode, tSession, tUserAuth, tPendingAuth: No need initial data
- tArticle: 25 articles, in order to display pagination
  - For No.25 (latest) article, need to fully display all markdown features and styles,
    the markdown styles defined in @src/lib/complement/markdown.css

### Create a “build template DB” script

Create an script to:

- create template database, mark it as template
- seed all designed dataset in last section
- copy/delete development database

### Setup testing

Add on example e2e test case with playwright, copy database, and drop it after
test

### Design test cases

- For all pages, test rendering for main content
- Testing all mutation related to form remote functions
- Page navigation
- Client side interactions

**HELP ME:** retrieve all routes in src/routes and design test cases in natural
language

### Implementate test cases

- Extract common code to helper function/object/class
- Makes all tests green in local

### Add Github Actions

1. Use `services: postgres` to start Postgres
2. Run it in PR, only merge to main branch when all tests green
3. Add dependency bot to upgrade dependencies weekly, create PR, if all tests
   green, merge it automatically

## Success Criteria

1. I can run development environment, get fresh dataset, get preview for all
   features from dev server.
2. I can run all e2e tests in local, all tests green. Each test case has
   separate database, easy to get/drop database.
3. All e2e tests run in CI, all tests green.
4. Updates dependencies weekly, if all tests green, merge it automatically.
