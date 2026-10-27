# e2e

Configure browser-test type checking. Shared deployment/database fixtures and
journey helpers live in the support directory; dedicated test files are outside
the shape inventory.

## Files

### `e2e/tsconfig.json`

Type-check browser tests and support code using the root compiler configuration, including playwright.config.ts and the
application ambient types. No runtime registration occurs.
