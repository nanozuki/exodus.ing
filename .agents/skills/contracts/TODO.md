# TODO

- Declaration-level review comments on the page, with "export comments to the
  clipboard".
- Extraction rules for SvelteKit route files (`+page.server.ts`, remote
  functions, and so on).
- Split each `contracts.test.ts` by source file (`article.test.ts`, …) and
  regroup by the new rules: single-declaration tests under their declaration,
  multi-declaration tests with `Covers:`, and tests that check several
  behaviours split into one behaviour each. Then remove the tool's transitional
  rule for test files without a source.
- After a few weeks on real PRs, evaluate: does the snapshot view help in
  learning the code; is the comment → agent revision loop smooth; is the review
  agent more reliable with per-declaration input.
