# e2e/support

Provide isolated databases, deployed application processes, prepared actor sessions, UI assertions, and checkout-wide
suite ownership for browser journeys.

## Files

### `e2e/support/fixtures.ts`

Supporting types and declarations used by the public signatures below (not additional exports):

```typescript
type Scenario = {
  prepare: (db: Client) => Promise<void>;
};

type Fixtures = {
  scenario: Scenario;
  db: Client;
  sessions: Map<string, string>;
  app: string;
  actor: (username: string) => Promise<Page>;
};
```

#### `test`

```typescript
export declare const test: TestType<
  PlaywrightTestArgs & PlaywrightTestOptions & Fixtures,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
>;
```

Extend Playwright with scenario.prepare, a dedicated pg Client, prepared sessions, the app origin, and an
actor(username) page factory. Each test resets and clones its title-derived database, prepares data, then starts
build/index.js on a dedicated port with matching APP_URL/ORIGIN and production behavior. Wait up to 20 seconds for
readiness; stop with SIGTERM and a five-second SIGKILL fallback. Every actor gets a separate browser context with a real
stored-session cookie. Close contexts and database connections on exit. Delete passed-test databases; preserve
failed-test databases and attach their name, plus failed application logs. Successful fixture teardown follows
dependency order so application processes stop before database deletion. Preparation and shutdown failure paths were
inspected but not exercised here.

#### `expect`

```typescript
export { expect } from '@playwright/test';
```

Re-export Playwright’s assertion API unchanged.

### `e2e/support/global-setup.ts`

#### `default`

```typescript
export default function globalSetup(config: FullConfig): Promise<void>;
```

List tests through a subprocess without running their setup, derive database names from each title, and reject
collisions with both conflicting titles. Then run pnpm build once with inherited output and reject nonzero or signaled
exit. Suite locking is acquired at configuration evaluation before global setup.

### `e2e/support/journeys.ts`

#### `articleContent`

```typescript
export declare function articleContent(page: Page, title: string, body?: string): Promise<void>;
```

Assert a visible exact H1 title and, when a truthy body is supplied, visible exact article body text.

#### `publishMarkdown`

```typescript
export declare function publishMarkdown(page: Page, title: string, body: string, previewBody?: string): Promise<string>;
```

Fill source as H1 plus body, open preview, assert title/body/validation state, submit publication, and return the
resulting /a/<id> pathname. previewBody defaults to body for plain-text expectations.

#### `comment`

```typescript
export declare function comment(page: Page, id: string): Locator;
```

Locate the stable `comment-<id>` anchor on the supplied page.

#### `postComment`

```typescript
export declare function postComment(page: Page, text: string): Promise<string>;
```

Submit text, require a post-submit comment fragment and cleared textbox, assert each line is visible, and return the
comment ID from the resulting URL.

#### `restricted`

```typescript
export declare function restricted(page: Page): Promise<void>;
```

Assert a visible 401/403 error heading and absence of textboxes.

### `e2e/support/names.ts`

#### `databaseSuffix`

```typescript
export declare function databaseSuffix(title: string): string;
```

Lowercase the title, replace runs outside ASCII a–z/0–9 with hyphens, strip end hyphens, truncate to 52 characters,
strip a resulting trailing hyphen, then prefix e2e-. Reject an empty slug. The result fits the provisioning 56-character
suffix limit; collision detection belongs to global setup.

### `e2e/support/suite-lock.ts`

#### `acquireSuiteLock`

```typescript
export declare function acquireSuiteLock(): void;
```

Synchronously acquire checkout .direnv/e2e-suite.lock before Playwright clears output. An inherited
EXODUS_E2E_LOCK_TOKEN grants access only if the owner file token matches. A new owner writes PID/token, exports the
token, and releases the lock on normal process exit. Existing locks cause an error instead of output cleanup; malformed
ownership does not grant access. Failure writing ownership removes the newly created lock. Abrupt termination can leave
a stale lock requiring manual investigation.
