import { buildServices } from '$lib/domain/services';
import { createAdapterSet } from '$lib/server/adapters';
import { getD1Database } from '$lib/server/data_source';
import { createRepositorySet } from '$lib/server/repositories';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const start = Date.now();
  const db = await getD1Database(event);

  const repositories = createRepositorySet(db);
  const adapters = createAdapterSet(event, db);
  const locals = buildServices(repositories, adapters);
  await locals.auth().loadSession();

  event.locals = locals;
  const response = resolve(event);
  const duration = Date.now() - start;
  console.log(`[REQUEST] ${event.url.pathname} executed in ${duration}ms`);
  return response;
};
