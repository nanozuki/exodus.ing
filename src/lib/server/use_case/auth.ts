import type { GitHubUser } from '$lib/domain/adapters';
import { isInviteCodeValid } from '$lib/domain/invite_code';
import type { User } from '$lib/domain/user';
import { AppError } from '$lib/errors';
import type { Context } from '$lib/server/context';

export class AuthUseCase {
  constructor(private ctx: Context) {}

  requireLoggedInUser(context?: string): User {
    const user = this.ctx.auth._loggedInUser;
    if (!user) {
      return AppError.Unauthorized(context).throw();
    }
    return user;
  }

  get loggedInUser(): User | null {
    return this.ctx.auth._loggedInUser;
  }

  async validateInviteCode(inviteCode: string): Promise<boolean> {
    const code = await this.ctx.inviteCode.findByCode(inviteCode);
    return code ? isInviteCodeValid(code, this.ctx.clock.now()) : false;
  }

  async authByGithub(inviteCode?: string): Promise<URL> {
    const state = await this.ctx.auth.createAndSetState(inviteCode);
    return await this.ctx.auth.createGithubAuthUrl(state);
  }

  private async createUserByGitHub(gitHubUser: GitHubUser): Promise<User> {
    const userId = await this.ctx.user.generateId();
    const now = this.ctx.clock.now();
    const user = {
      id: userId,
      createdAt: now,
      updatedAt: now,
      username: gitHubUser.login,
      githubId: gitHubUser.id,
      name: gitHubUser.login,
      aboutMe: '',
    };
    await this.ctx.user.create(user);
    return user;
  }

  async handleGithubCallback(code: string, state: string): Promise<void> {
    const storedState = await this.ctx.auth.getState(state);
    if (state !== storedState.state) {
      return AppError.OAuthValidationError('invalid state').throw();
    }

    const gitHubUser = await this.ctx.auth.validateGithubCode(code);
    const existingUser = await this.ctx.user.findByGitHubId(gitHubUser.id);
    if (existingUser) {
      await this.ctx.auth.setSession(existingUser.id);
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
    await this.ctx.auth.setSession(user.id);
  }

  async setSession(userId: string): Promise<void> {
    return await this.ctx.auth.setSession(userId);
  }
}
