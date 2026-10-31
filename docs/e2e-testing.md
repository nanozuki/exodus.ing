# E2E Testing

This document defines the intended E2E coverage and test lifecycle. It is a
specification for implementing and maintaining the suite, rather than a claim
that every case below is already implemented. Read it when adding E2E coverage
or changing its fixtures and execution environment.

## Responsibilities

E2E tests exercise user journeys through the browser, application server, and
real PostgreSQL database. They protect navigation, forms, permissions as
experienced by users, rendered results, and persistence across reloads.

Use one test for a coherent journey containing related operations and
assertions. Publishing and then editing an article can share a test; unrelated
account and article operations belong in separate tests. Each test runs
independently of test order and the results of other tests. Use named steps to
identify failures within longer journeys.

Assert observable behavior using accessible roles, labels, text, and meaningful
links. Keep selectors independent of styling classes and DOM nesting. Check the
results of writes immediately and after reloading. Assertions below describe
behavioral contracts; exact labels, page layout, and interaction mechanics may
change without changing the purpose of a case.

Place exhaustive rule combinations in unit tests and database constraints,
transactions, concurrency, and direct-request authorization in integration
tests. Examples include Markdown parsing and sanitization, invite quota
calculations, session expiration, duplicate bookmark operations, and atomic
invitation redemption. Test JSON Feed through HTTP integration tests. Test
GitHub OAuth with controlled provider responses; ordinary E2E journeys start
with a prepared session. Add component tests for isolated editor or form
behavior when browser journeys would otherwise repeat many input combinations.

## Application and authentication

Build the application once per suite run. Run tests against the compiled
adapter-node output, using the same application entry point as deployment. Each
test starts its own application process with its database, a dedicated port, and
a matching public origin. Wait for readiness before browser operations.

For authenticated journeys, create a real session in that test's database and
install its cookie in the browser context. Exercise normal server-side session
validation and authorization. Multiple actors use separate browser contexts
sharing the test's application and database. Production behavior remains
enabled; the suite does not depend on the development-only simulated login page.

## Database lifecycle

Use the existing PostgreSQL provisioning tools to clone the seeded template for
each test. Keep development data separate. Derive the database name solely from
the meaningful test name: `exodus-e2e-<test-slug>`. Normalize the name into the
supported character set and length. Check for slug collisions before execution
and report conflicting test names.

For every test, perform these steps in order:

1. Delete its previous database, then clone a fresh database from the template.
2. Prepare scenario-specific data and authentication, and start its application
   process connected to that database.
3. Execute the browser journey and its assertions.
4. Stop the application and close test-owned database connections on every exit
   path, including setup and assertion failures.
5. After success, delete the database. After failure, preserve any database
   created for the test, retain the browser trace, and report the database name
   alongside the failure.

The next execution of the same test deletes the previous failure's database.
Keep automatic retries disabled initially so that a retry does not erase the
failure under investigation. Prevent overlapping suite runs in the same
checkout, where identical test names would target the same databases. Different
tests may run concurrently with independent databases and application processes.

## External domain verification

Use the owner-provided domain `crows.moe` for the external-article journey. Its
configured TXT record is:

```text
exodus-site-verification=g8nlb5qg59n11wh6f7bpgnqc9wb2muaq
```

Prepare the test author with that verification code in the test database. Use an
HTTPS article URL on this domain; publishing the link verifies the hostname and
does not require fetching the linked article. Check the resulting link without
depending on the external page's content or availability.

To exercise verification failure first, give the author a different code,
submit, then set the matching code and reload the form before submitting again.
Change only the test database; the public DNS record remains unchanged.

This journey intentionally uses real DNS and depends on the record and resolver
being available. Preserve and report lookup failures rather than silently
skipping the case or substituting success. Cover DNS error variants and response
parsing with controlled responses in integration tests.

## Test cases

Operations and assertions within each case appear in execution order. Initial
conditions are prepared independently through the shared fixtures. Case ordering
below does not imply execution dependencies. The public-read cases also cover
representative titles, authors, dates, and counts; other journeys focus their
assertions on the behavior they change.

**test: Visitor browses articles and an author profile**

- operation: Open the homepage as a visitor.
- assertion: The expected first-page articles and representative metadata appear
  in the expected order.
- operation: Navigate to the next page.
- assertion: The URL and article list reflect the selected page without
  repeating first-page items.
