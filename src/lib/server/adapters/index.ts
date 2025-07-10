import type { AdapterSet } from '$lib/domain/services';
import type { AppDatabase } from '$lib/server/repositories/schema';
import { LuciaAuthService } from './lucia';
import { nameResolver } from './name_resolver';
import type { Config } from '$lib/server/config';

export function createAdapterSet(db: AppDatabase, config: Config): AdapterSet {
  return {
    auth: new LuciaAuthService(db, config),
    nameResolver: nameResolver,
  };
}
