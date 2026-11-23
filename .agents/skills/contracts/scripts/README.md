# contracts/scripts

`contract-diff.ts` builds the contract view: it extracts declarations, their doc
comments, and linked tests from the repository, and renders them as JSON and
HTML. Read this file before changing the tool; the rules here decide what counts
as a contract and what the review page shows. Usage and options are in the
script's header comment.

## Output

The JSON is the only source of truth. It is deterministic, feeds the HTML page,
and is the review agent's input. The HTML is a reading surface and adds no facts
of its own.

- Declarations are keyed `path#symbol`. Each record carries its signature, doc
  comment, comment style, and linked tests. A diff report adds the change
  category and the before and after contracts. The categories are `added`,
  `removed`, `signature`, `doc` (only comments changed), and `impl` (the
  implementation changed while the contract did not).
- Function bodies live only in the JSON, for the review agent.
- A test name is an array: enclosing `describe` titles first, the test's own
  title last. The page decides how to join or drop levels.
- Tool checks are structured records: a `kind` plus fields such as the test file
  `file`, test name `test`, declaration key `key`, and the name written in a
  `Covers:` line `symbol`. They carry no prose sentences, so the page and the
  agent each use the fields directly.

## Extraction rules

- **Scope.** The directories in `../config.json`: declarations come from
  `sourceDirs` only, and `testDirs` contribute scenario tests and directory
  descriptions. The deepest listed directory decides a path's role, so
  `e2e/support` is source inside the `e2e` test directory. A working tree is
  listed through git, so ignored and generated files stay out.
- **Signatures exclude implementation.** A function's signature drops its body.
  In an exported object literal a function body becomes `{ … }`, or `…` for an
  expression-bodied arrow. The removed parts only decide the `impl` category.
- **Signatures compare by token.** Whitespace and formatting changes never count
  as signature changes.
- **Classes split into members.** The class itself keeps only its heading,
  constructor signature, and public fields. Each public method, getter, and
  setter is a declaration keyed `Class.member`. `private` and `#private` members
  and every body count as the class's implementation. Interfaces and object
  types stay whole: they have no implementation, and splitting them hides their
  shape.
- **Comments inside a signature are contract.** Comments on interface members or
  component props sit inside the signature; changing them counts as `doc`.
- **File overviews** are a top-level comment whose text opens with the file
  name, followed by a blank line. That comment never doubles as a declaration's
  comment. With `--comments loose`, a file without one falls back to a leading
  comment block followed by a blank line, marked as a plain comment.
- **Stylesheets** contribute only their file overview, by the TS rule. They have
  no declarations, but importers depend on the styles they define.
- **Directory descriptions** come from the directory's `README.md`, including
  directories that hold only subdirectories.
- **Prose compares by paragraph.** Line breaks inside a paragraph count as
  spaces and only blank lines separate paragraphs, so reflowing never counts as
  a change.
- **Only executable declarations take tests**: functions, methods, getters,
  setters, and components. Only they show a test section and only they are
  reported as untested.

### Svelte components

- A component is one declaration named after its file, the name importers use:
  `Dialog.svelte` declares `Dialog`, keyed `Dialog.svelte#Dialog`, so
  `describe('Dialog')` links its tests.
- Its signature is the component type that importers see, matching the Svelte
  language tools: the local types that the `$props()` annotation references
  directly or indirectly, plus `declare const Button: Component<ButtonProps>;`.
  `$bindable()` props go in the third type argument, as in
  `Component<Props, {}, 'value'>`. Without props it is
  `Component<Record<string, never>>`. A `generics` attribute goes first.
  Imported types are excluded; their own files hold their contracts.
- The `$props()` statement is implementation: importers never see the
  destructured local names or defaults, so changing them counts as `impl`.
- The comment is `<!-- @component -->` and counts as a doc comment.
  `--comments loose` never applies to components. Comments above the `Props`
  type or above the `$props()` statement are invisible to importers and stay out
  of the contract.
- Instance script statements, markup, and styles are implementation and only
  decide `impl`; HTML comments and whitespace in them are ignored.
