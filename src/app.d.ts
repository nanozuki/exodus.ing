import type { Permission } from '$lib/domain/entities/role';
import type { LoggedInUser } from '$lib/domain/entities/user';
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
