import type { User } from '$lib/domain/entities/user';
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

export interface State {
  state: string;
  inviteCode?: string;
}

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
