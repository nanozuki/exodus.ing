import type { InviteCode, InviteCodeRepository } from '$lib/domain/entities/invite_code';
import { AppError } from '$lib/errors';
import type { User } from '$lib/domain/entities/user';
import type { Role, RoleRepository } from '../entities/role';

const INVITE_CODE_EXPIRATION = 30 * 86400 * 1000; // 30 days

export class InviteCodeService {
  constructor(
    private readonly inviteCodeRepo: InviteCodeRepository,
    private readonly roleRepo: RoleRepository,
  ) {}

  async createInviteCode(inviterId: string, roleKey: string): Promise<InviteCode> {
    const validFrom = Date.now();
    const validTo = validFrom + INVITE_CODE_EXPIRATION;
    return await this.inviteCodeRepo.create({ inviterId, roleKey, validFrom, validTo });
  }

  async acceptInviteCode(loggedInUser: User, code: string): Promise<void> {
    const inviteCode = await this.inviteCodeRepo.findByCode(code);
    if (!inviteCode) {
      return AppError.InviteCodeMissed('Invite code not found').throw();
    }
    const now = new Date();
    if (inviteCode.validFrom > now || inviteCode.validTo < now) {
      return AppError.InvalidInviteCode('Invite code is expired').throw();
    }
    if (inviteCode.usedAt) {
      return AppError.InvalidInviteCode('Invite code is already used').throw();
    }
    await this.inviteCodeRepo.useCode(code);
    await this.roleRepo.specifyRoleByOther(loggedInUser.id, inviteCode.roleKey as Role, inviteCode.inviterId);
    // TODO: maybe update loggedInUser's role in memory
  }
}
