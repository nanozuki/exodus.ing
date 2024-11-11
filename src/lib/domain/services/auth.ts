import type { User } from '$lib/domain/entities/user';
import type { AuthPort, State, StateInput } from '$lib/domain/ports';
import { AppError } from '$lib/errors';
import type { GitHubUser } from './user';

export class AuthService {
  constructor(private readonly auth: AuthPort) {}

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

  async handleGithubCallback(code: string, state: string): Promise<GitHubUser> {
    const storedState = await this.auth.getState(state);
    if (state !== storedState.state) {
      return AppError.OAuthValidationError('invalid state').throw();
    }

    const gitHubUser = await this.auth.validateGithubCode(code);
    return gitHubUser;
  }
}
