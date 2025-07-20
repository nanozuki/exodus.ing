import { createServiceSet, type ServiceSet } from '$lib/domain/services';
import { createAdapterSet } from '$lib/server/adapters';
import { createRepositorySet, getDatabase } from '$lib/server/repositories';
import type { RequestEvent } from '@sveltejs/kit';
import { hasPermission as rolesHasPermission, Role, type Permission } from '$lib/domain/entities/role';
import { throwError } from '$lib/errors';
import type { User } from '$lib/domain/entities/user';
import { getConfig } from './config';

export async function buildServices(): Promise<void> {
  const config = getConfig();
  const db = await getDatabase(config);
  const repositories = await createRepositorySet(db);
  const adapters = createAdapterSet(db, config);
  services = createServiceSet(repositories, adapters);
}

export let services: ServiceSet;

export async function attachLocals(event: RequestEvent): Promise<void> {
  const loggedInUser = await services.auth.loadSession(event.cookies);
  let roles: Role[] | null = null;

  function requireLoggedInUser(operation: string): User {
    if (!loggedInUser) {
      return throwError('UNAUTHORIZED', { operation });
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
  async function requirePermission(p: Permission, operation: string): Promise<User> {
    const user = requireLoggedInUser(operation);
    if (await hasPermission(p)) {
      return user;
    }
    return throwError('FORBIDDEN', { operation });
  }

  event.locals = {
    loggedInUser,
    requireLoggedInUser,
    hasPermission,
    requirePermission,
  };
}
