---
name: contracts
description:
  Contract-first workflow where doc comments on exported declarations are the
  contract, reviewed by the user on a generated page before tests and
  implementation. Use when changing an exported declaration's signature or doc
  comment, writing tests for one, reviewing an implementation against its
  contract, or when the user asks for the contract view.
---

# Contracts

A **contract** is an exported declaration's signature plus its doc comment,
written as [Comments](../../../docs/code-style.md#comments) describes;
constraints spanning a directory live in its `README.md`. The user reviews
contracts only. Tests and an independent review verify that the implementation
honours them.

## Workflow

1. **Write the contract.** Change only signatures and doc comments, leaving each
   new declaration with whatever placeholder body lets the code compile. Done
   when every declaration the task adds or changes has its intended signature
   and doc comment, and no implementation has changed yet.
2. **Show the change view.** From the repository root run
   `pnpm exec tsx .agents/skills/contracts/scripts/contract-diff.ts`; it
   compares `main` with the working tree. Reply with the HTML path it prints
   plus a few sentences on the change's intent and the entries that deserve a
   close look. The page is the record: the user approves what the tool rendered,
   so leave the diff itself to it.
3. **Revise.** Apply each review comment, regenerate, and reply as in step 2.
   Done when the user has no further comments on the contract.
4. **Write tests from the contract**, following [Tests](#tests), and run them
   red. Then implement until they pass. When the work shows the approved
   contract must change, stop, edit the contract, and return to step 2, naming
   the entries that changed.
5. **Review.** Dispatch a fresh subagent with
   [references/review.md](references/review.md) as its brief. Done when every
   finding is fixed or the user has decided it.

For the snapshot view of the whole repository, pass `--mode snapshot`. Other
options are in the script's header comment. Output goes to the ignored
`.contracts/` directory.

## Tests

Each test checks one behaviour, and its name is one sentence from the caller's
point of view.

- **Unit tests** live beside their source, in the test file paired with it by
  the language's naming convention, inside a `sourceDirs` directory of
  [config.json](config.json).
- **One declaration under test**: group its tests under the test framework's
  native structure named after the declaration, one level deep, so each full
  test name stays a sentence.
- **Several declarations under test**: put a `Covers: a, b` line in the test's
  leading comment. List only the declarations the test is about, never ones it
  calls as setup; that intent is yours to state, since the tool cannot infer it.
- **Scenario tests** (e2e, smoke, and the like) live in a `testDirs` directory
  of [config.json](config.json) and belong to no declaration or file. The test
  name states its purpose as a sentence and its doc comment is the script: who
  acts under what preconditions, what they want done, and the observable
  outcome. Write intent; the test code already spells out each step.

The tool's checks appear under the page's warnings and in the JSON's `warnings`.
Before finishing, clear each one your change introduced: a unit test file
without its source, an unlinked unit test, a `Covers:` name that is unknown or
unreferenced, a removed test.

## Languages

Before writing contracts or tests in a language, read its file under
`languages/` when one exists: [TypeScript](languages/typescript.md),
[Svelte](languages/svelte.md).
