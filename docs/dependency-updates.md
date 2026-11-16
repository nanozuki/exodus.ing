# Dependency updates

Read this guide when enabling the dependency updater, changing its credentials
or merge requirements, or repairing a failed update PR.

## Enable on GitHub

Create the App and credentials before the first updater run. The workflow must
reach the default branch before the final verification step:

1. Create a dedicated GitHub App under **Settings → Developer settings → GitHub
   Apps → New GitHub App**. Use a descriptive name such as
   `exodus-dependencies`, set the repository URL as its homepage, and disable
   webhooks. GitHub Actions triggers the updater.
2. Give the App these repository permissions:

   | Permission        | Access         |
   | ----------------- | -------------- |
   | Administration    | Read-only      |
   | Checks            | Read and write |
   | Commit statuses   | Read and write |
   | Contents          | Read and write |
   | Dependabot alerts | Read-only      |
   | Issues            | Read and write |
   | Metadata          | Read-only      |
   | Pull requests     | Read and write |
   | Workflows         | Read and write |

   These follow Renovate's [GitHub App permissions][app-permissions]. This
   repository does not use a merge queue; add its permission if one is enabled.
   An organization-owned installation also needs Members read access as listed
   in the upstream guide.

3. Install the App with access to **only this repository**. Generate a private
   key from the App settings. In the repository's **Settings → Secrets and
   variables → Actions**, add the App ID as the repository variable
   `DEPENDENCY_APP_ID` and the full PEM file contents as the repository secret
   `DEPENDENCY_APP_PRIVATE_KEY`. Keep the private key outside version control.
4. Under **Settings → General → Pull Requests**, enable **Allow auto-merge** and
   **Allow squash merging**. Under the rules protecting `main`, require a pull
   request, require the branch to be up to date, and require all four checks:
   `Static checks`, `Unit and integration tests`, `E2E tests`, and
   `Docker build`. Run CI once so the checks appear in the selector. Also
   require GitGuardian Security Checks. Give the updater no bypass. A required
   human approval also blocks automatic merging; keep such a requirement only if
   that is intended.
5. Run **Actions → Update dependencies → Run workflow** on the default branch.
   Confirm it creates ready-for-review PRs, CI starts without manual workflow
   approval, and GitHub shows auto-merge enabled. Confirm an update merges only
   after every required check passes. Check the workflow logs and Dependency
   Dashboard for extraction or lockfile errors if no PR appears.

Use an App installation token rather than the workflow's `GITHUB_TOKEN` so
update PRs can trigger CI without manual approval, and merges can trigger the
deployment workflow. See [GitHub token event behavior][token-events].

## Update policy

The repository policy lives in [renovate.json](../renovate.json). The workflow
and its pinned Renovate CLI version live in
[dependencies.yml](../.github/workflows/dependencies.yml); Renovate updates its
own CLI pin through the custom manager. Administrator-only command permissions
live in [renovate-config.cjs](../.github/renovate-config.cjs).

The updater runs once each Monday, with lockfile maintenance allowed throughout
Monday in `Europe/Berlin` so a delayed scheduled run can still update lockfiles.
Pushes to `main` do not start another update batch. Use the manual workflow
trigger to retry a failed run or refresh a PR that has fallen behind `main`.

Direct npm dependencies use exact versions. pnpm saves new dependencies with
exact versions, and Renovate maintains those pins. Keep the lockfile committed
to preserve the resolved direct and transitive dependency graph; version pins do
not replace it.

Allowed updates, including major versions, can auto-merge after CI passes.
TypeScript has an explicit `<7` ceiling. Change that package rule to lift the
ceiling or add another rule to limit another package. Failed CI leaves the PR
open for repair. The `group:all` preset combines ordinary dependency updates,
including major versions, into one PR. Lockfile maintenance can create separate
PRs. A failing update blocks the other updates in its group until repaired.

Ordinary npm updates wait three days through Renovate's minimum release age
preset. pnpm enforces the same three-day threshold in strict mode for direct and
transitive dependencies, including lockfile maintenance. Packages still in the
cooldown window can block installation of an existing lockfile. Urgent
exceptions require an explicitly reviewed package-version exclusion; keep the
default policy strict. The release-age wait applies only to npm; Nix inputs
update without it.

Nix's locked environment owns the Node version, and the Dockerfile's base image
follows it through `src/scripts/sync-node-version.ts`. Flake inputs track
branches rather than versions, so Renovate changes `flake.lock` only through
lockfile maintenance. A package rule matching the `lockFileMaintenance` update
type runs the script in write mode as a branch-level post-upgrade task, so the
Dockerfile change lands in the same PR. Match it by update type: Renovate takes
branch-level tasks from a PR's first upgrade, and every upgrade in a lockfile
maintenance PR, npm included, shares that type. Keep Renovate's Dockerfile
manager disabled so the base image changes only through this script. CI's static
checks run the script in check mode on every PR, and the Docker build check
confirms the matching image tag exists.

Nix supplies the pnpm launcher; `package.json`'s `packageManager` selects the
project version. Updating pnpm means updating that field and any resulting
lockfile changes, without forcing the Nix launcher to have the same version.

## Repair and verification

Inspect the failing CI job and push fixes to the existing update branch.
Renovate normally stops rewriting branches containing human commits; manage
subsequent rebases yourself. Before pushing a repair that needs further review,
disable auto-merge on that PR. Otherwise a passing repair can merge under the
existing auto-merge request.

To synchronize a manually updated flake, run from the repository root:

```sh
nix develop --command node src/scripts/sync-node-version.ts --write
```

For a local check without changing files:

```sh
nix develop --command node src/scripts/sync-node-version.ts --check
nix develop --command pnpm test:script
docker build --tag exodus-ci .
```

Run the workflow's validation command using its pinned `RENOVATE_VERSION` when
changing Renovate configuration. A real authenticated updater run is still
needed to verify GitHub permissions, PR creation, required checks, and merging.
Do not install the hosted Renovate App alongside this updater for this
repository; two instances would compete over dependency branches.

[app-permissions]:
  https://docs.renovatebot.com/modules/platform/github/#running-as-a-github-app
[token-events]:
  https://docs.github.com/en/actions/concepts/security/github_token
