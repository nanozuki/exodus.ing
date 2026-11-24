import type { InviteCode } from '#lib/models/invite_code.js';
import type { LoggedInUser } from '#lib/models/user.js';
import { userHasPermission } from '#lib/models/user.js';
import { Permission, Role } from '#lib/models/role.js';
import { throwError } from '#lib/errors.js';
import type { AppDatabase } from '#lib/server/db/schema.js';
import type { Clock } from '#lib/server/adapters/clock.js';
import * as invites from '#lib/server/repositories/invite_code.js';
import { createRoleOfUserByInviteCode } from '#lib/server/repositories/role.js';

/** How many more invitations the user may create: articles minus unused codes minus invited users, at least 0. */
export async function getInviteQuota(deps: { db: AppDatabase }, params: { userId: string }): Promise<number> {
  const { articleCount, validCodeCount, invitedCount } = await invites.getInviteStatsOfUser(deps.db, params.userId);
  return Math.max(articleCount - validCodeCount - invitedCount, 0);
}

/**
 * Creates an `ArticleAuthor` invitation from the actor. Requires `CreateArticle` (FORBIDDEN otherwise); a used-up
 * quota throws BAD_REQUEST `邀请码配额已用完`. The quota statistics are rechecked in a serializable transaction on
 * insert, so concurrent creations never over-issue: the losing request throws BAD_REQUEST `邀请状态已变化，请重试`
 * when the change is detected, or DATABASE_ERROR when the database aborts the transaction. Nothing retries either.
 *
 * TODO: throw the same BAD_REQUEST `邀请状态已变化，请重试` when the database aborts the transaction, so a concurrent
 * creation always ends in retry guidance rather than a server error.
 */
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

/**
 * Redeems `code` for the actor: grants the code's role and marks it used at `now()` in one transaction, so a
 * concurrent redemption cannot grant a second role. A missing or already used code throws PARAMETER_INVALID on
 * `inviteCode`. The code is consumed even when the actor already has its role; self-invitation is allowed.
 */
export async function acceptInviteCode(
  deps: { db: AppDatabase; now: Clock },
  params: { actor: LoggedInUser; code: string },
): Promise<void> {
  const code = await invites.findInviteCodeByCode(deps.db, params.code);
  if (!code) return throwError('PARAMETER_INVALID', { inviteCode: '邀请码不存在' });
  if (code.usedAt) return throwError('PARAMETER_INVALID', { inviteCode: '邀请码已被使用' });
  const usedAt = deps.now();
  await createRoleOfUserByInviteCode(deps.db, { code: params.code, userId: params.actor.id, usedAt });
}