- operation: Open an article, then follow its author link.
- assertion: The article and profile identify the expected content and author.
- operation: Switch between the author's articles and comments and paginate the
  lists.
- assertion: Each list belongs to the author and reflects the selected tab and
  page.
- operation: Reload the profile.
- assertion: The selected tab, page, and content remain consistent.

**test: Visitor reads Markdown and external articles**

- operation: Open an article containing representative Markdown features.
- assertion: Its title is correct and is not duplicated as the extracted title
  in the body.
- assertion: Headings, paragraphs, links, quotes, lists, code, tables, and a
  controlled sample image render correctly.
- operation: Open an external article.
- assertion: Its title, author, external-content notice, and original-article
  link are correct, and interaction sections remain available.

**test: Reader profiles and empty collections remain usable**

- operation: Open a non-author's profile containing comments.
- assertion: The profile shows the reader's information and comments without
  offering an author article tab.
- operation: Open a profile with no comments.
- assertion: The empty collection renders without errors or unusable pagination.
- operation: Open bookmarks as a user with no saved articles.
- assertion: An understandable empty state appears.

**test: Missing articles and users show a not-found result**

- operation: Visit a nonexistent article, then a nonexistent user.
- assertion: Each visit shows a not-found result without exposing another
  resource's content.

**test: Author publishes and edits a Markdown article**

- operation: As an author, enter the creation flow and choose Markdown.
- operation: Enter a title and formatted body.
- assertion: The preview reflects the content and publishing is available.
- operation: Publish the article.
- assertion: The resulting detail page shows the new article and correct author.
- operation: Reload and reopen editing.
- assertion: Editing starts with the saved source content.
- operation: Change the title and body, save, and reload the detail page.
- assertion: The revised content persists.
- operation: Visit the homepage and the author's article list.
- assertion: Both show the updated title and link to the saved article.

**test: Author corrects invalid Markdown before publishing**

- operation: As an author, enter a body without the required title.
- assertion: The editor explains the missing title and prevents successful
  publication.
- operation: Add the required title.
- assertion: Validation and preview reflect the corrected content.
- operation: Publish.
- assertion: The resulting article contains the corrected title and body.

**test: Author verifies a domain to publish and edit an external article**

- operation: As an author with a nonmatching verification code, enter a title
  and article URL on the configured domain.
- assertion: The form explains which domain and TXT record require verification.
- operation: Submit the article.
- assertion: Verification fails, input remains available, and no article is
  created.
- operation: Prepare the matching author verification code, reload the form, and
  submit the article again.
- assertion: Publication succeeds and the detail page shows the correct title
  and original URL.
- operation: Edit the title and article URL on the verified domain, save, and
  reload.
- assertion: The updated title and link persist.

**test: Author creates and follows nested article responses**

- operation: As an author, start a response from an existing article.
- assertion: The editor identifies the article being answered.
- operation: Write and publish the response.
- assertion: The response links to its parent; the parent lists it and shows the
  correct response count.
- operation: Publish a response to the newly created response.
- assertion: Each response identifies its direct parent and the relationship can
  be followed through the pages.
- operation: Reload the affected articles.
- assertion: Relationships and counts persist.

**test: Two users exchange comments and replies**

- operation: As user A, submit a multiline comment on an article.
- assertion: The comment shows the correct author and text, the count increases,
  the page identifies the new comment, and the input resets.
- operation: In a separate context, user B selects that comment for a reply.
- assertion: The input identifies the intended reply target.
- operation: Submit B's reply, then have A reply to B.
- assertion: Both replies identify their authors and direct targets; the count
  reflects the added comments.
- operation: Reload the article and visit A's profile comments.
- assertion: The discussion persists and A's comments link to the correct
  article.

**test: User cancels and saves edits to an existing comment**

- operation: As the comment author, open editing.
- assertion: The input contains the saved comment.
- operation: Change the content and cancel.
- assertion: The original comment remains unchanged and the input leaves editing
  mode.
- operation: Edit again, save different content, and reload.
- assertion: The same comment contains the new text without duplication or a
  count increase.
- operation: View the comment as another user.
- assertion: Editing the other user's comment is unavailable.

**test: User adds and removes a bookmark**

