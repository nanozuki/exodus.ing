# Dependency updates

Read this guide when enabling the dependency updater, changing its credentials
or merge requirements, or repairing a failed update PR.

## Enable on GitHub

Create the App and credentials before the first updater run. The workflow must
reach the default branch before the final verification step:

1. Create a dedicated GitHub App under **Settings → Developer settings → GitHub
   Apps → New GitHub App**. Use a descriptive name such as
   `exodus-dependencies`, set the repository URL as its homepage, and disable
   webhooks. The scheduled workflow supplies the trigger.
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
   `Docker build`. Run CI once to make the new check available in the selector.
   The updater should follow these checks without a bypass. Retain the existing
   required GitGuardian Security Checks. A required human approval also blocks
   automatic merging; keep such a requirement only if that is intended.
5. Run **Actions → Update dependencies → Run workflow** on the default branch.
   Confirm it creates ready-for-review PRs, CI starts without manual workflow
   approval, and GitHub shows auto-merge enabled. Confirm an update merges only
   after every required check passes. Check the workflow logs and Dependency
   Dashboard for extraction or lockfile errors if no PR appears.

Use an App installation token rather than the workflow's `GITHUB_TOKEN` so
update PRs can trigger CI without manual approval, and merges can trigger the
existing deployment workflow. See [GitHub token event behavior][token-events].

## Update policy

The repository policy lives in [renovate.json](../renovate.json). The workflow
and its pinned Renovate CLI version live in
[dependencies.yml](../.github/workflows/dependencies.yml); Renovate updates its
own CLI pin through the custom manager. Administrator-only command permissions
live in [renovate-config.cjs](../.github/renovate-config.cjs).

Allowed updates, including major versions, can auto-merge after CI passes.
TypeScript has an explicit `<7` ceiling. Change that package rule to lift the
ceiling or add another rule to limit another package. Failed CI leaves the PR
open for repair. Related packages use the groups declared in the configuration;
other dependencies can progress independently up to the PR concurrency limit.

Nix's locked environment owns the Node version. After updating Nix, Renovate
runs `src/scripts/sync-node-version.ts` inside the updated Nix shell and
includes any Dockerfile change in the same PR. Other dependency updates do not
run write mode. CI's static checks run check mode to verify Node versions match
without modifying Dockerfile. Docker's Node image is excluded from independent
dependency updates. The Docker check verifies the resulting image can build. If
the corresponding Docker tag is unavailable, the build fails and the PR stays
open. The script's integration tests run through `pnpm test:script`.

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
