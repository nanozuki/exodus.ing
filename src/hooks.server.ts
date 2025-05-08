import { buildServices } from '$lib/domain/services';
import { createAdapterSet } from '$lib/server/adapters';
import { getD1Database } from '$lib/server/data_source';
import { createRepositorySet } from '$lib/server/repositories';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const db = await getD1Database(event);

  const repositories = createRepositorySet(db);
  const adapters = createAdapterSet(event, db);
  const locals = buildServices(repositories, adapters);
  await locals.auth().loadSession();

  event.locals = locals;
  return resolve(event);
};
