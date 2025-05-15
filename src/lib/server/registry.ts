import { createServiceSet, type ServiceSet } from '$lib/domain/services';
import { createAdapterSet } from '$lib/server/adapters';
import { createRepositorySet, getDatabase } from '$lib/server/repositories';

async function createServices(): Promise<ServiceSet> {
  const db = await getDatabase();
  const repositories = await createRepositorySet(db);
  const adapters = createAdapterSet(db);
  const services = createServiceSet(repositories, adapters);
  return services;
}

export const services = await createServices();
