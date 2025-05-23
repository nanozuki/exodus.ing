import type { Permission } from '$lib/domain/entities/role';
import type { User } from '$lib/domain/entities/user';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    interface Error {
      key: string;
      message: string;
      context?: string;
    }
    interface Locals {
      loggedInUser: User | null;
      requireLoggedInUser: (context: string) => User;
      hasPermission: (p: Permission) => Promise<boolean>;
      // Import example:
      // user: import('$lib/server/auth').SessionValidationResult['user'];
      // session: import('$lib/server/auth').SessionValidationResult['session'];
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
