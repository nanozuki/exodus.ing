import { Permission } from '$lib/domain/entities/role';
import { services } from '$lib/server/registry';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, params }) => {
  const user = await locals.requirePermission(Permission.CreateArticle, 'get user domains');
  const domain = await services.userDomain.getUserDomain(user.id, params.domain!);
  return json(domain);
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  const user = await locals.requirePermission(Permission.CreateArticle, 'delete user domains');
  const domain = await services.userDomain.getUserDomain(user.id, params.domain!);
  await services.userDomain.deleteUserDomain(user.id, domain.domain);
  return json({});
};
