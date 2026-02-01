# exodus.ing

An article site for friends.

## Develop environment

Construct the dev environment with the following steps.

### Setup local environment

Use nix-direnv and pnpm to construct environment:

```shell
echo "use flake" > .envrc
direnv allow
pnpm install
```

### Setup environment variables

Put the following environment variables in `.envrc` file:

```
export EXODUSING_GITHUB_ID=<your-github-client-id>
export EXODUSING_GITHUB_SECRET=<your-github-client-secret>
export EXODUSING_HOST=http://localhost:5173
export EXODUSING_DATABASE="postgres://postgres:mysecretpassword@localhost:5432/exodus?sslmode=disable"
```

And execute `direnv allow` to load the environment variables.

### Setup database

Make sure you have docker installed, and use these commands to set up the database:

```shell
just db-create
pnpm run db:push
```

## Run dev server

```shell
pnpm run dev
```

## Build

```shell
docker build .
# If you need cross-platform build, use the following command:
docker build --platform linux/amd64 .
```

## Stack

- Svelte and SvelteKit
- PostgreSQL
- Drizzle ORM
- Remark, Rehype ecosystem
