import { createServiceSet, type ServiceSet } from '$lib/domain/services';
import { createAdapterSet } from '$lib/server/adapters';
import { createRepositorySet, getDatabase } from '$lib/server/repositories';
import type { RequestEvent } from '@sveltejs/kit';
import { hasPermission as rolesHasPermission, Role, type Permission } from '$lib/domain/entities/role';
import { AppError } from '$lib/errors';
import type { User } from '$lib/domain/entities/user';

export async function buildServices(): Promise<void> {
  const db = await getDatabase();
  const repositories = await createRepositorySet(db);
  const adapters = createAdapterSet(db);
  services = createServiceSet(repositories, adapters);
}

export let services: ServiceSet;

export async function attachLocals(event: RequestEvent): Promise<void> {
  const loggedInUser = await services.auth.loadSession(event.cookies);
  let roles: Role[] | null = null;

  function requireLoggedInUser(context: string): User {
    if (!loggedInUser) {
      return AppError.Unauthorized(context).throw();
    }
    return loggedInUser;
  }
  async function hasPermission(p: Permission): Promise<boolean> {
    if (!loggedInUser) {
      return false;
    }
    if (!roles) {
      roles = await services.role.getUserRoles(loggedInUser.id);
    }
    return rolesHasPermission(roles, p);
  }
  async function requirePermission(p: Permission, context: string): Promise<User> {
    const user = requireLoggedInUser(context);
    if (await hasPermission(p)) {
      return user;
    }
    return AppError.Forbidden(`Require Permission when ${context}`).throw();
  }

  event.locals = {
    loggedInUser,
    requireLoggedInUser,
    hasPermission,
    requirePermission,
  };
}
