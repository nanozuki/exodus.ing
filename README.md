# exodus.ing

An article site for friends.

## Develop environment

Construct the dev environment with the following steps.

### Setup local environment

Use nix and pnpm to struct environment.

```shell
nix develop
pnpm i
pnpm run migration:local
```

To make `svelte-language-server` works property, run dev server first:

```shell
pnpm run dev
```

### Database

Migration commands:

- generate: `pnpm run migration:generate`
- apply in local: `pnpm run migration:local`
- apply in prod: `pnpm run migration:prod`

Local database is locate in
`.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite`.

### Build

Build in local first to check error:

```shell
pnpm run build
```

## Stack

- Svelte and SvelteKit
- Cloudflare Page, D1
- Drizzle ORM
- Remark, Rehype ecosystem
