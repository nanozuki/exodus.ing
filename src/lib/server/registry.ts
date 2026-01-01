import { createServiceSet, type ServiceSet } from '$lib/server/services';
import { createAdapterSet, type AdapterSet } from '$lib/server/adapters';
import { createRepositorySet, getDatabase, type RepositorySet } from '$lib/server/repositories';
import type { RequestEvent } from '@sveltejs/kit';
import { type Permission } from '$lib/domain/entities/role';
import { throwError } from '$lib/errors';
import { userHasPermission, type LoggedInUser } from '$lib/domain/entities/user';
import { getConfig } from './config';

export async function buildServices(): Promise<void> {
  const config = getConfig();
  const db = await getDatabase(config);
  repositories = createRepositorySet(db);
  adapters = createAdapterSet(config);
  services = createServiceSet();
}

export let services: ServiceSet;
export let repositories: RepositorySet;
export let adapters: AdapterSet;

export async function attachLocals(event: RequestEvent): Promise<void> {
  const loggedInUser = await services.auth.loadSession(event.cookies);

  function requireLoggedInUser(operation: string): LoggedInUser {
    if (!loggedInUser) {
      return throwError('UNAUTHORIZED', { operation });
    }
    return loggedInUser;
  }

  function hasPermission(p: Permission): boolean {
    return userHasPermission(loggedInUser, p);
  }

  function requirePermission(p: Permission, operation: string): LoggedInUser {
    const user = requireLoggedInUser(operation);
    if (hasPermission(p)) {
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
