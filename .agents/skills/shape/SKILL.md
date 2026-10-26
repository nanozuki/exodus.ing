---
name: shape
description: Shape-driven development. Use to apply approved directory contracts to code,
  derive contracts from current code, or check code against shape.
---

# Shape

Shape is a user-approved directory design contract: the user controls
organization, responsibilities, public interfaces, and observable behavior; the
agent chooses internal algorithms and mechanisms within those commitments.

## Establish scope and storage

Identify the project root and requested files, modules, or feature. Resolve
ambiguous intent with the user before taking actions that depend on it.

Read the project's architecture and development conventions before interpreting
module responsibilities. Before inventorying sources or locating contracts, read
[Modules, storage, and naming](README.md#modules-storage-and-naming) for
eligibility, directory boundaries, storage precedence, and filename mapping.
Before interpreting or writing contracts, read
[Writing a shape file](README.md#writing-a-shape-file) for their format.

## Approval boundary

A user-initiated **derive** request approves saving contracts that describe
current code within the requested scope. Save them directly in the selected
shape root without a separate confirmation. Keep uncertainty and redesign
proposals explicit; this approval covers neither code changes nor proposed
future behavior.

For other shape additions or changes, present a concrete draft or diff and
obtain user confirmation before saving the contract or implementing dependent
code. Reuse available user confirmation of an unchanged proposal.

## Select the operation

Select from the user's request and read that operation's instructions. Follow
their links when the task reaches another operation:

- [Apply](references/apply.md): implement or repair code to conform to approved shape.
- [Derive](references/derive.md): record contracts from current code.
- [Check](references/check.md): compare contracts and code without changing either.
