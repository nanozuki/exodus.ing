import { form, getRequestEvent, query } from '$app/server';
import { sanitizeNext, setSessionCookie } from '#lib/server/transport/auth.js';
import { createSession } from '#lib/server/use-cases/session.js';
import { now } from '#lib/server/adapters/clock.js';
import { random } from '#lib/server/adapters/random.js';
import { getUsers, findUserById } from '#lib/server/repositories/user.js';
import { getRolesOfUser } from '#lib/server/repositories/role.js';
import { throwError } from '#lib/errors.js';
import { getConfig } from '#lib/server/config.js';
import { db } from '#lib/server/registry.js';
import { redirect } from '@sveltejs/kit';
import z from 'zod';

function ensureNotProd(): void {
  if (import.meta.env.MODE !== 'test' && import.meta.env.PROD) {
    throwError('FORBIDDEN', { operation: '模拟登录' });
  }
}

/** Lists every stored user with their roles. */
export const loadPageData = query(async () => {
  ensureNotProd();
  const users = await getUsers(db);
  const rolesList = await Promise.all(users.map((user) => getRolesOfUser(db, user.id)));
  const usersWithRoles = users.map((user, index) => ({
    id: user.id,
    username: user.username,
    name: user.name,
    roles: rolesList[index],
  }));
  return { users: usersWithRoles };
});

const simulateTestingLoginSchema = z.object({
  userId: z.string().min(1),
  next: z.string().optional(),
});

/**
 * Signs in as `userId` without GitHub: creates a session, sets its cookie, and redirects 303 to the sanitized `next`.
 * An unknown user throws NOT_FOUND.
 */
export const simulateTestingLogin = form(simulateTestingLoginSchema, async ({ userId, next }) => {
  ensureNotProd();
  const user = await findUserById(db, userId);
  if (!user) {
    throwError('NOT_FOUND', { resource: '用户' });
  }
  const { session, token } = await createSession({ db, now, random }, { userId: user.id });
  const { cookies } = getRequestEvent();
  setSessionCookie(cookies, 'auth', { token, expiresAt: session.expiresAt });

  // SvelteKit treats an absolute URL as external unless it matches the request origin, so allow the app's own origin.
  const { appUrl } = getConfig();
  redirect(303, sanitizeNext(next, appUrl), { external: [appUrl] });
});
