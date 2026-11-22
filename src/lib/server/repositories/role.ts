// role.ts reads assigned roles and invitation relationships, and persists invitation redemption atomically.

import type { Relation, Role, UserRole } from '#lib/models/role.js';
import { throwError } from '#lib/errors.js';
import { and, desc, eq } from 'drizzle-orm';
import { tInviteCode, tUser, tUserRole, type AppDatabase } from '#lib/server/db/schema.js';
import { wrap } from './utils';

const user = { id: tUser.id, username: tUser.username, name: tUser.name };

/** Returns all assigned role keys, unvalidated and in unspecified order. */
export async function getRolesOfUser(db: AppDatabase, userId: string): Promise<Role[]> {
  return wrap('getRolesOfUser', async () =>
    (await db.select().from(tUserRole).where(eq(tUserRole.userId, userId))).map((row) => row.roleKey as Role),
  );
}

/**
 * Returns who invited the user and when, or null. When several role rows have inviters, which one is returned is
 * unspecified.
 */
export async function findInviterOfUser(db: AppDatabase, userId: string): Promise<Relation | null> {
  return wrap(
    'findInviterOfUser',
    async () =>
      (
        await db
          .select({ user, invitedAt: tUserRole.invitedAt })
          .from(tUserRole)
          .innerJoin(tUser, eq(tUserRole.inviterId, tUser.id))
          .where(eq(tUserRole.userId, userId))
      )[0] ?? null,
  );
}

/**
 * Returns the users this user invited, most recently invited first; a user granted several roles appears once per
 * role.
 */
export async function getInviteesOfUser(db: AppDatabase, userId: string): Promise<Relation[]> {
  return wrap('getInviteesOfUser', () =>
    db
      .select({ user, invitedAt: tUserRole.invitedAt })
      .from(tUserRole)
      .innerJoin(tUser, eq(tUserRole.userId, tUser.id))
      .where(eq(tUserRole.inviterId, userId))
      .orderBy(desc(tUserRole.invitedAt)),
  );
}

/** `usedAt` is the single instant recorded for both code consumption and any newly assigned role. */
export interface CreateRoleOfUserByInviteCodeParams {
  code: string;
  userId: string;
  usedAt: Date;
}

/**
 * Redeems the code in one transaction that locks it: grants the user the code's role from the code's inviter, then
 * marks the code used. A missing or already used code, including one a concurrent redemption consumed first, throws
 * PARAMETER_INVALID on `inviteCode`. When the user already has the role, the existing relationship is kept and
 * returned, and the code is still consumed. A failed role write leaves the code unused.
 */
export async function createRoleOfUserByInviteCode(
  db: AppDatabase,
  params: CreateRoleOfUserByInviteCodeParams,
): Promise<UserRole> {
  return wrap('createRoleOfUserByInviteCode', () =>
    db.transaction(async (tx) => {
      const [code] = await tx.select().from(tInviteCode).where(eq(tInviteCode.code, params.code)).for('update');
      if (!code) return throwError('PARAMETER_INVALID', { inviteCode: '邀请码不存在' });
      if (code.usedAt) return throwError('PARAMETER_INVALID', { inviteCode: '邀请码已被使用' });
      // Different codes can concurrently grant the same role; preserve the winning relationship.
      await tx
        .insert(tUserRole)
        .values({ userId: params.userId, roleKey: code.roleKey, inviterId: code.inviterId, invitedAt: params.usedAt })
        .onConflictDoNothing();
      const [role] = await tx
        .select()
        .from(tUserRole)
        .where(and(eq(tUserRole.userId, params.userId), eq(tUserRole.roleKey, code.roleKey)));
      await tx.update(tInviteCode).set({ usedAt: params.usedAt }).where(eq(tInviteCode.id, code.id));
      return { ...role, roleKey: role.roleKey as Role };
    }),
  );
}
