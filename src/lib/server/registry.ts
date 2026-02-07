import { createAdapterSet, type AdapterSet } from '$lib/server/adapters';
import { createRepositorySet, connectDatabase, type RepositorySet } from '$lib/server/repositories';
import type { RequestEvent } from '@sveltejs/kit';
import { type Permission } from '$lib/domain/entities/role';
import { throwError } from '$lib/errors';
import { userHasPermission, type LoggedInUser } from '$lib/domain/entities/user';
import { getConfig, type Config } from '$lib/server/config';
import { AUTH_COOKIE_NAME, setAuthCookie } from '$lib/domain/entities/session';

export async function buildServices(overlay?: Partial<Config>) {
  const config = getConfig(overlay);
  const db = connectDatabase(config.EXODUSING_DATABASE);
  repositories = createRepositorySet(db);
  adapters = createAdapterSet(config);
}

export let repositories: RepositorySet;
export let adapters: AdapterSet;
export let currentDatabaseUrl: string | undefined;

async function loadSession(event: RequestEvent): Promise<LoggedInUser | null> {
  const sessionId = event.cookies.get(AUTH_COOKIE_NAME);
  if (!sessionId) {
    return null;
  }
  const result = await repositories.session.validateSession(sessionId);
  if (!result) {
    return null;
  }
  if (result.refresh) {
    setAuthCookie(event.cookies, result.session);
  }
  const [user, roles] = await Promise.all([
    repositories.user.findById(result.session.userId),
    repositories.role.getUserRoles(result.session.userId),
  ]);
  return user ? ({ ...user, roles } as LoggedInUser) : null;
}

export async function attachLocals(event: RequestEvent): Promise<void> {
  const loggedInUser = await loadSession(event);

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
