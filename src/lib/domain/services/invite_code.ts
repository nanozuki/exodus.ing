import { isInviteCodeValid, type InviteCodeRepository } from '$lib/domain/entities/invite_code';

export class InviteCodeService {
  constructor(private readonly inviteCode: InviteCodeRepository) {}

  async validateInviteCode(inviteCode: string): Promise<boolean> {
    const code = await this.inviteCode.findByCode(inviteCode);
    return code ? isInviteCodeValid(code, new Date()) : false;
  }
}
