import type { Role, RoleRepository, UserRelations } from '$lib/domain/entities/role';
import { and, desc, eq, or } from 'drizzle-orm';
import { tUser, tUserRole, type AppDatabase } from './schema';
import { wrap } from './utils';

export class SqliteRoleRepository implements RoleRepository {
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

  async getRelations(userId: string): Promise<UserRelations> {
    return wrap('role.getRelations', async () => {
      const relations = await this.db
        .select({
          userId: tUserRole.userId,
          username: tUser.username,
          name: tUser.name,
          invitedAt: tUserRole.invitedAt,
        })
        .from(tUserRole)
        .innerJoin(tUser, eq(tUserRole.userId, tUser.id))
        .where(or(eq(tUserRole.userId, userId), eq(tUserRole.inviterId, userId)))
        .orderBy(desc(tUserRole.invitedAt));
      const result: UserRelations = {
        inviter: undefined,
        invitees: [],
      };
      for (const relation of relations) {
        if (relation.userId === userId) {
          result.inviter = relation;
        } else {
          result.invitees.push(relation);
        }
      }
      return result;
    });
  }
}
