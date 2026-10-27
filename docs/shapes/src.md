# src

Define application HTML, theme tokens, ambient request interfaces, and the server
request lifecycle. Child directories own models, server use cases and
infrastructure, routes, and database tooling.

## Files

### `src/app.css`

Import-time stylesheet entry point: load Tailwind and define the light/dark palette and application theme properties
below. These names supply the utility classes, fonts, page sizing, and colors consumed by components. Dark mode follows
prefers-color-scheme. No JavaScript exports.

```css
@import 'tailwindcss';

@layer base {
  :root {
    /* Rosé Pine, Dawn light theme: r g b */
    --palette-base: 250 244 237; /* #faf4ed */
    --palette-surface: 255 250 243; /* #fffaf3 */
    --palette-overlay: 242 233 222; /* #f2e9e1 */
    --palette-muted: 152 147 165; /* #9893a5 */
    --palette-subtle: 121 117 147; /* #797593 */
    --palette-text: 87 82 121; /* #575279 */
    --palette-love: 180 99 122; /* #b4637a */
    --palette-gold: 234 157 52; /* #ea9d34 */
    --palette-rose: 215 130 126; /* #d7827e */
    --palette-pine: 40 105 131; /* #286983 */
    --palette-foam: 86 148 159; /* #56949f */
    --palette-iris: 144 122 169; /* #907aa9 */
    --palette-highlight-low: 244 237 232; /* #f4ede8 */
    --palette-highlight-med: 223 218 217; /* #dfdad9 */
    --palette-highlight-high: 206 202 205; /* #cecacd */
  }

  @media (prefers-color-scheme: dark) {
    :root {
      /* Rosé Pine, dark theme: r g b */
      --palette-base: 25 23 36; /* #191724 */
      --palette-surface: 31 29 46; /* #1f1d2e */
      --palette-overlay: 38 35 58; /* #26233a */
      --palette-muted: 110 106 134; /* #6e6a86 */
      --palette-subtle: 144 140 170; /* #908caa */
      --palette-text: 224 222 244; /* #e0def4 */
      --palette-love: 235 111 146; /* #eb6f92 */
      --palette-gold: 246 193 119; /* #f6c177 */
      --palette-rose: 235 188 186; /* #ebbcba */
      --palette-pine: 49 116 143; /* #31748f */
      --palette-foam: 156 207 216; /* #9ccfd8 */
      --palette-iris: 196 167 231; /* #c4a7e7 */
      --palette-highlight-low: 33 32 46; /* #21202e */
      --palette-highlight-med: 64 61 82; /* #403d52 */
      --palette-highlight-high: 82 79 103; /* #524f67 */
    }
  }
}

@theme {
  --color-*: initial;

  --color-base: rgb(var(--palette-base));
  --color-surface: rgb(var(--palette-surface));
  --color-overlay: rgb(var(--palette-overlay));
  --color-muted: rgb(var(--palette-muted));
  --color-subtle: rgb(var(--palette-subtle));
  --color-text: rgb(var(--palette-text));

  --color-highlight-low: rgb(var(--palette-highlight-low));
  --color-highlight-med: rgb(var(--palette-highlight-med));
  --color-highlight-high: rgb(var(--palette-highlight-high));

  --color-quote-odd: rgb(var(--palette-overlay));
  --color-quote-even: rgb(var(--palette-surface));

  --color-border: rgb(var(--palette-highlight-high));
  --color-error: rgb(var(--palette-love));
  --color-warn: rgb(var(--palette-gold));
  --color-accent: rgb(var(--palette-rose));
  --color-accent-alt: rgb(var(--palette-iris));
  --color-code: rgb(var(--palette-surface));
  --color-link: rgb(var(--palette-foam));
  --color-link-visited: rgb(var(--palette-pine));
  --color-focus-visible: rgb(var(--palette-iris));
  --color-primary: rgb(var(--palette-foam));
  --color-danger: rgb(var(--palette-love));
  --color-disabled: rgb(var(--palette-muted));

  --font-*: initial;
  --font-sans: IBM Plex Sans, Noto Sans SC, sans-serif;
  --font-serif: IBM Plex Serif, Noto Serif SC, serif;
  --font-mono: IBM Plex Mono, Noto Mono, monospace;
  --font-title: Sofia Sans Extra Condensed, sans-serif;

  --text-*: initial;
  --text-sm: 0.875rem; /* 14px */
  --text-base: 1rem; /* 16px */
  --text-lg: 1.125rem; /* 18px */
  --text-xl: 1.25rem; /* 20px */
  --text-2xl: 1.5rem; /* 24px */
  --text-3xl: 1.75rem; /* 28px */
  --text-4xl: 2rem; /* 32px */

  --leading-single: 1;

  --container-article: 40rem;
  --spacing-page-vertical: 1rem;
  --spacing-page-horizontal: 1.5rem;
  --breakpoint-page: 43rem;

  --spacing-2xs: 0.25rem; /* 4px */
  --spacing-xs: 0.5rem; /* 8px */
  --spacing-s: 0.75rem; /* 12px */
  --spacing-m: 1rem; /* 16px */
  --spacing-l: 1.5rem; /* 24px */
  --spacing-xl: 2rem; /* 32px */
  --spacing-2xl: 3rem; /* 48px */
  --spacing-3xl: 4rem; /* 64px */
  --spacing-4xl: 6rem; /* 96px */
  --spacing-5xl: 8rem; /* 128px */
}
```

