import type { Permission } from '#lib/models/role.js';
import type { LoggedInUser } from '#lib/models/user.js';
import type { ErrorDetail } from '#lib/errors.js';

declare global {
  namespace App {
    interface Error {
      detail?: ErrorDetail;
    }
    interface Locals {
      loggedInUser: LoggedInUser | null;
      requireLoggedInUser: (context: string) => LoggedInUser;
      hasPermission: (p: Permission) => boolean;
      requirePermission: (p: Permission, context: string) => LoggedInUser;
    }
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
