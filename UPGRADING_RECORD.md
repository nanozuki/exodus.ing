# Upgrading Record

## Progress — 2026-10-28

- Completed: 28 of 38 npm dependency upgrades, verified against package.json and the installed versions.
- Pending: 10 dependencies. Five require code/configuration migration; five were rolled back to preserve compatible version combinations. See [remaining upgrade work](upgrade/README.md).
- Validation after rollback and fixes: no peer dependency issues; frozen-lockfile installation, ESLint, formatting, application/E2E type checks, and production build passed. All 73 tests passed: 41 unit/component/database, 12 script integration, and 20 E2E.
- The two error wrappers now preserve their original cause, and the formatting failures are fixed.
- Removed minimumReleaseAgeExclude for now. Future maintenance of these exceptions is deferred; dependency installation was not rerun after this configuration cleanup.
- Docker changes and melt remain outside this work.

## nix flakes

- [x] nix flake update
- [x] pnpm self-update

## major npm packages

- [x] @eslint/js ^9.39.2 → ^10.0.1
- [ ] @sveltejs/adapter-node ^5.5.2 → ^6.0.0
- [ ] @sveltejs/kit ^2.50.1 → ^3.1.0
- [ ] @sveltejs/vite-plugin-svelte ^6.2.4 → ^7.3.1
- [x] @testing-library/jest-dom ^6.9.1 → ^7.0.1
- [x] @types/node ^25.1.0 → ^26.6.5
- [ ] @vitest/browser-playwright ^4.0.18 → ^5.0.5
- [x] eslint ^9.39.2 → ^10.13.0
- [x] jsdom ^27.4.0 → ^30.1.3
- [x] nanoid ^5.1.6 → ^6.0.2
- [x] prettier-plugin-svelte ^3.4.1 → ^4.1.1
- [ ] typescript ^5.9.3 → ^7.0.2
- [x] unplugin-icons ^23.0.1 → ^24.0.0
- [ ] vite ^7.3.1 → ^8.3.5
- [ ] vitest ^4.0.18 → ^5.0.5
- [ ] vitest-browser-svelte ^2.0.2 → ^3.1.0

## version zero packages

- [x] @flydotio/dockerfile ^0.7.10 → ^0.7.14
- [x] drizzle-kit ^0.31.8 → ^0.31.11
- [x] drizzle-orm ^0.45.1 → ^0.45.4
- [x] prettier-plugin-tailwindcss ^0.7.2 → ^0.8.1
- [ ] runed ^0.37.1 → ^0.38.0

## Minor Backwards-compatible features

- [x] @playwright/test ^1.58.1 → ^1.64.1
- [x] @tailwindcss/vite ^4.1.18 → ^4.3.3
- [x] @testing-library/svelte ^5.3.1 → ^5.4.2
- [x] @types/pg ^8.16.0 → ^8.23.1
- [x] date-fns ^4.1.0 → ^4.4.0
- [x] eslint-plugin-svelte ^3.14.0 → ^3.23.1
- [x] globals ^17.2.0 → ^17.13.0
- [x] pg ^8.18.0 → ^8.23.1
- [x] playwright ^1.58.1 → ^1.64.1
- [x] prettier ^3.8.1 → ^3.9.10
- [x] svelte ^5.49.1 → ^5.57.3
- [ ] svelte-check ^4.3.6 → ^4.7.7
- [x] tailwind-merge ^3.4.0 → ^3.7.0
- [x] tailwindcss ^4.1.18 → ^4.3.3
- [x] typescript-eslint ^8.54.0 → ^8.72.1
- [x] zod ^4.3.6 → ^4.6.7

## Patch Backwards-compatible bug fixes

- [x] @iconify-json/material-symbols-light ^1.2.53 → ^1.2.98
