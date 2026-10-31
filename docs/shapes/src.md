# src

Define application HTML, theme tokens, ambient request interfaces, and the
server request lifecycle. Child directories own models, server use cases and
infrastructure, routes, and database tooling.

## Files

### `src/app.css`

Import-time stylesheet entry point: load Tailwind, reset its color/text scales,
and expose the application theme. No JavaScript exports. Dark mode follows
`prefers-color-scheme`.

| Tokens                                                                                                                        | Contract                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--palette-{base,surface,overlay,muted,subtle,text,love,gold,rose,pine,foam,iris,highlight-low,highlight-med,highlight-high}` | RGB channel values from Rosé Pine Dawn in light mode and Rosé Pine in dark mode.                                                                 |
| `--color-{base,surface,overlay,muted,subtle,text,highlight-low,highlight-med,highlight-high}`                                 | Expose the corresponding palette entries as CSS colors.                                                                                          |
| `--color-quote-odd`, `--color-quote-even`                                                                                     | Overlay and surface colors.                                                                                                                      |
| `--color-border`, `--color-error`, `--color-warn`, `--color-accent`, `--color-accent-alt`                                     | Highlight-high, love, gold, rose, and iris colors.                                                                                               |
| `--color-code`, `--color-link`, `--color-link-visited`, `--color-focus-visible`                                               | Surface, foam, pine, and iris colors.                                                                                                            |
| `--color-primary`, `--color-danger`, `--color-disabled`                                                                       | Foam, love, and muted colors.                                                                                                                    |
| `--font-{sans,serif,mono,title}`                                                                                              | IBM Plex Sans/Noto Sans SC, IBM Plex Serif/Noto Serif SC, IBM Plex Mono/Noto Mono, and Sofia Sans Extra Condensed, with their generic fallbacks. |
| `--text-{sm,base,lg,xl,2xl,3xl,4xl}`                                                                                          | 0.875, 1, 1.125, 1.25, 1.5, 1.75, and 2rem.                                                                                                      |
| `--leading-single`                                                                                                            | 1.                                                                                                                                               |
| `--container-article`, `--breakpoint-page`                                                                                    | 40rem article width and 43rem page breakpoint.                                                                                                   |
| `--spacing-page-vertical`, `--spacing-page-horizontal`                                                                        | 1rem and 1.5rem.                                                                                                                                 |
| `--spacing-{2xs,xs,s,m,l,xl,2xl,3xl,4xl,5xl}`                                                                                 | 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, and 8rem.                                                                                                   |

### `src/app.d.ts`

Ambient compile-time entry point; no runtime effect.

| Interface/member                                                             | Contract                                                                                                                                                        |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `App.Error.detail?: ErrorDetail`                                             | Optional business error details from `src/lib/errors.ts`; SvelteKit supplies `status` and `message`. Framework errors may lack detail.                          |
| `App.Locals.loggedInUser: LoggedInUser \| null`                              | Authenticated viewer, or null.                                                                                                                                  |
| `App.Locals.requireLoggedInUser(context: string): LoggedInUser`              | Require an authenticated viewer for the supplied operation.                                                                                                     |
| `App.Locals.hasPermission(p: Permission): boolean`                           | Check the viewer's permission.                                                                                                                                  |
| `App.Locals.requirePermission(p: Permission, context: string): LoggedInUser` | Require permission for the supplied operation and return the viewer.                                                                                            |
| `virtual:icons/*`, `~icons/*`                                                | Ambient modules with a default SVG Svelte component accepting `SvelteHTMLElements['svg']`. These are TypeScript wildcard declarations, not shape name patterns. |

### `src/app.html`

SvelteKit HTML template: Chinese language, viewport, icons, manifest, JSON Feed
alternate URL, EXODUS social site name, framework head/body placeholders, and
hover data preloading. Feed discovery is hardcoded to
https://exodus.ing/feeds/articles.json. Substitution belongs to SvelteKit; no
exported names.

### `src/error.html`

Fallback HTML error template outside normal application rendering: substitute
status/message into title/body, provide a Chinese-language page, viewport, icon,
and independent light/dark inline styling. No database access, scripts, or
application exports.

### `src/hooks.server.ts`

#### `handle`

```typescript
export declare const handle: Handle;
```

Keep deployed page requests on APP_URL's canonical origin with a 308 redirect,
preserving paths and queries before authentication. Skip canonicalization during
development and building; static assets bypass this hook. Attach authentication
locals before route handling. The exact `/healthcheck` path bypasses
canonicalization and authentication so internal HTTP probes reach its route.

#### `init`

```typescript
export declare const init: ServerInit;
```

Initialize shared services at server startup.
