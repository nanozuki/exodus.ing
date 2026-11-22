export interface InviteCode {
  id: number;
  code: string;
  inviterId: string;
  roleKey: string;
  usedAt: Date | null;
}

export type InviteCodeSummary = Pick<InviteCode, 'code' | 'roleKey'>;

/**
 * An inviter's invitation statistics: articles they authored, unused codes they issued, and role assignments they are
 * the inviter of. All counts describe the same database snapshot. Use cases derive the quota from them.
 */
export interface InviteStats {
  articleCount: number;
  validCodeCount: number;
  invitedCount: number;
}
