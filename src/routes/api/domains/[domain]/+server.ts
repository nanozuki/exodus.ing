import { error, json } from '@sveltejs/kit';
import { Unauthorized, UserDomainNotFound } from '$lib/errors';
import type { RequestHandler } from '@sveltejs/kit';
import { deleteUserDomain, getUserDomain } from '$lib/server/user_domain';

export const GET: RequestHandler = async ({ locals, params }) => {
  if (!locals.user) {
    error(401, Unauthorized('User settings'));
  }
  const domain = await getUserDomain(locals, locals.user.id, params.domain!);
  if (!domain) {
    error(404, UserDomainNotFound(params.domain!));
  }
  return json(domain);
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!locals.user) {
    error(401, Unauthorized('User settings'));
  }
  const domain = await getUserDomain(locals, locals.user.id, params.domain!);
  if (!domain) {
    error(404, UserDomainNotFound(params.domain!));
  }
  await deleteUserDomain(locals, locals.user.id, params.domain!);
  return json({});
};
