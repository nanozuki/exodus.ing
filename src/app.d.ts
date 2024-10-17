import type { buildPages } from '$lib/server/interfaces/pages';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    interface Error {
      key: string;
      message: string;
      context?: string;
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Locals extends ReturnType<typeof buildPages> {}
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      env: {
        EXODUSING_DB: D1Database;
      };
    }
  }
}

export {};
