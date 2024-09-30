import type { ArticleUseCase } from '$lib/server/use_case/article';
import type { AuthUseCase } from '$lib/server/use_case/auth';
import type { UserUseCase } from '$lib/server/use_case/user';
import type { UserDomainUseCase } from '$lib/server/use_case/user_domain';

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
      article: ArticleUseCase;
      user: UserUseCase;
      userDomain: UserDomainUseCase;
      auth: AuthUseCase;
    }
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