- operation: As a user, bookmark an article that is not yet saved.
- assertion: Its bookmark state changes and its count increases by one.
- operation: Reload, then find the article in the paginated bookmark list.
- assertion: The saved state persists and the list links to the correct article.
- operation: Return to the article and remove the bookmark.
- assertion: The state and count return to their original values.
- operation: Reload and revisit the bookmark list.
- assertion: The removal persists and the article is absent from the saved
  collection.

**test: User updates profile and account identity**

- operation: As a user, change the display name and Markdown biography and save.
- operation: Open and reload the public profile.
- assertion: The updated name and rendered biography persist.
- operation: Open username editing, change the value, and cancel.
- assertion: The dialog closes, focus returns to the edit button, and the
  username remains unchanged.
- operation: Reopen username editing without reloading.
- assertion: The input contains the saved username rather than the discarded
  edit.
- operation: Dismiss username editing with Escape, then reopen and click
  outside.
- assertion: Each dismissal closes the dialog and restores focus to the edit
  button.
- operation: Submit an available new username.
- assertion: The resulting profile uses the new address.
- operation: Reload and revisit account settings.
- assertion: The username persists and current profile links use the new
  address.

**test: Username dialog fits its content while opening and typing**

- operation: Open username editing at desktop and narrow viewport widths.
- assertion: The dialog has no horizontal or vertical content overflow when its
  contents fit the viewport.
- operation: Move focus between the username input and cancel button, then type
  a username while sampling the dialog's content dimensions across animation
  frames.
- assertion: Focus changes and typing do not introduce horizontal or vertical
  overflow.

**test: Autofill controls stay aligned inside the username dialog**

- operation: Open username editing and inject a fixed-position control using
  viewport coordinates, as password managers do.
- assertion: The control stays aligned with the input and does not introduce
  horizontal or vertical dialog overflow.

**test: User corrects invalid profile and account input**

- operation: As a user, attempt to save an empty display name.
- assertion: Required-field feedback appears and saved profile data remains
  unchanged.
- operation: Supply a valid name and save.
- assertion: The corrected profile is saved.
- operation: Attempt to change the username to a value beginning with @.
- assertion: Validation explains the problem, the dialog remains open with its
  input preserved, and the saved username remains unchanged.
- operation: Correct the username to an available value and submit.
- assertion: The update succeeds and opens the correct profile.

**test: Author manages invitations and invites a new author**

- operation: As author A with available quota, create an invitation.
- assertion: The unused invitation appears and remaining quota decreases.
- operation: Delete that invitation.
- assertion: It disappears and quota is restored.
- operation: Create another invitation and redeem it as reader B in a separate
  browser context.
- assertion: B becomes an author, sees A as the inviter, and can enter article
  creation.
- operation: Reload B's page and A's invitation page.
- assertion: B's permissions persist, A lists B as an invitee, and the redeemed
  code is absent from unused invitations.

**test: Reader corrects an invalid invitation before becoming an author**

- operation: As a reader, submit a nonexistent invitation code.
- assertion: An appropriate error appears and author privileges remain
  unavailable.
- operation: Submit an already-used invitation code.
- assertion: An appropriate error appears and permissions remain unchanged.
- operation: Submit a valid prepared invitation code.
- assertion: Redemption succeeds and author features become available.

**test: Visitor receives authentication guidance for protected actions**

- operation: As a visitor, attempt to bookmark an article.
- assertion: Authentication is requested with the article retained as the return
  destination.
- operation: Follow the article's comment sign-in entry point.
- assertion: Authentication retains the article and comment section as the
  return destination.
- operation: Directly visit account settings and article creation.
- assertion: Access is restricted and protected content remains unavailable.
- operation: View the authentication page.
- assertion: Registration, sign-in, and GitHub authorization entry points are
  available.

**test: Reader and author cannot edit another author's article**

- operation: As a reader, view an author's article and directly visit article
  creation and invitation management.
- assertion: Author operations are unavailable and protected pages restrict
  access.
- operation: As another author, view the original article and directly visit its
  editing address.
- assertion: Editing is unavailable, access is restricted, and the original
  article remains unchanged.

**test: User signs out and loses authenticated access**

- operation: As a signed-in user, open account settings.
- assertion: The current user's information and permitted navigation appear.
- operation: Sign out through the page and reload.
- assertion: The application continues to identify the visitor as signed out.
- operation: Revisit account settings, then an article.
- assertion: Protected settings restrict access and the article offers sign-in
  guidance for commenting.
