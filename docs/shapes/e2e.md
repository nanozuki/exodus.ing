# e2e

Register independent browser journeys for public reading, publication, discussion, permissions, account settings, and
invitations. Tests use the shared deployment/database fixtures in the support directory.

## Files

### `e2e/account.test.ts`

Implicit Playwright registration; exports no public names. Assert profile and username updates survive reload, cancelled
changes leave identity unchanged, invalid names/usernames preserve stored values, invitation create/delete restores
quota, and redemption updates role/navigation for independent actors.

Registered journeys:

- User updates profile and account identity
- User corrects invalid profile and account input
- Author manages invitations and invites a new author
- Reader corrects an invalid invitation before becoming an author

Uses the shared per-test deployment/database fixtures. Inspected assertions are evidence of intended observable flows;
no journey was executed during this derivation.

### `e2e/discussion.test.ts`

Implicit Playwright registration; exports no public names. Assert multiline comment author/parent/count behavior, nested
direct replies, cancellation and persisted edits without added count, and bookmark add/remove state across article
reloads and both saved-list pages. A scenario removes a prepared bookmark and adjusts its count before the bookmark
journey.

Registered journeys:

- Two users exchange comments and replies
- User cancels and saves edits to an existing comment
- User adds and removes a bookmark

Uses the shared per-test deployment/database fixtures. Inspected assertions are evidence of intended observable flows;
no journey was executed during this derivation.

### `e2e/permissions.test.ts`

Implicit Playwright registration; exports no public names. Assert anonymous action return destinations, 401/403
restrictions, reader author-feature restrictions, other-author editor denial without stored-content changes, and lost
access after sign-out.

Registered journeys:

- Visitor receives authentication guidance for protected actions
- Reader and author cannot edit another author's article
- User signs out and loses authenticated access

Uses the shared per-test deployment/database fixtures. Inspected assertions are evidence of intended observable flows;
no journey was executed during this derivation.

### `e2e/public-reading.test.ts`

Implicit Playwright registration; exports no public names. Assert creation-descending homepage pagination, author
profile tabs and pagination, rendered Markdown with a controlled image response, external-content links, empty
reader/bookmark collections, and missing-resource 404s. Scenarios add archive records or remove collections within the
test database.

Registered journeys:

- Visitor browses articles and an author profile
- Visitor reads Markdown and external articles
- Reader profiles and empty collections remain usable
- Missing articles and users show a not-found result

Uses the shared per-test deployment/database fixtures. Inspected assertions are evidence of intended observable flows;
no journey was executed during this derivation.

### `e2e/publishing.test.ts`

Implicit Playwright registration; exports no public names. Assert Markdown creation/editing/validation, external
publication with failed then matching real DNS ownership, and nested article responses with direct-parent links/counts
across reload and delayed navigation. The external case uses owner-provided crows.moe DNS, changes only its test author
verification code, and depends on public DNS availability.

Registered journeys:

- Author publishes and edits a Markdown article
- Author corrects invalid Markdown before publishing
- Author verifies a domain to publish and edit an external article
- Author creates and follows nested article responses

Uses the shared per-test deployment/database fixtures. Inspected assertions are evidence of intended observable flows;
no journey was executed during this derivation.

### `e2e/tsconfig.json`

Type-check browser tests and support code using the root compiler configuration, including playwright.config.ts and the
application ambient types. No runtime registration occurs.
