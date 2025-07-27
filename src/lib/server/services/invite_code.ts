import { inviteCodeQuota, type InviteCode, type InviteCodeCard } from '$lib/domain/entities/invite_code';
import { throwError } from '$lib/errors';
import type { Relation, Role } from '$lib/domain/entities/role';
import { repositories } from '$lib/server/registry';

const INVITE_CODE_EXPIRATION = 30 * 86400 * 1000; // 30 days

export interface UserInvitationData {
  quota: number;
  inviter: Relation | undefined;
  invitees: Relation[];
  unusedCodes: InviteCodeCard[];
}

export class InviteCodeService {
  constructor() {}

  async createInviteCode(inviterId: string, roleKey: string): Promise<InviteCode> {
    const validFrom = Date.now();
    const validTo = validFrom + INVITE_CODE_EXPIRATION;
    const input = { inviterId, roleKey, validFrom, validTo };
    return await repositories.inviteCode.create(input, inviteCodeQuota);
  }

  async acceptInviteCode(userId: string, code: string): Promise<void> {
    const inviteCode = await repositories.inviteCode.findByCode(code);
    if (!inviteCode) {
      return throwError('BAD_REQUEST', '邀请码不能为空');
    }
    if (inviteCode.usedAt) {
      return throwError('BAD_REQUEST', '邀请码已被使用');
    }
    await repositories.inviteCode.useCode(code);
    await repositories.role.specifyRoleByOther(userId, inviteCode.roleKey as Role, inviteCode.inviterId);
  }

  async getUserInvitationData(userId: string): Promise<UserInvitationData> {
    const [inviter, invitees, unusedCodes, quota] = await Promise.all([
      repositories.role.getInviter(userId),
      repositories.role.getInvitees(userId),
      repositories.inviteCode.getUserUnusedCodes(userId),
      repositories.inviteCode.getUserInviteQuota(userId, inviteCodeQuota),
    ]);
    return { inviter, invitees, unusedCodes, quota };
  }

  async deleteInviteCode(userId: string, code: string): Promise<void> {
    await repositories.inviteCode.delete(userId, code);
  }
}
