# Code Style

Apply this guide when writing or reviewing application code, tests, and tooling.

## Blank lines

Use one blank line between independent declarations and logical sections.
Functions, classes, and types normally form separate declarations. A function
assigned to a `const`, including a remote handler, can be an independent
operation too.

Keep related `const` and `let` declarations together, even at module scope.
Within functions and Svelte instance scripts, group related inputs, state,
derived values, and workflow steps into paragraphs. Separate groups when their
purpose changes. A multiline initializer alone does not create a new group.
Preserve declaration order when adjusting whitespace: initialization and async
boundaries can depend on it.

A normal Svelte `<script>` contains component-instance logic. Apply the same
logical grouping as in a function body; `<script module>` contains module logic.

```typescript
const { count, pageSize, page }: Props = $props();

const totalPages = $derived(Math.ceil(count / pageSize));
const hasPrev = $derived(page > 1);
const hasNext = $derived(page < totalPages);
```

These module-level constants also form one group:

```typescript
const template = 'exodus-template';
const versionFile = new URL('../../../.direnv/pg_database_version', import.meta.url);
const temporaryVersionFile = new URL('../../../.direnv/pg_database_version.tmp', import.meta.url);
```

## Comments

Write interface comments from the caller's perspective: explain why or when to
use the interface, how to use it correctly, and constraints, side effects,
failures, or lifecycle obligations missing from its name and signature. A caller
should not need to inspect the implementation to discover these commitments.

Write implementation comments for the maintainer: explain the reason for a
decision or an invariant that future changes must preserve, rather than narrating
the statements.

Apply this test to every comment, including file overviews, exported declarations,
private helpers, fields, and inline comments. Leave self-explanatory code
uncommented, including public declarations.

Keep each fact in one authoritative place. Put caller-facing information beside
the relevant interface, implementation rationale beside the decision, and
module-wide constraints in a file overview only when they apply to the whole
file. Keep a necessary file overview separate from imports with one blank line;
keep a declaration comment directly adjacent to its declaration.

Use `//` in JavaScript, TypeScript, and Svelte scripts, including multiline
explanations. Use the language's native comment syntax in markup, CSS, and SQL.
Preserve required license notices and tool directives in the syntax their tools
recognize. Update or remove a comment when its explanation stops applying.

## Imports

Keep imports together, separated from the implementation by one blank line.

For a target under `src/lib`, use a relative path when its file is in the same
directory as the importing file; otherwise use `$lib/...`. A child directory is
a different directory. For other local targets, use relative paths. Keep package
imports and framework aliases such as `$app/...` as provided by their owners.

Apply the same path convention to dynamic imports and module-mock specifiers.
Filesystem paths and `new URL(..., import.meta.url)` references are resource
locations, not import specifiers.

## Review

For every changed file, check that each blank line marks a useful boundary, each
retained comment answers a reader's question, and every import follows the target
location rule. Formatting tools handle syntax; logical grouping and comment
usefulness require reading the surrounding code.
