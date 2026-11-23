// app.d.ts declares the ambient SvelteKit `App` types and the icon modules; it has no runtime effect.

import type { Permission } from '#lib/models/role.js';
import type { LoggedInUser } from '#lib/models/user.js';
import type { ErrorDetail } from '#lib/errors.js';

declare global {
  namespace App {
    interface Error {
      /** Business error detail; SvelteKit supplies `status` and `message`. Framework errors carry none. */
      detail?: ErrorDetail;
    }
    interface Locals {
      /** The authenticated viewer, or null for anonymous requests. */
      loggedInUser: LoggedInUser | null;
      /** Returns the viewer or throws UNAUTHORIZED naming the `context` operation. */
      requireLoggedInUser: (context: string) => LoggedInUser;
      /** Whether the viewer holds `p`; always false for anonymous requests. */
      hasPermission: (p: Permission) => boolean;
      /**
       * Returns the viewer holding `p`; throws UNAUTHORIZED when anonymous and FORBIDDEN without `p`.
       *
       * TODO: the previous contract named only FORBIDDEN. Decide whether anonymous viewers get UNAUTHORIZED or
       * FORBIDDEN, then align the code and this comment.
       */
      requirePermission: (p: Permission, context: string) => LoggedInUser;
    }
  }
}

/** unplugin-icons modules: each default export is an SVG component accepting `<svg>` attributes. */
declare module 'virtual:icons/*' {
  import { SvelteComponent } from 'svelte';
  import type { SvelteHTMLElements } from 'svelte/elements';
  export default class extends SvelteComponent<SvelteHTMLElements['svg']> {}
}

/** Alias of `virtual:icons/*`. */
declare module '~icons/*' {
  import { SvelteComponent } from 'svelte';
  import type { SvelteHTMLElements } from 'svelte/elements';
  export default class extends SvelteComponent<SvelteHTMLElements['svg']> {}
}

export {};
