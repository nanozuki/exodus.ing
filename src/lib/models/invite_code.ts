export interface InviteCode {
  id: number;
  code: string;
  inviterId: string;
  roleKey: string;
  usedAt: Date | null;
}

export type InviteCodeSummary = Pick<InviteCode, 'code' | 'roleKey'>;

// All counts describe the same database snapshot.
export interface InviteStats {
  articleCount: number;
  validCodeCount: number;
  invitedCount: number;
}
