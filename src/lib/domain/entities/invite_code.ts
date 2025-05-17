export interface InviteCode {
  id: number;
  code: string;
  validFrom: Date;
  validTo: Date;
  inviterId: string;
  roleKey: string;
  usedAt: Date | null;
}

export function isInviteCodeValid(inviteCode: InviteCode, at: Date): boolean {
  return inviteCode.validFrom <= at && at < inviteCode.validTo;
}

export interface InviteCodeInput {
  inviterId: string;
  roleKey: string;
  validFrom: number;
  validTo: number;
}

export interface InviteCodeRepository {
  create(input: InviteCodeInput): Promise<InviteCode>;
  findByCode(code: string): Promise<InviteCode | null>;
  useCode(code: string): Promise<void>;
}
