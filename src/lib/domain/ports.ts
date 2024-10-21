import type { User } from '$lib/domain/entities/user';
import { z } from 'zod';
import type { GitHubUser } from './services/user';

export interface Cookie {
  name: string;
  value: string;
  attributes: {
    secure?: boolean;
    path: string;
    domain?: string;
    sameSite?: 'lax' | 'strict' | 'none';
    httpOnly?: boolean;
    maxAge?: number;
    expires?: Date;
  };
}

export const State = z.object({
  state: z.string(),
  inviteCode: z.string().optional(),
});
export type State = z.infer<typeof State>;

export interface AuthPort {
  get loggedInUser(): User | null;

  loadSession(): Promise<void>;
  setSession(userId: string): Promise<void>;
  getState(state: string): Promise<State>;
  createAndSetState(inviteCode?: string): Promise<string>;

  createGithubAuthUrl(state: string): Promise<URL>;
  validateGithubCode(code: string): Promise<GitHubUser>;
}

export interface NameResolver {
  resolveTxt(domain: string): Promise<string[]>;
}