- Exports of `<script module>` follow the TS module rules under the same file.
- `Foo.test.svelte` is a test harness and is not extracted.

### Tests

- In a source directory, a test file `foo.test.ts` belongs to `foo.ts` and
  `Foo.svelte.test.ts` to `Foo.svelte`. Its tests are unit tests. A unit test
  file without its source is reported once, as a file, never inferred to be
  something else.
- A unit test links to the declaration named by its enclosing `describe`, or to
  the names on a `Covers:` line in its leading comment.
- Test files in a test directory hold scenario tests. They link to no
  declaration and no linking check applies to them; they are recorded only so a
  removed one is reported.
- Checks: a unit test file without its source, a unit test linked to nothing, a
  `Covers:` name that matches no declaration or that the test body never
  references, an executable declaration with no test, and a test removed since
  the base.

## Page design

Both modes share one page. Each decision below was checked on `src/lib`; the
rejected alternatives are recorded so nobody retries them.

### Layout

- The main column is 1040px wide and centered, after rustdoc's 960px. Prose
  fills the column, its right edge aligned with signature boxes and file cards.
  A 78-character reading width was rejected: the ragged right margin read as
  hard line breaks in the source. Coloured description boxes and a right-hand
  column for counts and buttons were rejected as crowded.
- Signature boxes never wrap; long lines scroll horizontally, because
  force-wrapped code misreads.
- There is no side outline, which would repeat the body. A sticky breadcrumb at
  the top locates the reader; each level is clickable and carries a folder or
  file icon.

### Tree

- Directory → file → declaration, styled like an editor file tree: each row is
  arrow + icon + name, indented 16px per level. Indent guides start under the
  arrow; clicking a guide collapses the subtree.
- Expanded and collapsed use two glyphs of equal width rather than one rotated
  arrow: a rotated `∨` is wider than `›` and pushes the icon.
- A directory with no description, no files, and a single subdirectory merges
  with it into one row, such as `a/[articleId]`.
- A heading row reads: name, summary, counts, subtree buttons. The summary is
  the description's first sentence, shown only when collapsed and truncated.
  Counts are small badges: subdirectories, declarations, and uncommented
  declarations, or changes in a diff. The expand-all and collapse-all buttons
  sit at the row's end so they never move with the text, faded until hovered.
  File rows have no subtree buttons.
- Directory and file descriptions are body text in normal colour and size,
  aligned with the icon, with no bold first sentence. A missing description
  shows nothing. A directory description ends with its source file in small grey
  text.

### Declarations

- In godoc order: a "kind name" heading, the signature box, then the comment.
  Class members are not indented; a grey `Class.` prefix keeps their context
  when a diff filters out the class itself.
- The snapshot view marks comment sources `// plain comment` and `no comment`.
  Doc comments are unmarked because they are the target state.
- The test section has a `Tests` heading followed by the grey test file path,
  then each test's intent. The `describe(<declaration>)` level is dropped; other
  `describe` titles appear once as group headings. An executable declaration
  without tests shows `Tests N/A`.

### Diff view

- Only changed directories and files remain, counting changes to declarations or
  descriptions. Unchanged declarations in a changed file are hidden behind a
  filter. The page filters by change category and marks added, removed, and
  modified tests. `impl` declarations show only their marker: the human reviews
  contracts, never implementation.
- Diffs are single-column. Signatures use a unified line diff like git, with `−`
  and `+` rows and word highlights inside replaced rows. Comments and
  descriptions use an inline word diff: deletions struck through on red,
  insertions on green. Neighbouring changes separated only by whitespace merge
  into one span.
- A changed description adds a "description changed" badge to its heading.

## Beyond this repository

The tool is a TS prototype for this repository. A cross-language version would
use tree-sitter: one query file per language (starting from each grammar's
`tags.scm`) yields definition + adjacent doc comment + body-stripped signature,
and needs no buildable project, so it can read base and head blobs straight from
git. Rust suits it: first-class tree-sitter bindings, grammars as crates, and a
single static binary. Languages that need a real parser (`svelte/compiler`,
`go/ast`) plug in as subprocesses emitting the same JSON schema. Build it only
once several projects or languages use this workflow.
