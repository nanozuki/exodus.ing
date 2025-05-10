import { rolePermissions, type Permission, type Role, type RoleRepository } from '$lib/domain/entities/role';

export type RoleService = ReturnType<typeof roleService>;
export function roleService(roleRepository: RoleRepository) {
  async function specifyRoleByOther(userId: string, role: Role, otherId: string) {
    return roleRepository.specifyRoleByOther(userId, role, otherId);
  }

  async function hasPermission(userId: string, permission: Permission) {
    const roles = await roleRepository.getUserRoles(userId);
    return roles.some((role) => rolePermissions[role].includes(permission));
  }

  return {
    specifyRoleByOther,
    hasPermission,
  };
}
