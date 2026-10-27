import { createAdapterSet, type AdapterSet } from '$lib/server/adapters';
import { getDatabase } from '$lib/server/db';
import type { AppDatabase } from '$lib/server/db/schema';
import { getConfig } from './config';

// Await startup before using the exported bindings. Rebuilding replaces them without closing the old pool.
export async function buildServices(): Promise<void> {
  const config = getConfig();
  db = await getDatabase(config);
  adapters = createAdapterSet(config);
}

export let db: AppDatabase;

export let adapters: AdapterSet;
