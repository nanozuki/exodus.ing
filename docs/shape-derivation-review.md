# Shape derivation

Saved in `docs/shapes/` under the current eligibility and directory rules. The user's request authorizes these contract
updates.

## Scope and evidence

There are 37 eligible-directory contracts: 30 describe 127 code and tooling files, and seven contain only their
directory heading and `no code files`. Child-only directories are assessed independently from their children.

Git ignore rules are applied to both files and directories. Hidden directories are excluded at every depth, including
`.github` and `.agents`. The shape output root is excluded from source inventory. Hidden files in otherwise eligible
folders, such as root tooling configuration, remain eligible.

The excluded `.github/workflows` contract was removed. Static assets no longer have file entries; `static.md` is a
no-code marker. Documentation and parent folders without direct code also receive markers. Prose, lockfiles, icons,
manifest resources, and crawler resources are outside code-file coverage.

The 30 code contracts are unchanged. Their 188 TypeScript/JavaScript exported names and 38 implicit Svelte default
exports remain accounted for, including 54 public class members. Evidence is source inspection, inspection of consumers
and test assertions, and TypeScript declaration extraction. Runtime behavior was not independently tested; this is
separate from name and structure coverage.

The declaration emitter could not name inferred private library types in `svelte.config.js` and `eslint.config.js`.
Those contracts use public library configuration types and describe the actual configuration behavior explicitly. Svelte
contracts describe consumed route data and declared component props.

## Directory mapping

Each eligible directory has one contract. Filenames replace `/` with `=`, preserve all other characters, and use
`=root.md` for the project root. Directories without direct code use exactly:

```markdown
# directory/path

no code files
```

The seven no-code directories are `docs`, `static`, `src/lib/domain`, `src/routes/a`, `src/routes/auth/github`,
`src/routes/feeds`, and `src/routes/u`. The output directory `docs/shapes` is excluded rather than given its own marker.

Type names in snippets refer to the owning source's domain, framework, and library types. `Component` and `Snippet`
refer to Svelte; HTML attributes refer to `svelte/elements`; remote form/query types refer to SvelteKit; loader aliases
refer to the owning route's generated `$types`. Snippets describe public structures, not standalone compilable source
files. Supporting nonexported types are marked separately from exported declaration headings.

## Observed gaps and follow-up decisions

These contracts record current implementation. The observations below identify follow-up design choices; this derivation
implements no repair.

- **Architecture versus current organization.** Domain data lives in `src/lib/domain/`, repositories expose classes,
  services use mutable global bindings, and remote files live in `src/remotes/`. The architecture document calls for
  models/use cases, standalone repository functions, explicit capability parameters, and remotes beside their consumers.
  The derivation records current interfaces; a migration to those conventions needs separately defined target contracts.
  See [registry](shapes/src=lib=server.md), [repository support](shapes/src=lib=server=repositories.md), and
  [article remote](shapes/src=remotes.md).
- **Bookmark consistency.** Creation permits duplicate relationships; deletion decrements the persisted count once even
  when no row was removed, or several duplicates were removed. The schema has no unique bookmark pair. See
  [bookmark repository](shapes/src=lib=server=repositories.md).
- **Invitation redemption.** Lookup, marking a code used, and role assignment are separate operations. `useCode` does
  not report whether it consumed a row. Atomic redemption is not established. See
  [invitation remote](shapes/src=remotes.md).
- **Session lifecycle and failures.** Sign-out deletes only the cookie; the database session stays valid. Session
  methods and user.findById bypass the shared database-error wrapper. See
  [authentication remote](shapes/src=remotes.md), [session repository](shapes/src=lib=server=repositories.md), and
  [user repository](shapes/src=lib=server=repositories.md).
- **Request destinations.** Host enforcement compares a URL string prefix rather than parsed origins. Callback and
  testing-login return destinations accept any string beginning with `/`, including `//...`. See
  [request lifecycle](shapes/src.md), [GitHub callback](shapes/src=routes=auth=github=callback.md), and
  [testing remote](shapes/src=remotes.md).
