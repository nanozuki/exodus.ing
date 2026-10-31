# .

Configure building, type checking, test execution, local infrastructure,
formatting, and deployment. These root entry points are consumed by tools rather
than application callers.

## Files

### `.dockerignore`

Build-context exclusions omit dependencies, output, local environment/state,
editor files, and operating-system metadata while allowing the example/test
environment files selected by its negation rules. Runtime secrets are not
supplied by this file.

### `.gitignore`

Version-control exclusion entry point: ignore local dependencies, generated
outputs, environment/state, editor files, test results, and SQLite artifacts,
retaining the explicitly allowed environment example/test filenames. No
application runtime effect.

### `.npmrc`

Package-manager entry point: engine-strict=true requires supported dependency
engine constraints during installation.

### `.prettierignore`

Formatter exclusion entry point: skip package-manager lockfiles, migrations, and
test-results. Other source/document files remain eligible for the project-wide
formatter.

### `.prettierrc`

Formatter configuration: single quotes, print width 120, Svelte/Tailwind
plugins, and Svelte parser override. Tooling owns formatting; application
runtime does not load this file.

### `Dockerfile`

Tool entry point: multi-stage Node 24.21.0 slim build. Enable Corepack, install
production dependencies and full build dependencies with frozen lockfiles using
cached pnpm storage, run the application build, and copy package metadata,
production dependencies, and build output to the runner. Run `node build` in
production and expose port 3000.

### `drizzle.config.ts`

#### `default`

```typescript
declare const config: import('drizzle-kit').Config;
export default config;
```

Use PostgreSQL `src/lib/server/db/schema.ts`, migrations output, verbose/strict
schema operations, and environment PG credentials. Convert PGPORT with Number.
Set SSL false only when PGSSLMODE=disable, otherwise leave it unspecified.
Import-time effect: read the environment while constructing the config; schema
tools perform database actions later.

### `eslint.config.js`

#### `default`

```typescript
declare const config: import('eslint').Linter.Config[];
export default config;
```

Compose recommended JavaScript and TypeScript checks with Prettier/Svelte
configurations, browser and Node globals, and the TypeScript parser for Svelte.
Ignore build, generated SvelteKit, dist, and dependency directories.

### `flake.nix`

Nix flake exports per-system process-compose pg and a development shell for
Linux/macOS on x86_64/aarch64. The checkout service owns .direnv/pg, manager
socket/logs, port 62545, exodus superuser, and explicit local/TCP authentication
configuration. It creates no application database automatically. The shell
supplies matching PostgreSQL environment values, APP_URL, Node/pnpm, language
servers, pgcli, and Fly tooling; it does not start PostgreSQL merely on entry.

### `fly.toml`

Deployment configuration: exodus-ing in fra, application port 3000, forced
HTTPS, automatic start/suspend with zero minimum machines, and one shared
CPU/256MB machine. APP_URL is https://exodus.ing; database/provider credentials
come from external runtime configuration.

### `package.json`

Package/tool entry point: ESM application with pinned pnpm package-manager
version. dev ensures the dev database before starting Vite with exodus-dev.
build uses Vite; preview supplies its local APP_URL. check/check:e2e sync
generated SvelteKit types before checking. test runs unit, script-integration,
then browser suites; database export/push/pull/studio and explicit pg lifecycle
commands remain distinct. `db:export` writes to
`src/lib/server/db/database.sql`; provisioning and schema tools use the
extracted db module. Observed side effect: the script named lint runs Prettier
with --check --write before ESLint, so it can modify files. Dependency versions
remain authoritative in this file and the lockfile.

### `playwright.config.ts`

Import-time effect: acquireSuiteLock before exporting configuration or clearing
test output. The owner token is inherited by discovery and workers.

#### `default`

```typescript
declare const config: import('@playwright/test').PlaywrightTestConfig;
export default config;
```

Run e2e tests fully parallel with two workers, zero retries, 60-second timeout,
list reporting, and global setup. Retain failed traces/screenshots and
optionally use PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. No shared webServer is
configured; fixtures start per-test deployments.

### `pnpm-workspace.yaml`

Workspace/package policy: allow the listed native build dependency esbuild.
Package-level onlyBuiltDependencies also names esbuild; no multi-package source
layout is declared.

### `svelte.config.js`

#### `default`

```typescript
declare const config: import('@sveltejs/kit').Config;
export default config;
```

Configure Vite preprocessing, the Node deployment adapter, experimental remote
functions, and asynchronous component compilation. Remote imports use their
owning page/component paths; no `$remotes` alias remains. Tool evaluation
constructs preprocessors/adapter, not application services.

### `tsconfig.json`

Compiler entry point: extend generated .svelte-kit/tsconfig.json, enable strict
JS/TS checking, resolve JSON modules with bundler module resolution, and load
Svelte icon types. Generated configuration owns aliases and include defaults.
Requires SvelteKit sync before a fresh checkout can resolve the extended file.

### `vite.config.ts`

#### `default`

```typescript
declare const config: import('vitest/config').UserConfig;
export default config;
```

Configure Tailwind, SvelteKit, and auto-installed Svelte icons; emit build
sourcemaps. Require assertions in tests. The client project runs
\*.svelte.test/spec files in headless Chromium, excluding server modules; the
server project runs other src test/spec files in Node, including repository
integration and use-case unit tests. Repository suites use explicitly bounded
setup/test timeouts sufficient for local database provisioning. This file does
not register vitest-setup-client.ts as setupFiles.

### `vitest-setup-client.ts`

Import-time test-environment effect: register jest-dom assertions and overwrite
window.matchMedia with a writable/enumerable vi.fn stub returning matches=false,
supplied media, and mocked listener/dispatch methods. Requires a window/Vitest
environment. No public exports. Current vite.config.ts does not connect this
file to a test project.
