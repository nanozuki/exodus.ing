# TODO

- Declaration-level review comments on the page, with "export comments to the
  clipboard".
- Extraction rules for SvelteKit route files (`+page.server.ts`, remote
  functions, and so on), including pairing `server.test.ts` / `page.test.ts`
  with `+server.ts` / `+page.ts`; until then those test files are reported as
  without a source.
- Show scenario tests on the page with their purpose and script.
- After a few weeks on real PRs, evaluate: does the snapshot view help in
  learning the code; is the comment → agent revision loop smooth; is the review
  agent more reliable with per-declaration input.
