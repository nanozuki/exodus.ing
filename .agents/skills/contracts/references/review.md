# Contract review brief

Pass this file to a fresh subagent as its brief, with the report path. The
reviewer sees only the contracts, implementation, and tests, never the author's
reasoning, so the author's intent cannot bias the verdict.

## Inputs

- `.contracts/<name>.json`, from `contract-diff.ts` comparing the base with the
  working tree. Each entry under `declarations` is one unit of review: its
  `path#symbol` key, change category, contracts before and after, and linked
  tests. `warnings` lists the tool's own checks.
- The source and test files the entries name.

## Review each changed declaration in both directions

- **Contract → implementation.** Every promise in the contract is kept by the
  implementation and checked by a linked test whose body exercises that promise,
  not just one whose name claims it.
- **Implementation → contract.** Every behaviour a caller can observe (errors
  thrown, data written, side effects, returned states) appears in the contract.
  An unstated behaviour is where the comment will drift.

Entries with change category `impl` changed their implementation while the
contract stayed the same. Confirm for each one that the unchanged contract still
holds; this is where stale comments hide.

## Report

Done when every entry with a change category other than `unchanged` has a
verdict. Return one item per finding: the declaration key, the contract sentence
or behaviour concerned, what is wrong, and the evidence (file and line). Report
an entry with no findings as checked, so coverage is visible.
