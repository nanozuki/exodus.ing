import type { Role, RoleRepository } from '$lib/domain/entities/role';
import { and, eq } from 'drizzle-orm';
import { tUserRole, type AppDatabase } from './schema';
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
}
