import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, params }) => {
  const user = locals.auth().requireLoggedInUser('get user domains');
  const domain = await locals.userDomain().getUserDomain(user.id, params.domain!);
  return json(domain);
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  const user = locals.auth().requireLoggedInUser('get user domains');
  const domain = await locals.userDomain().getUserDomain(user.id, params.domain!);
  await locals.userDomain().deleteUserDomain(user.id, domain.domain);
  return json({});
};
