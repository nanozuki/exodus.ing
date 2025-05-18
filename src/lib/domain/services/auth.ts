import type { User } from '$lib/domain/entities/user';
import { AppError } from '$lib/errors';
import type { InviteCodeService } from './invite_code';
import type { UserService, GitHubUser } from './user';
import type { Cookies } from '@sveltejs/kit';

export interface State {
  state: string;
  inviteCode?: string;
  next?: string;
}

export interface StateInput {
  inviteCode?: string;
  next?: string;
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
    private readonly user: UserService,
    private readonly inviteCode: InviteCodeService,
  ) {}

  async loadSession(cookies: Cookies): Promise<User | null> {
    return await this.auth.loadSession(cookies);
  }

  async authByGithub(cookies: Cookies, input: StateInput): Promise<URL> {
    return await this.auth.createGithubAuthUrl(cookies, input);
  }

  async handleGithubCallback(cookies: Cookies, code: string, state: string): Promise<State> {
    // TODO: covert to (cookies, code, state) => Promise<{GitHubUser, next}>
    const storedState = await this.auth.getAuthState(cookies);
    if (state !== storedState.state) {
      return AppError.OAuthValidationError('invalid state').throw();
    }
    const ghUser = await this.auth.getGitHubUserByCode(code);
    const user = await this.user.findUserByGitHubId(ghUser.id);

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
