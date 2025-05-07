import { buildServices } from '$lib/domain/services';
import { getD1Database } from '$lib/server/data_source';
import { buildAdapters } from '$lib/server/adapters';
import { buildRepositories } from '$lib/server/repositories';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const db = await getD1Database(event);
  const repositories = buildRepositories(db);
  const adapters = buildAdapters(event, db);
  const locals = buildServices(repositories, adapters);

  await locals.auth.loadSession();

  event.locals = locals;
  return resolve(event);
};
