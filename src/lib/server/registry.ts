import { createServiceSet, type ServiceSet } from '$lib/domain/services';
import { createAdapterSet } from '$lib/server/adapters';
import { createRepositorySet, getDatabase } from '$lib/server/repositories';

export async function buildServices(): Promise<void> {
  const db = await getDatabase();
  const repositories = await createRepositorySet(db);
  const adapters = createAdapterSet(db);
  services = createServiceSet(repositories, adapters);
}

export let services: ServiceSet;
