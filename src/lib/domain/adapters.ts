import { z } from 'zod';

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

export interface GitHubUser {
  id: number;
  login: string;
}

export type SessionUser = import('lucia').User;

export const State = z.object({
  state: z.string(),
  inviteCode: z.string().optional(),
});
export type State = z.infer<typeof State>;

export interface AuthService {
  requireLoggedInUser(): SessionUser;
  loggedInUser: SessionUser | null;

  loadSession(): Promise<void>;
  setSession(userId: string): Promise<void>;
  getState(state: string): Promise<State>;
  createAndSetState(inviteCode?: string): Promise<string>;

  createGithubAuthUrl(state: string): Promise<URL>;
  validateGithubCode(code: string): Promise<GitHubUser>;
}

export interface Clock {
  now(): Date;
}

export interface NameResolver {
  resolveTxt(domain: string): Promise<string[]>;
}
