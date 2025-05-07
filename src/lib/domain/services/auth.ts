import type { User } from '$lib/domain/entities/user';
import { AppError } from '$lib/errors';
import type { InviteCodeService } from './invite_code';
import type { UserService, GitHubUser } from './user';

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
  next?: string;
}

export interface StateInput {
  inviteCode?: string;
  next?: string;
}

export interface AuthAdapter {
  get loggedInUser(): User | null;

  loadSession(): Promise<void>;
  setSession(userId: string): Promise<void>;
  getState(state: string): Promise<State>;
  createAndSetState(input: StateInput): Promise<string>;

  createGithubAuthUrl(state: string): Promise<URL>;
  validateGithubCode(code: string): Promise<GitHubUser>;
}

export class AuthService {
  constructor(
    private readonly auth: AuthAdapter,
    private readonly user: UserService,
    private readonly inviteCode: InviteCodeService,
  ) {}

  requireLoggedInUser(context?: string): User {
    const user = this.auth.loggedInUser;
    if (!user) {
      return AppError.Unauthorized(context).throw();
    }
    return user;
  }

  loadSession(): Promise<void> {
    return this.auth.loadSession();
  }

  get loggedInUser(): User | null {
    return this.auth.loggedInUser;
  }

  async setSession(userId: string): Promise<void> {
    return this.auth.setSession(userId);
  }

  async getValidState(state: string): Promise<State> {
    const storedState = await this.auth.getState(state);
    if (state !== storedState.state) {
      return AppError.OAuthValidationError('invalid state').throw();
    }
    return storedState;
  }

  async authByGithub(input: StateInput): Promise<URL> {
    const state = await this.auth.createAndSetState(input);
    return await this.auth.createGithubAuthUrl(state);
  }

  async handleGithubCallback(code: string, stateVal: string): Promise<State> {
    const state = await this.auth.getState(stateVal);
    if (stateVal !== state.state) {
      return AppError.OAuthValidationError('invalid state').throw();
    }
    const ghUser = await this.auth.validateGithubCode(code);
    let user = await this.user.findUserByGitHubId(ghUser.id);

    if (user) {
      // exsiting user
      await this.auth.setSession(user.id);
      return state;
    }
    // new user
    if (!state.inviteCode) {
      return AppError.InviteCodeMissed().throw();
    }
    if (!(await this.inviteCode.validateInviteCode(state.inviteCode))) {
      return AppError.InvalidInviteCode().throw();
    }
    user = await this.user.createUserByGitHub(ghUser);
    await this.auth.setSession(user.id);
    return state;
  }
}
