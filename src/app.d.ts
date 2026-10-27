import type { Permission } from '$lib/models/role';
import type { LoggedInUser } from '$lib/models/user';
import type { AppError, ErrorTag } from '$lib/errors';

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
