# shape-driven development

## Purpose and intended outcome

shape is a user-approved module design contract. The programmer controls code
organization, responsibilities, public interfaces, and observable behavior through
shape; the agent implements code within those commitments.

Development is shape-first: agree on the contract, then make the code conform.
Ultimately, shape should become the primary “code” the programmer works with. It
must expose enough structure to review design changes while leaving internal
algorithms and mechanisms to the agent.

Keep shape close to the actual code structure. A reader should see which files
belong to a module, what names they expose, how to use them, and what properties
implementations must preserve. Write what a consumer of the module needs to know.

A future checker should extract file paths and exported names from the source
AST, match each to shape, and resolve shape declarations back to source. This
should reveal missing, stale, or structurally inconsistent declarations. Name
coverage and behavioral conformance are separate concerns.

## Modules, storage, and naming

### Module boundaries

A module is one source file or a group of files directly inside the same source
directory. Files in child directories belong to separate modules. Preserve the
boundaries that guide implementation: frontend, request handling, and persistence
can collaborate on one feature while retaining their own locations and contracts.

### Storage location

Store shape inside the project at `<project-root>/docs/shapes/`, or outside its
codebase at `$XDG_DATA_HOME/shapes/<project-key>/<worktree-key>/`.

Use `$HOME/.local/share` when `XDG_DATA_HOME` is unset. `project-key` identifies
the project, and `worktree-key` identifies the checkout, including the primary
checkout. Their encoding remains undecided.

Look for in-project shape first. Once in-project shape exists, use it exclusively
and stop looking in external locations. Report incomplete local coverage as a
gap. Search external storage only when no in-project shape exists. Choose the
storage location explicitly when establishing the first contracts.

Version management, state files, draft archives, and persisted check reports are
deferred until actual use establishes what is needed.

### Flat filenames

Keep all shape files directly in the shape root. Encode source directory ancestry
in the filename. Use `<directory-path>.md` when the module covers all source files
directly in that directory. For part of the directory, including a single-file
module, use `<directory-path>=<module-name>.md`.

Join source directory segments with `.`. Use `=` to separate the directory path
from an explicit module name. Under the agreed directory/module naming alphabet
of letters, digits, underscores, and hyphens, these separators require no escaping.
Preserve source directory spelling; write explicit module names in lowercase
kebab-case, using a responsibility or business concept. A single-file module
usually follows its source file's semantic name.

For example:

```text
src/users/
  types.ts
  lookup.ts
  permissions.ts
src/settings/
  config.ts
  validate.ts

docs/shapes/
  src.users=user-lookup.md
  src.users=permissions.md
  src.settings.md
```

Here, `src.users=user-lookup.md` covers `types.ts` and `lookup.ts`,
`src.users=permissions.md` covers `permissions.ts`, and `src.settings.md` covers
both files directly in `src/settings/`.

## Writing a shape file

### Module description

Use the module name as the level-one heading. Briefly explain what the module is,
why it exists, its responsibilities, its consumers and usage scenarios, and
important responsibility boundaries. Put shared dependency or behavioral
constraints at module level; place declaration-specific constraints beside the
declaration.

### File sections

Under a level-two `Files` heading, give each covered source file a level-three
heading containing its complete project-relative pathname. These headings declare
file membership. Keep each pathname explicit, with its filename and extension,
so people can search it and a checker can match it.

Use these sections as the coverage declaration rather than maintaining a second
list. A separate registry remains optional; its need and format can be decided
from actual use.

### Public declarations

For every exported name in a file, use a level-four heading containing that name,
followed by a short code block with the correct language tag, its signature or
public structure, and any necessary description. The multi-file example below
shows the format.

Cover exported types, functions, classes, variables, and the members they expose.
Retain the structure consumers depend on: parameters and return types; type fields
and optionality; constructors, public properties, and methods; variable types and
mutability; and constant values consumers rely on. Default exports, aliases, and
re-exports must also map to their actual public names.

List exports used only for collaboration within the module too, identifying that
role when useful. Internal mechanisms and private members remain implementation
choices within the contract.

When names and types already explain a parameter, member, or return value, the
signature is sufficient. Add purpose, usage, or commitments the signature cannot
express, such as ordering, absence, errors, effects, permissions, lifecycle, or
consistency. Explain meaningful differences without repeating obvious fields.

Declarations may explicitly share descriptions while keeping names and public
structures discoverable. Refer to a member by its real name when it needs further
explanation.

### Implicit entry points and effects

Within the owning file, describe observable behavior that exports alone do not
capture: import-time actions, framework entry points, registration, and background
work. Component props, events, and other consumer-facing interfaces must also be
explicit.

Put import-time effects in the file section. Effect descriptions should make
clear when they occur, what they affect, and how callers handle failure or release
resources.

### Patterns

A pattern may stand in for a group of explicitly listed names. Specify its file,
matching scope, and shared public structure and behavioral contract so both a
person and a program can determine the names covered. The pattern syntax remains
undecided.

A name match establishes name coverage only. Check the matched declarations'
structure and behavior against the rule's contract. Describe differing behavior
through explicit exceptions. File membership continues to use exact pathnames.

### Multi-file example

The following fictional module illustrates the format; it does not define this
project's interfaces. Its shape filename is `src.users=user-lookup.md`.

````markdown
# user-lookup

Provide public user identity lookup for authentication and profile consumers.
Read user identities; leave profile updates and session management to their owners.

## Files

### `src/users/types.ts`

#### `User`

```typescript
interface User {
  id: string;
  name: string;
}
```

Identify users by `id`. The display `name` can change.

### `src/users/lookup.ts`

#### `findUser`

```typescript
function findUser(ids: string[]): Promise<User[]>;
```

Read public identities in bulk. Omit missing IDs; result order need not match input
order. Database access failures reject with an `Error`.

## Shared constraints

Queries do not modify user profiles. Neither file accesses the database at import
time.
````

## Operations and approval

Keep three operations:

- `apply` updates code from shape. Implement the approved contract within the
  requested scope, then report conformance and remaining gaps.
- `derive` proposes shape from code. Produce reviewable contracts identifying
  files, public declarations, observed behavior, and decisions needing confirmation.
- `check` compares both. Report file coverage, public-name and structure coverage,
  behavioral conformance, and unverified areas separately.

When deriving from an existing project, start with directories containing code and
split candidates into single files or file groups within each directory. Describe
the code's current shape. Identify future redesigns, conflicts with conventions,
and improvement suggestions separately. Existing implementation is evidence;
the user decides which behavior becomes a contract.

A check should identify files without shape, ambiguous ownership or unmatched
public names, stale declarations, and signature differences, then assess effects,
errors, and other behavior against the contract. Distinguish “all names match”
from “all relevant observable behavior has a contract.” Keep anything not assessed
by inspection or tests visible.

Every shape addition or change requires user confirmation. Present a concrete
draft or diff first, then update the approved contract. Implement dependent code
when implementation is part of the requested task. An unchanged, already-approved
proposal needs no repeated confirmation. Repair implementation violations within
the task's authorization; propose and obtain confirmation for a contract change
instead of rewriting the contract to erase a failed check.
