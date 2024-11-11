import type { State, StateInput } from '$lib/domain/ports';
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

  async registerByGithub(input: StateInput): Promise<URL> {
    return await this.auth.authByGithub(input);
  }

  async loginByGithub(input: StateInput): Promise<URL> {
    return await this.auth.authByGithub(input);
  }

  async handleGithubCallback(code: string, stateId: string): Promise<State> {
    const state = await this.auth.getValidState(stateId);
    const ghUser = await this.auth.handleGithubCallback(code, stateId);
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
    if (!(await this.validateInviteCode(state.inviteCode))) {
      return AppError.InvalidInviteCode().throw();
    }
    user = await this.user.createUserByGitHub(ghUser);
    await this.auth.setSession(user.id);
    return state;
  }
}
