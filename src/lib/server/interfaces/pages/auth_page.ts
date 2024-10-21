import type { AuthService } from '$lib/domain/services/auth';
import type { InviteCodeService } from '$lib/domain/services/invite_code';
import type { UserService } from '$lib/domain/services/user';
import { AppError } from '$lib/errors';

export class AuthPage {
  constructor(
    private readonly auth: AuthService,
    private readonly user: UserService,
    private readonly inviteCode: InviteCodeService,
  ) {}

  async validateInviteCode(inviteCode: string): Promise<boolean> {
    return await this.inviteCode.validateInviteCode(inviteCode);
  }

  async registerByGithub(inviteCode: string): Promise<URL> {
    return await this.auth.authByGithub(inviteCode);
  }

  async loginByGithub(): Promise<URL> {
    return await this.auth.authByGithub();
  }

  async handleGithubCallback(code: string, state: string): Promise<void> {
    const stateData = await this.auth.getValidState(state);
    const ghUser = await this.auth.handleGithubCallback(code, state);
    let user = await this.user.findUserByGitHubId(ghUser.id);

    if (user) {
      // exsiting user
      await this.auth.setSession(user.id);
      return;
    }

    // new user
    if (!stateData.inviteCode) {
      return AppError.InviteCodeMissed().throw();
    }
    if (!(await this.validateInviteCode(stateData.inviteCode))) {
      return AppError.InvalidInviteCode().throw();
    }
    user = await this.user.createUserByGitHub(ghUser);
    await this.auth.setSession(user.id);
  }
}
