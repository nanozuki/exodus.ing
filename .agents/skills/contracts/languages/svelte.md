# Svelte

- A component is one declaration named after its file, the name importers use:
  `Dialog.svelte` is `Dialog`, so its tests group under `describe('Dialog')`.
- Its test file is `Dialog.svelte.test.ts`. A `Foo.test.svelte` file is a
  harness that renders a component for a test, not a component of its own.
- The `$props()` destructuring is implementation, invisible to importers. State
  a default the caller needs with `@default` on the prop, as
  [Comments](../../../../docs/code-style.md#comments) describes.
- SvelteKit route files pair the same way: `+server.ts` ↔ `+server.test.ts`,
  `page.remote.ts` ↔ `page.remote.test.ts`. SvelteKit accepts `+`-prefixed test
  files in `src/routes`.
