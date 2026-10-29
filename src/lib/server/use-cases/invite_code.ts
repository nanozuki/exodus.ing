import type { InviteCode } from '$lib/models/invite_code';
import type { LoggedInUser } from '$lib/models/user';
import { userHasPermission } from '$lib/models/user';
import { Permission, Role } from '$lib/models/role';
import { throwError } from '$lib/errors';
import type { AppDatabase } from '$lib/server/db/schema';
import * as invites from '$lib/server/repositories/invite_code';
import { createRoleOfUserByInviteCode } from '$lib/server/repositories/role';

export async function getInviteQuota(deps: { db: AppDatabase }, params: { userId: string }): Promise<number> {
  const { articleCount, validCodeCount, invitedCount } = await invites.getInviteStatsOfUser(deps.db, params.userId);
  return Math.max(articleCount - validCodeCount - invitedCount, 0);
}

// Concurrent changes can reject creation with retry guidance; no automatic retry is performed.
export async function createInviteCode(
  deps: { db: AppDatabase },
  params: { actor: LoggedInUser },
): Promise<InviteCode> {
  if (!userHasPermission(params.actor, Permission.CreateArticle))
    return throwError('FORBIDDEN', { operation: 'create invite code' });
  const expectedStats = await invites.getInviteStatsOfUser(deps.db, params.actor.id);
  const { articleCount, validCodeCount, invitedCount } = expectedStats;
  if (Math.max(articleCount - validCodeCount - invitedCount, 0) <= 0)
    return throwError('BAD_REQUEST', '邀请码配额已用完');
  return invites.createInviteCode(deps.db, { inviterId: params.actor.id, roleKey: Role.ArticleAuthor, expectedStats });
}

export async function acceptInviteCode(
  deps: { db: AppDatabase; now: () => Date },
  params: { actor: LoggedInUser; code: string },
): Promise<void> {
  const code = await invites.findInviteCodeByCode(deps.db, params.code);
  if (!code) return throwError('PARAMETER_INVALID', { inviteCode: '邀请码不存在' });
  if (code.usedAt) return throwError('PARAMETER_INVALID', { inviteCode: '邀请码已被使用' });
  const usedAt = deps.now();
  await createRoleOfUserByInviteCode(deps.db, { code: params.code, userId: params.actor.id, usedAt });
}
