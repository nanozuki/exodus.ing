export interface InviteCode {
  id: number;
  code: string;
  validFrom: Date;
  validTo: Date;
  inviterId: string;
  roleKey: string;
  usedAt: Date | null;
}

export type InviteCodeCard = Pick<InviteCode, 'code' | 'validTo' | 'roleKey'>;

export function isInviteCodeValid(inviteCode: InviteCode, at: Date): boolean {
  return inviteCode.validFrom <= at && at < inviteCode.validTo;
}

interface InviteQuotaInput {
  articleCount: number;
  validCodeCount: number; // unused and used codes, expect expired codes
}

// Use this pattern to define logic in domain, but ensure atomicity in the repository
export type InviteQuotaAlgorithm = (input: InviteQuotaInput) => number;
export function inviteCodeQuota(input: InviteQuotaInput): number {
  return input.articleCount - input.validCodeCount;
}

export interface InviteCodeInput {
  inviterId: string;
  roleKey: string;
  validFrom: number;
  validTo: number;
}

export interface InviteCodeRepository {
  create(input: InviteCodeInput, quotaAlgo: InviteQuotaAlgorithm): Promise<InviteCode>;
  findByCode(code: string): Promise<InviteCode | null>;
  useCode(code: string): Promise<void>;
  getUserUnusedCodes(userId: string): Promise<InviteCodeCard[]>;
}
