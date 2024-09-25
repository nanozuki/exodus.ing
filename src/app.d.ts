import { type Database } from '$lib/server/locals';
import { type GitHub } from 'arctic';
import { type Lucia, Session, User } from 'lucia';

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
      db: Database;
      lucia: Lucia;
      github: GitHub;
      user: User | null;
      session: Session | null;
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
