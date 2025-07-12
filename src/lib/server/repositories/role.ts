import type { Relation, Role, RoleRepository } from '$lib/domain/entities/role';
import { and, desc, eq } from 'drizzle-orm';
import { tUser, tUserRole, type AppDatabase } from './schema';
import { wrap } from './utils';

export class PgRoleRepository implements RoleRepository {
  constructor(private readonly db: AppDatabase) {}

  async specifyRoleByOther(userId: string, role: Role, inviterId: string): Promise<void> {
    return wrap('role.specifyRoleByOther', async () => {
      const roles = await this.db
        .select()
        .from(tUserRole)
        .where(and(eq(tUserRole.userId, userId), eq(tUserRole.roleKey, role)));
      if (roles.length !== 0) {
        return;
      }
      await this.db.insert(tUserRole).values({
        userId,
        roleKey: role as string,
        inviterId,
        invitedAt: new Date(),
      });
    });
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    return wrap('role.getUserRoles', async () => {
      const roles = await this.db.select().from(tUserRole).where(eq(tUserRole.userId, userId));
      return roles.map((role) => role.roleKey as Role);
    });
  }

  async getInviter(userId: string): Promise<Relation | undefined> {
    return wrap('role.getInviter', async () => {
      const inviters = await this.db
        .select({
          username: tUser.username,
          name: tUser.name,
          invitedAt: tUserRole.invitedAt,
        })
        .from(tUserRole)
        .innerJoin(tUser, eq(tUserRole.inviterId, tUser.id))
        .where(eq(tUserRole.userId, userId));
      return inviters.length > 0 ? inviters[0] : undefined;
    });
  }

  async getInvitees(userId: string): Promise<Relation[]> {
    return wrap('role.getInvitees', async () => {
      const invitees = await this.db
        .select({
          username: tUser.username,
          name: tUser.name,
          invitedAt: tUserRole.invitedAt,
        })
        .from(tUserRole)
        .innerJoin(tUser, eq(tUserRole.userId, tUser.id))
        .where(eq(tUserRole.inviterId, userId))
        .orderBy(desc(tUserRole.invitedAt));
      return invitees;
    });
  }
}
