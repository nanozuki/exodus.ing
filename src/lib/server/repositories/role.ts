import type { Relation, Role, UserRole } from '$lib/models/role';
import { throwError } from '$lib/errors';
import { and, desc, eq } from 'drizzle-orm';
import { tInviteCode, tUser, tUserRole, type AppDatabase } from '$lib/server/db/schema';
import { wrap } from './utils';

const user = { id: tUser.id, username: tUser.username, name: tUser.name };

export async function getRolesOfUser(db: AppDatabase, userId: string): Promise<Role[]> {
  return wrap('getRolesOfUser', async () =>
    (await db.select().from(tUserRole).where(eq(tUserRole.userId, userId))).map((row) => row.roleKey as Role),
  );
}

// When several role rows have inviters, no selection order is guaranteed.
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

// A user assigned several roles can appear more than once.
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

export interface CreateRoleOfUserByInviteCodeParams {
  code: string;
  userId: string;
  usedAt: Date;
}

// Codes are consumed even when the user already has the role; the original relationship is retained.
export async function createRoleOfUserByInviteCode(
  db: AppDatabase,
  params: CreateRoleOfUserByInviteCodeParams,
): Promise<UserRole> {
  return wrap('createRoleOfUserByInviteCode', () =>
    db.transaction(async (tx) => {
      const [code] = await tx.select().from(tInviteCode).where(eq(tInviteCode.code, params.code)).for('update');
      if (!code) return throwError('BAD_REQUEST', '邀请码不存在');
      if (code.usedAt) return throwError('BAD_REQUEST', '邀请码已被使用');
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
