# Check

Compare both directions within the requested scope: source to shape and shape to
source. Read the covered source, contracts, relevant consumers, and tests.

## Assess conformance

Account for every covered code file and public declaration in scope, applying
the README's
[testing boundary](../README.md#tests-and-shared-test-infrastructure). Report
these four dimensions separately.

For patterns, establish the exact matched names, then check each declaration
against the shared structure, behavior, and explicit exceptions. A name match
establishes name coverage only.

### File coverage

Identify eligible directories without shape, covered code files missing file
sections, stale source paths, ambiguous or overlapping ownership, multiple shape
files for one source directory, and violations of the README's eligibility,
directory membership, or filename rules. Report contracts for excluded
directories and sections for excluded files or test-case declarations as
obsolete. For directories without direct covered code, verify the
`no code files` marker and absence of file entries. Count only covered code in
the inventory.

### Public names and structures

Identify unmatched exports or shape declarations. Compare signatures, fields,
optionality, constructors, public members, mutability, and relied-on constant
values. Include default exports, aliases, re-exports, and exports used within
the module.

### Behavioral conformance

Assess responsibilities, dependency boundaries, usage, ordering, absence,
errors, effects, permissions, lifecycle, and consistency wherever the contract
makes commitments. Include implicit entry points and consumer-facing component
interfaces.

### Unverified areas

Identify observable behavior without a contract, uncertain pattern coverage, and
commitments not assessed by inspection or tests.

## Report evidence

For each mismatch, identify the source path and declaration or effect, the
owning shape file when one exists, the expected contract, and the observed
difference. Distinguish demonstrated violations from missing coverage and
uncertainty. Cite inspection or test evidence for assessed behavioral
commitments.

Complete the check when every eligible directory, covered code file, and public
declaration in scope is accounted for and each relevant observable behavior is
assessed, missing a contract, or explicitly unverified. State the scope and
coverage limits alongside the findings.

Check leaves code and contracts unchanged. When the user also requested repairs,
continue with [Apply](apply.md) for implementation violations; contract changes
follow the skill's approval boundary.
