# Derive

## Inventory the current code

Inventory directories in the requested scope using the README's eligibility
rules. Prune excluded directories before descending. Each eligible directory has
one shape file, using the README's directory-to-filename mapping.

For a directory with no direct covered code files, use the README's
`no code files` marker and continue with its eligible children. For directories
containing covered code, follow the remaining derivation steps.

Read each directory's source, consumers, and relevant tests. Account for every
covered code file in scope in its directory's contract or identify an explicit
coverage gap. Preserve unaffected covered file sections when updating an
existing contract. Apply the README's
[testing boundary](../README.md#tests-and-shared-test-infrastructure) when
separating test evidence from covered infrastructure.

## Derive contracts

Use the README's flat filenames and file/declaration sections. Account for all
public structures, implicit entry points, and observable effects required by its
format. Capture behavioral commitments consumers need beyond signatures.

Distinguish observed behavior from assumptions and uncertain claims. Record
future redesigns, conflicts with project conventions, and improvement
suggestions separately from the current-code contract. Use the implementation as
evidence for the behavior being recorded.

Complete derivation when every covered code file and public declaration in scope
has coverage or an explicit gap, and every behavioral claim has supporting
evidence or is identified as uncertain. Check patterns against their shared
structure and behavior as well as their names.

## Save and report

For a user-initiated derive request, save the current-code contracts directly to
the selected shape root under the shared approval boundary. Report saved paths,
source scope, evidence, coverage gaps, and decisions about uncertain or future
behavior.

Within the authorized scope, remove contracts for excluded directories and
sections for excluded files or test-case declarations. Complete this operation
when every eligible directory in scope has a saved contract or marker and every
remaining gap or uncertain claim is reported. If implementation is also
requested, continue with [Apply](apply.md); deriving alone leaves code
unchanged.
