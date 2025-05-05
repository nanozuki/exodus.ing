export enum Role {
  ArticleAuthor = 'article_author',
}

export enum Permission {
  CreateArticle = 'create_article',
}

export const rolePermissions: Record<Role, Permission[]> = {
  [Role.ArticleAuthor]: [Permission.CreateArticle],
};

export interface RoleRepository<C> {
  specifyRoleByOther(ctx: C, userId: string, role: Role, otherId: string): Promise<void>;
  getUserRoles(ctx: C, userId: string): Promise<Role[]>;
}

export interface RoleDeps<C> {
  roleRepository: RoleRepository<C>;
}

export function roleService<C>(deps: RoleDeps<C>) {
  const { roleRepository } = deps;

  async function specifyRoleByOther(ctx: C, userId: string, role: Role, otherId: string) {
    return roleRepository.specifyRoleByOther(ctx, userId, role, otherId);
  }

  async function hasPermission(ctx: C, userId: string, permission: Permission) {
    const roles = await roleRepository.getUserRoles(ctx, userId);
    return roles.some((role) => rolePermissions[role].includes(permission));
  }

  return {
    specifyRoleByOther,
    hasPermission,
  };
}
