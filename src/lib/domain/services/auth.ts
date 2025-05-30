import type { Cookies } from '@sveltejs/kit';
import type { GitHubUser } from '$lib/domain/services/user';
import type { User, UserRepository } from '$lib/domain/entities/user';
import { AppError } from '$lib/errors';
import { z } from 'zod';

export const StateSchema = z.object({
  state: z.string(),
  next: z.string().optional(),
  signUp: z
    .object({
      username: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
});

export type State = z.infer<typeof StateSchema>;

export interface StateInput {
  next?: string;
  signUp?: { username?: string; name?: string };
}

// TODO: move the Cookies out of the domain layer
export interface AuthAdapter {
  // Session/State operations
  loadSession(cookies: Cookies): Promise<User | null>;
  setSession(cookies: Cookies, userId: string): Promise<void>;
  getAuthState(cookies: Cookies): Promise<State>;
  // GitHub OAuth operations
  createGithubAuthUrl(cookies: Cookies, input: StateInput): Promise<URL>;
  getGitHubUserByCode(code: string): Promise<GitHubUser>;
}

export class AuthService {
  constructor(
    private readonly auth: AuthAdapter,
    private readonly user: UserRepository,
  ) {}

  async loadSession(cookies: Cookies): Promise<User | null> {
    return await this.auth.loadSession(cookies);
  }

  async authByGithub(cookies: Cookies, input: StateInput): Promise<URL> {
    const username = input.signUp?.username;
    const name = input.signUp?.name || username;
    if (username) {
      if (username.startsWith('@')) {
        return AppError.UsernameCannotStartWithAt(username).throw();
      }
      const user = await this.user.findByUsername(username);
      if (user) {
        return AppError.UsernameAlreadyExist(username).throw();
      }
    }
    if (name) {
      const user = await this.user.findByName(name);
      if (user) {
        return AppError.NameAlreadyExist(name).throw();
      }
    }
    const authUrl = await this.auth.createGithubAuthUrl(cookies, input);
    return authUrl;
  }

  async handleGithubCallback(cookies: Cookies, code: string, state: string): Promise<State> {
    const storedState = await this.auth.getAuthState(cookies);
    if (state !== storedState.state) {
      return AppError.OAuthValidationError('invalid state').throw();
    }
    const ghUser = await this.auth.getGitHubUserByCode(code);
    const user = await this.user.findByGitHubId(ghUser.id);

    if (user) {
      // exsiting user
      await this.auth.setSession(cookies, user.id);
      return storedState;
    }

    // new user, create user
    const newUser = await this.user.create({
      username: storedState.signUp?.username || ghUser.username,
      name: storedState.signUp?.name || ghUser.username,
      githubId: ghUser.id,
      aboutMe: '',
    });
    if (newUser.username.startsWith('@')) {
      return AppError.UsernameCannotStartWithAt(newUser.username).throw();
    }
    await this.auth.setSession(cookies, newUser.id);
    return storedState;
  }
}
