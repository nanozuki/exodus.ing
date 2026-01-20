import { form, getRequestEvent, query } from '$app/server';
import { setAuthCookie } from '$lib/domain/entities/session';
import { throwError } from '$lib/errors';
import { repositories } from '$lib/server/registry';
import { redirect } from '@sveltejs/kit';
import z from 'zod';

function ensureNotProd(): void {
  if (import.meta.env.MODE !== 'test' && import.meta.env.PROD) {
    throwError('FORBIDDEN', { operation: '模拟登录' });
  }
}

export const listTestingUsers = query(async () => {
  ensureNotProd();
  const users = await repositories.user.listAll();
  const rolesList = await Promise.all(users.map((user) => repositories.role.getUserRoles(user.id)));
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
  const user = await repositories.user.findById(userId);
  if (!user) {
    throwError('NOT_FOUND', { resource: '用户' });
  }
  const session = await repositories.session.create(user.id);
  const { cookies } = getRequestEvent();
  setAuthCookie(cookies, session);

  redirect(303, next && next.startsWith('/') ? next : '/');
});
