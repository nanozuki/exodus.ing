import {
  inviteCodeQuota,
  type InviteCode,
  type InviteCodeCard,
  type InviteCodeRepository,
} from '$lib/domain/entities/invite_code';
import { AppError } from '$lib/errors';
import type { User } from '$lib/domain/entities/user';
import type { UserRelations } from '$lib/domain/entities/role';
import type { Role, RoleRepository } from '../entities/role';

const INVITE_CODE_EXPIRATION = 30 * 86400 * 1000; // 30 days

export interface UserInvitationData {
  quota: number;
  relations: UserRelations;
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

  async acceptInviteCode(loggedInUser: User, code: string): Promise<void> {
    const inviteCode = await this.inviteCodeRepo.findByCode(code);
    if (!inviteCode) {
      return AppError.InviteCodeMissed('Invite code not found').throw();
    }
    if (inviteCode.usedAt) {
      return AppError.InvalidInviteCode('Invite code is already used').throw();
    }
    await this.inviteCodeRepo.useCode(code);
    await this.roleRepo.specifyRoleByOther(loggedInUser.id, inviteCode.roleKey as Role, inviteCode.inviterId);
    // TODO: maybe update loggedInUser's role in memory
  }

  async getUserInvitationData(loggedInUser: User): Promise<UserInvitationData> {
    const [relations, unusedCodes, quota] = await Promise.all([
      this.roleRepo.getRelations(loggedInUser.id),
      this.inviteCodeRepo.getUserUnusedCodes(loggedInUser.id),
      this.inviteCodeRepo.getUserInviteQuota(loggedInUser.id, inviteCodeQuota),
    ]);
    return { relations, unusedCodes, quota };
  }

  async deleteInviteCode(loggedInUser: User, code: string): Promise<void> {
    await this.inviteCodeRepo.delete(loggedInUser.id, code);
  }
}
