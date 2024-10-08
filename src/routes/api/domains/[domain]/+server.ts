import { AppError } from '$lib/errors';
import { deleteUserDomain, getUserDomain } from '$lib/server/user_domain';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, params }) => {
  if (!locals.user) {
    return AppError.Unauthorized('User settings').throw();
  }
  const domain = await getUserDomain(locals, locals.user.id, params.domain!);
  if (!domain) {
    return AppError.UserDomainNotFound(params.domain!).throw();
  }
  return json(domain);
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!locals.user) {
    return AppError.Unauthorized('User settings').throw();
  }
  const domain = await getUserDomain(locals, locals.user.id, params.domain!);
  if (!domain) {
    return AppError.UserDomainNotFound(params.domain!).throw();
  }
  await deleteUserDomain(locals, locals.user.id, params.domain!);
  return json({});
};
