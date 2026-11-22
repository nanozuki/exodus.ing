import { createAdapterSet, type AdapterSet } from '#lib/server/adapters/index.js';
import { getDatabase } from '#lib/server/db/index.js';
import type { AppDatabase } from '#lib/server/db/schema.js';
import { getConfig } from './config';

/**
 * Reads configuration, constructs the database and adapter set, and assigns `db` and `adapters`. Await it before using
 * either binding. Calling it again replaces both without closing the previous pool.
 */
export async function buildServices(): Promise<void> {
  const config = getConfig();
  db = await getDatabase(config);
  adapters = createAdapterSet(config);
}

/** Set by `buildServices`. Request entry points pass it explicitly to repository operations and use cases. */
export let db: AppDatabase;

/** Set by `buildServices`; undefined until startup succeeds. */
export let adapters: AdapterSet;
