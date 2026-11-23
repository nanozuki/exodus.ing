// invite_code.ts persists invitation codes and exposes consistent quota inputs. Quota arithmetic belongs to the
// invitation use case.

import type { InviteCode, InviteCodeSummary, InviteStats } from '#lib/models/invite_code.js';
import { throwError } from '#lib/errors.js';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { tArticle, tInviteCode, tUserRole, type AppDatabase } from '#lib/server/db/schema.js';
import { newCode, wrap } from './utils';

type QueryDatabase = Pick<AppDatabase, 'select'>;

async function statistics(db: QueryDatabase, userId: string): Promise<InviteStats> {
  // Scalar subqueries share the statement's PostgreSQL snapshot.
  const [result] = await db
    .select({
      articleCount: sql<number>`(select count(*)::integer from ${tArticle} where ${tArticle.userId} = ${userId})`,
      validCodeCount: sql<number>`(select count(*)::integer from ${tInviteCode} where ${tInviteCode.inviterId} = ${userId} and ${tInviteCode.usedAt} is null)`,
      invitedCount: sql<number>`(select count(*)::integer from ${tUserRole} where ${tUserRole.inviterId} = ${userId})`,
    })
    .from(sql`(select 1) as snapshot`);
  return result;
}

export async function findInviteCodeByCode(db: AppDatabase, code: string): Promise<InviteCode | null> {
  return wrap(
    'findInviteCodeByCode',
    async () => (await db.select().from(tInviteCode).where(eq(tInviteCode.code, code)))[0] ?? null,
  );
}

/** Returns every unused code the user issued, in unspecified order. */
export async function getUnusedInviteCodesOfUser(db: AppDatabase, userId: string): Promise<InviteCodeSummary[]> {
  return wrap('getUnusedInviteCodesOfUser', () =>
    db
      .select({ code: tInviteCode.code, roleKey: tInviteCode.roleKey })
      .from(tInviteCode)
      .where(and(eq(tInviteCode.inviterId, userId), isNull(tInviteCode.usedAt))),
  );
}

/** Reads the user's authored article, unused code, and invited role-row counts from one snapshot. */
export async function getInviteStatsOfUser(db: AppDatabase, userId: string): Promise<InviteStats> {
  return wrap('getInviteStatsOfUser', () => statistics(db, userId));
}

/**
 * `expectedStats` is the `getInviteStatsOfUser` snapshot on which the use case approved issuance. It is a concurrency
 * precondition, not a quota policy.
 */
export interface CreateInviteCodeParams {
  inviterId: string;
  roleKey: string;
  expectedStats: InviteStats;
}

/**
 * Inserts an unused 16-character code after confirming, inside a serializable transaction, that the current statistics
 * still equal `expectedStats`. A changed snapshot throws BAD_REQUEST with retry guidance and writes nothing.
 * Serialization failures propagate as DATABASE_ERROR without retry; a new attempt requires fresh statistics.
 */
export async function createInviteCode(db: AppDatabase, params: CreateInviteCodeParams): Promise<InviteCode> {
  return wrap('createInviteCode', () =>
    db.transaction(
      async (tx) => {
        const current = await statistics(tx, params.inviterId);
        if (
          current.articleCount !== params.expectedStats.articleCount ||
          current.validCodeCount !== params.expectedStats.validCodeCount ||
          current.invitedCount !== params.expectedStats.invitedCount
        )
          return throwError('BAD_REQUEST', '邀请状态已变化，请重试');
        return (
          await tx
            .insert(tInviteCode)
            .values({ code: newCode(), inviterId: params.inviterId, roleKey: params.roleKey, usedAt: null })
            .returning()
        )[0];
      },
      { isolationLevel: 'serializable' },
    ),
  );
}

/** Scopes deletion to `inviterId`; it does not authorize the actor. */
export interface DeleteInviteCodeParams {
  inviterId: string;
  code: string;
}

/** Deletes the inviter's code, used or not, without checking existence. */
export async function deleteInviteCode(db: AppDatabase, params: DeleteInviteCodeParams): Promise<void> {
  return wrap('deleteInviteCode', async () => {
    await db
      .delete(tInviteCode)
      .where(and(eq(tInviteCode.inviterId, params.inviterId), eq(tInviteCode.code, params.code)));
  });
}
