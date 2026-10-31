# Project Instructions

Before designing a feature, deciding where code belongs, or changing or
reviewing application code, read
[Architecture and Development Conventions](docs/architecture.md).

Before writing, editing, or reviewing code, read
[Code Style](docs/code-style.md).

Before adding E2E coverage or changing its fixtures or execution environment,
read [E2E Testing](docs/e2e-testing.md).

Before changing request-origin configuration or canonical redirects, or
diagnosing production CSRF failures, read [Deployment](docs/deployment.md).

## Documentation

When creating or updating files under `docs/` or `AGENTS.md`, use the
`mattpocock-skills:writing-for-agents` skill. Review and revise each changed
document until a complete review pass finds no remaining actionable issues.

## Ownership and Git workflow

Use the user's configured Git identity and name branches after the work, such as
`ci/parallel-checks`. Describe the change itself in branch names, commit
messages (including trailers), and pull request titles, descriptions, and
comments. Keep these free of agent, model, or AI tool names and attribution,
including generated-by notices and agent co-author trailers.

Create pull requests in the ready-for-review state.