- **Public data and mutation rules.** The public profile result includes githubId and verifyCode. Article updates do not
  explicitly advance updatedAt or verify that the stored content type matches the submitted form. Comment creation can
  extend a reply target from another article. These are recorded as observed behavior; changing them is separate
  implementation work. See [user remote](shapes/src=remotes.md), [article remote](shapes/src=remotes.md), and
  [comment repository](shapes/src=lib=server=repositories.md).
- **Storage and feed structure.** The schema object omits tUserRole although the table is exported and used directly.
  Feed URLs are hardcoded to exodus.ing, external-link HTML interpolates the stored URL without separate escaping, and
  general Markdown compilation retains H1 in the feed body. See [schema](shapes/src=lib=server=repositories.md) and
  [feed](shapes/src=routes=feeds=articles.json.md).
- **UI and validation details.** The comment badge links to the response section. Some page schemas accept fractional or
  negative numeric pages. Optional input issue arrays and editor resource rejection behavior were not independently
  exercised. See [article detail](shapes/src=routes=a=[articleId].md), [comment remote](shapes/src=remotes.md),
  [UI components](shapes/src=lib=component.md), and [editor](shapes/src=routes=a=[articleId]=edit.md).

Possible follow-up work is to shape the architecture migration and any behavioral repairs separately after choosing
their intended contracts. This batch contains no application-code changes.

## Saved directory contracts

- [Project root](shapes/=root.md)
- [docs](shapes/docs.md) — no code files
- [e2e](shapes/e2e.md)
- [e2e/support](shapes/e2e=support.md)
- [src](shapes/src.md)
- [src/lib](shapes/src=lib.md)
- [src/lib/component](shapes/src=lib=component.md)
- [src/lib/domain](shapes/src=lib=domain.md) — no code files
- [src/lib/domain/entities](shapes/src=lib=domain=entities.md)
- [src/lib/domain/values](shapes/src=lib=domain=values.md)
- [src/lib/rune](shapes/src=lib=rune.md)
- [src/lib/server](shapes/src=lib=server.md)
- [src/lib/server/adapters](shapes/src=lib=server=adapters.md)
- [src/lib/server/repositories](shapes/src=lib=server=repositories.md)
- [src/lib/testing](shapes/src=lib=testing.md)
- [src/remotes](shapes/src=remotes.md)
- [src/routes](shapes/src=routes.md)
- [src/routes/a](shapes/src=routes=a.md) — no code files
- [src/routes/a/[articleId]](shapes/src=routes=a=[articleId].md)
- [src/routes/a/[articleId]/edit](shapes/src=routes=a=[articleId]=edit.md)
- [src/routes/auth](shapes/src=routes=auth.md)
- [src/routes/auth/github](shapes/src=routes=auth=github.md) — no code files
- [src/routes/auth/github/callback](shapes/src=routes=auth=github=callback.md)
- [src/routes/auth/testing](shapes/src=routes=auth=testing.md)
- [src/routes/console](shapes/src=routes=console.md)
- [src/routes/console/account](shapes/src=routes=console=account.md)
- [src/routes/console/be-writer](shapes/src=routes=console=be-writer.md)
- [src/routes/console/bookmarks](shapes/src=routes=console=bookmarks.md)
- [src/routes/console/invites](shapes/src=routes=console=invites.md)
- [src/routes/console/profile](shapes/src=routes=console=profile.md)
- [src/routes/feeds](shapes/src=routes=feeds.md) — no code files
- [src/routes/feeds/articles.json](shapes/src=routes=feeds=articles.json.md)
- [src/routes/u](shapes/src=routes=u.md) — no code files
- [src/routes/u/[username]](shapes/src=routes=u=[username].md)
- [src/scripts](shapes/src=scripts.md)
- [src/scripts/lib](shapes/src=scripts=lib.md)
- [static](shapes/static.md) — no code files