### `src/app.d.ts`

Ambient compile-time entry point: App.Error extends AppError<ErrorTag>; App.Locals exposes nullable loggedInUser plus
requireLoggedInUser, hasPermission, and requirePermission. Declare both virtual:icons/_ and ~icons/_ default SVG Svelte
components. These wildcard module declarations are TypeScript ambient APIs, not shape name patterns. No runtime effect.

```typescript
import type { Permission } from '$lib/models/role';
import type { LoggedInUser } from '$lib/models/user';
import type { AppError, ErrorTag } from '$lib/errors';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Error extends AppError<ErrorTag> {}
    interface Locals {
      loggedInUser: LoggedInUser | null;
      requireLoggedInUser: (context: string) => LoggedInUser;
      hasPermission: (p: Permission) => boolean;
      requirePermission: (p: Permission, context: string) => LoggedInUser;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

declare module 'virtual:icons/*' {
  import { SvelteComponent } from 'svelte';
  import type { SvelteHTMLElements } from 'svelte/elements';
  export default class extends SvelteComponent<SvelteHTMLElements['svg']> {}
}

declare module '~icons/*' {
  import { SvelteComponent } from 'svelte';
  import type { SvelteHTMLElements } from 'svelte/elements';
  export default class extends SvelteComponent<SvelteHTMLElements['svg']> {}
}

export {};
```

### `src/app.html`

SvelteKit HTML template: Chinese language, viewport, icons, manifest, JSON Feed alternate URL, EXODUS social site name,
framework head/body placeholders, and hover data preloading. Feed discovery is hardcoded to
https://exodus.ing/feeds/articles.json. Substitution belongs to SvelteKit; no exported names.

### `src/error.html`

Fallback HTML error template outside normal application rendering: substitute status/message into title/body, provide a
Chinese-language page, viewport, icon, and independent light/dark inline styling. No database access, scripts, or
application exports.

### `src/hooks.server.ts`

#### `handle`

```typescript
export declare const handle: Handle;
```

Read APP_URL through configuration for every request. If the full request URL does not start with that string, redirect
303 to APP_URL. Otherwise use `attachLocals` from `src/lib/server/auth.ts` to attach authentication locals, resolve the request, and log pathname and elapsed milliseconds
on success. This is a string-prefix comparison, not parsed-origin equality.

#### `init`

```typescript
export declare const init: ServerInit;
```

Build services when either exported `db` or `adapters` binding is falsy. This is startup work; importing the hooks only registers
these entry points.
