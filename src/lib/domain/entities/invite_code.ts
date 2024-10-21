export interface InviteCode {
  id: number;
  code: string;
  validFrom: Date;
  validTo: Date;
}

export function isInviteCodeValid(inviteCode: InviteCode, at: Date): boolean {
  return inviteCode.validFrom <= at && at < inviteCode.validTo;
}

export interface InviteCodeRepository {
  findByCode(code: string): Promise<InviteCode | null>;
}
