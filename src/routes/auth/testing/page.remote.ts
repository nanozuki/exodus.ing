import { form, getRequestEvent, query } from '$app/server';
import { setAuthCookie } from '#lib/server/auth.js';
import { createSession } from '#lib/server/use-cases/session.js';
import { now } from '#lib/server/adapters/clock.js';
import { generateSessionId } from '#lib/server/adapters/session_id.js';
import { getUsers, findUserById } from '#lib/server/repositories/user.js';
import { getRolesOfUser } from '#lib/server/repositories/role.js';
import { throwError } from '#lib/errors.js';
import { db } from '#lib/server/registry.js';
import { redirect } from '@sveltejs/kit';
import z from 'zod';

function ensureNotProd(): void {
  if (import.meta.env.MODE !== 'test' && import.meta.env.PROD) {
    throwError('FORBIDDEN', { operation: '模拟登录' });
  }
}

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

export const simulateTestingLogin = form(simulateTestingLoginSchema, async ({ userId, next }) => {
  ensureNotProd();
  const user = await findUserById(db, userId);
  if (!user) {
    throwError('NOT_FOUND', { resource: '用户' });
  }
  const session = await createSession({ db, now, generateSessionId }, { userId: user.id });
  const { cookies } = getRequestEvent();
  setAuthCookie(cookies, session);

  redirect(303, next && next.startsWith('/') ? next : '/');
});
