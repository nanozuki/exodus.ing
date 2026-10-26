# shape-driven development

## Purpose and intended outcome

shape is a user-approved directory design contract. The programmer controls code
organization, responsibilities, public interfaces, and observable behavior
through shape; the agent implements code within those commitments.

Development is shape-first: agree on the contract, then make the code conform.
Ultimately, shape should become the primary “code” the programmer works with. It
must expose enough structure to review design changes while leaving internal
algorithms and mechanisms to the agent.

Keep shape close to the actual code structure. A reader should see which files
belong to a module, what names they expose, how to use them, and what properties
implementations must preserve. Write what a consumer of the module needs to
know.

A future checker should extract file paths and exported names from the source
AST, match each to shape, and resolve shape declarations back to source. This
should reveal missing, stale, or structurally inconsistent declarations. Name
coverage and behavioral conformance are separate concerns.

## Modules, storage, and naming

### Module boundaries

A module is one eligible project directory. Each shape file corresponds to
exactly one directory and covers its direct code files. Child directories are
separate modules with their own shape files. Describe each code file's
responsibility within the directory contract; module boundaries follow the
directory structure.

### Directory eligibility

Apply the project's Git ignore rules to files and directories, including nested
`.gitignore` rules and negations. Use Git-aware discovery and verify exclusions
with `git check-ignore --no-index` when tracked paths may match ignore rules.
Prune directories whose names start with `.` at any depth. Hidden files directly
inside an eligible directory remain eligible. Exclude the selected shape root
itself from source inventory.

Inventory every remaining directory in scope, including directories containing
only subdirectories or non-code files. Code files include application and test
source, type declarations, stylesheets, templates, SQL, and build/tooling
definitions or configuration. Prose, lockfiles, icons, and other static assets
are not code files. Describe a non-code resource in its consuming code's
contract only when that dependency affects the code's interface or behavior.

### Storage location

Store shape inside the project at `<project-root>/docs/shapes/`, or outside its
codebase at `$XDG_DATA_HOME/shapes/<project-key>/<worktree-key>/`.

Use `$HOME/.local/share` when `XDG_DATA_HOME` is unset. `project-key` follows
`{md5-of-project-root-path}-{project-name}`: combine the MD5 hash of the project
root's absolute path with the project name. `worktree-key` is the worktree name
used directly, including for the primary checkout.

Look for in-project shape first. Once in-project shape exists, use it
exclusively and stop looking in external locations. Report incomplete local
coverage as a gap. Search external storage only when no in-project shape exists.
When establishing the first contracts, use the location specified by the user;
otherwise ask them to choose local or external storage explicitly.

Version management, state files, draft archives, and persisted check reports are
deferred until actual use establishes what is needed.

### Flat filenames

Keep all shape files directly in the shape root. Use the project-relative source
directory path without a trailing slash, replace every `/` with `=`, and append
`.md`. Preserve all other characters, including dots, brackets, and letter case.
Use `=root.md` for the project root. Report filename collisions before writing
affected contracts.

For example:

```text
src/users/
  types.ts
  lookup.ts
src/settings/
  config.ts
  validate.ts

docs/shapes/
  =root.md
  src=users.md
  src=settings.md
```

Here, `src=users.md` covers both files directly in `src/users/`, and
`src=settings.md` covers both files directly in `src/settings/`. `=root.md`
covers root-level source and tooling files. A route directory such as
`src/routes/a/[articleId]/` maps to `src=routes=a=[articleId].md`;
`src/routes/feeds/articles.json/` maps to `src=routes=feeds=articles.json.md`.

## Writing a shape file

### Directories without code

When an eligible directory has no direct code files, write its directory heading
followed only by the exact line `no code files`. Omit a module description and
file/declaration sections; its child directories are still assessed separately.
For example, `static.md` can contain:

```markdown
# static

no code files
```

Use the remaining format only for directories containing code.

### Module description

Use the project-relative source directory as the level-one heading, or `.` for
the project root. Briefly explain what the module is, why it exists, its
responsibilities, its consumers and usage scenarios, and important
responsibility boundaries. Put shared dependency or behavioral constraints at
module level; place declaration-specific constraints beside the declaration.

### File sections

Under a level-two `Files` heading, give each covered code file a level-three
heading containing its complete project-relative pathname. These headings
declare file membership. Keep each pathname explicit, with its filename and
extension, so people can search it and a checker can match it.

Use these sections as the coverage declaration rather than maintaining a second
list. A separate registry remains optional; its need and format can be decided
from actual use.

### Public declarations

For every exported name in a file, use a level-four heading containing that
name, followed by a short code block with the correct language tag, its
signature or public structure, and any necessary description. The multi-file
example below shows the format.

Cover exported types, functions, classes, variables, and the members they
expose. Retain the structure consumers depend on: parameters and return types;
type fields and optionality; constructors, public properties, and methods;
variable types and mutability; and constant values consumers rely on. Default
exports, aliases, and re-exports must also map to their actual public names.

List exports used only for collaboration within the module too, identifying that
role when useful. Internal mechanisms and private members remain implementation
choices within the contract.

When names and types already explain a parameter, member, or return value, the
signature is sufficient. Add purpose, usage, or commitments the signature cannot
express, such as ordering, absence, errors, effects, permissions, lifecycle, or
consistency. Explain meaningful differences without repeating obvious fields.

Declarations may explicitly share descriptions while keeping names and public
structures discoverable. Refer to a member by its real name when it needs
further explanation.

### Implicit entry points and effects

Within the owning file, describe observable behavior that exports alone do not
capture: import-time actions, framework entry points, registration, and
background work. Component props, events, and other consumer-facing interfaces
must also be explicit.

Put import-time effects in the file section. Effect descriptions should make
clear when they occur, what they affect, and how callers handle failure or
release resources.

### Patterns

A pattern may stand in for a group of explicitly listed names. Specify its file,
matching scope, and shared public structure and behavioral contract so both a
person and a program can determine the names covered. Use explicit declarations
until the user establishes a pattern syntax.

A name match establishes name coverage only. Check the matched declarations'
structure and behavior against the rule's contract. Describe differing behavior
through explicit exceptions. File membership continues to use exact pathnames.

### Multi-file example

The following fictional directory module illustrates the format; it does not
define this project's interfaces. Its shape filename is `src=users.md`.

````markdown
# src/users

Provide public user identity lookup for authentication and profile consumers.
Read user identities; leave profile updates and session management to their
owners.

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

Read public identities in bulk. Omit missing IDs; result order need not match
input order. Database access failures reject with an `Error`.

## Shared constraints

Queries do not modify user profiles. Neither file accesses the database at
import time.
````

## Workflow

For apply, derive, and check workflows and their approval rules, use
[SKILL.md](SKILL.md).
