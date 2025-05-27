import {
  inviteCodeQuota,
  type InviteCode,
  type InviteCodeCard,
  type InviteCodeRepository,
} from '$lib/domain/entities/invite_code';
import { AppError } from '$lib/errors';
import type { Relation } from '$lib/domain/entities/role';
import type { Role, RoleRepository } from '../entities/role';

const INVITE_CODE_EXPIRATION = 30 * 86400 * 1000; // 30 days

export interface UserInvitationData {
  quota: number;
  inviter: Relation | undefined;
  invitees: Relation[];
  unusedCodes: InviteCodeCard[];
}

export class InviteCodeService {
  constructor(
    private readonly inviteCodeRepo: InviteCodeRepository,
    private readonly roleRepo: RoleRepository,
  ) {}

  async createInviteCode(inviterId: string, roleKey: string): Promise<InviteCode> {
    const validFrom = Date.now();
    const validTo = validFrom + INVITE_CODE_EXPIRATION;
    const input = { inviterId, roleKey, validFrom, validTo };
    return await this.inviteCodeRepo.create(input, inviteCodeQuota);
  }

  async acceptInviteCode(userId: string, code: string): Promise<void> {
    const inviteCode = await this.inviteCodeRepo.findByCode(code);
    if (!inviteCode) {
      return AppError.InviteCodeMissed('Invite code not found').throw();
    }
    if (inviteCode.usedAt) {
      return AppError.InvalidInviteCode('Invite code is already used').throw();
    }
    await this.inviteCodeRepo.useCode(code);
    await this.roleRepo.specifyRoleByOther(userId, inviteCode.roleKey as Role, inviteCode.inviterId);
  }

  async getUserInvitationData(userId: string): Promise<UserInvitationData> {
    const [inviter, invitees, unusedCodes, quota] = await Promise.all([
      this.roleRepo.getInviter(userId),
      this.roleRepo.getInvitees(userId),
      this.inviteCodeRepo.getUserUnusedCodes(userId),
      this.inviteCodeRepo.getUserInviteQuota(userId, inviteCodeQuota),
    ]);
    return { inviter, invitees, unusedCodes, quota };
  }

  async deleteInviteCode(userId: string, code: string): Promise<void> {
    await this.inviteCodeRepo.delete(userId, code);
  }
}
