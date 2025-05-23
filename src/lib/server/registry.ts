import { createServiceSet, type ServiceSet } from '$lib/domain/services';
import { createAdapterSet } from '$lib/server/adapters';
import { createRepositorySet, getDatabase } from '$lib/server/repositories';
import type { RequestEvent } from '@sveltejs/kit';
import { hasPermission, Role, type Permission } from '$lib/domain/entities/role';
import { AppError } from '$lib/errors';

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
  event.locals = {
    loggedInUser,
    requireLoggedInUser: (context: string) => {
      if (!loggedInUser) {
        return AppError.Unauthorized(context).throw();
      }
      return loggedInUser;
    },
    hasPermission: async (p: Permission) => {
      if (!loggedInUser) {
        return false;
      }
      if (!roles) {
        roles = await services.role.getUserRoles(loggedInUser.id);
      }
      return hasPermission(roles, p);
    },
  };
}
