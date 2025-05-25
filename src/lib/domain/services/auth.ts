import type { Cookies } from '@sveltejs/kit';
import type { GitHubUser } from '$lib/domain/services/user';
import type { User, UserRepository } from '$lib/domain/entities/user';
import { AppError } from '$lib/errors';

export interface State {
  state: string;
  next?: string;
  signUp?: { username?: string; name?: string };
}

export interface StateInput {
  next?: string;
  signUp?: { username?: string; name?: string };
}

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
      const user = await this.user.findByKey(username);
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
    // TODO: covert to (cookies, code, state) => Promise<{GitHubUser, next}>
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
    // new user, TODO: no need invite code for now
    AppError.InternalServerError('user not found').throw();
    return storedState;
  }
}
