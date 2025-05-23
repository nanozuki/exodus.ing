import { type Role, type RoleRepository } from '$lib/domain/entities/role';

export class RoleService {
  constructor(private roleRepo: RoleRepository) {}

  async specifyRoleByOther(userId: string, role: Role, otherId: string) {
    return this.roleRepo.specifyRoleByOther(userId, role, otherId);
  }

  async getUserRoles(userId: string) {
    return this.roleRepo.getUserRoles(userId);
  }
}
