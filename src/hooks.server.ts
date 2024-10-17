import { buildServices } from '$lib/domain/services';
import { getD1Database } from '$lib/server/data_source';
import { buildAdapters } from '$lib/server/infra/adapter';
import { buildRepositories } from '$lib/server/infra/repository';
import { buildPages } from '$lib/server/interfaces/pages';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const db = await getD1Database(event);
  const repositories = buildRepositories(db);
  const adapters = buildAdapters(event, db);
  const services = buildServices(repositories, adapters);
  const locals = buildPages(services);

  await locals.rootLayout.loadSession();

  event.locals = locals;
  return resolve(event);
};
