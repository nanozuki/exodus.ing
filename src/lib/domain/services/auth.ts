import type { AuthPort, GitHubUser } from '$lib/domain/ports';
import { isInviteCodeValid, type InviteCodeRepository } from '$lib/domain/entities/invite_code';
import type { User, UserRepository } from '$lib/domain/entities/user';
import { AppError } from '$lib/errors';

export class AuthService {
  constructor(
    private readonly auth: AuthPort,
    private readonly inviteCode: InviteCodeRepository,
    private readonly user: UserRepository,
  ) {} // TODO: split this services

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

  async validateInviteCode(inviteCode: string): Promise<boolean> {
    const code = await this.inviteCode.findByCode(inviteCode);
    return code ? isInviteCodeValid(code, new Date()) : false;
  }

  async authByGithub(inviteCode?: string): Promise<URL> {
    const state = await this.auth.createAndSetState(inviteCode);
    return await this.auth.createGithubAuthUrl(state);
  }

  private async createUserByGitHub(gitHubUser: GitHubUser): Promise<User> {
    const userId = await this.user.generateId();
    const now = new Date();
    const user = {
      id: userId,
      createdAt: now,
      updatedAt: now,
      username: gitHubUser.login,
      githubId: gitHubUser.id,
      name: gitHubUser.login,
      aboutMe: '',
    };
    await this.user.create(user);
    return user;
  }

  async handleGithubCallback(code: string, state: string): Promise<void> {
    const storedState = await this.auth.getState(state);
    if (state !== storedState.state) {
      return AppError.OAuthValidationError('invalid state').throw();
    }

    const gitHubUser = await this.auth.validateGithubCode(code);
    const existingUser = await this.user.findByGitHubId(gitHubUser.id);
    if (existingUser) {
      await this.auth.setSession(existingUser.id);
      return;
    }

    if (!storedState.inviteCode) {
      return AppError.InviteCodeMissed().throw();
    }
    const valid = await this.validateInviteCode(storedState.inviteCode);
    if (!valid) {
      return AppError.InvalidInviteCode().throw();
    }

    const user = await this.createUserByGitHub(gitHubUser);
    await this.auth.setSession(user.id);
  }
}
