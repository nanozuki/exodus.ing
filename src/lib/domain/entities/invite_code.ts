export interface InviteCode {
  id: number;
  code: string;
  inviterId: string;
  roleKey: string;
  usedAt: Date | null;
}

export type InviteCodeCard = Pick<InviteCode, 'code' | 'roleKey'>;

export function isInviteCodeValid(inviteCode: InviteCode): boolean {
  return inviteCode.usedAt === null;
}

interface InviteQuotaInput {
  articleCount: number;
  validCodeCount: number;
  invitedCount: number;
}

// Use this pattern to define logic in domain, but ensure atomicity in the repository
export type InviteQuotaAlgorithm = (input: InviteQuotaInput) => number;
export function inviteCodeQuota(input: InviteQuotaInput): number {
  return Math.max(input.articleCount - input.validCodeCount - input.invitedCount, 0);
}

export interface InviteCodeInput {
  inviterId: string;
  roleKey: string;
}

export interface InviteCodeRepository {
  create(input: InviteCodeInput, quotaAlgo: InviteQuotaAlgorithm): Promise<InviteCode>;
  findByCode(code: string): Promise<InviteCode | null>;
  useCode(code: string): Promise<void>;
  delete(userId: string, code: string): Promise<void>;
  getUserUnusedCodes(userId: string): Promise<InviteCodeCard[]>;
  getUserInviteQuota(userId: string, algo: InviteQuotaAlgorithm): Promise<number>;
}
