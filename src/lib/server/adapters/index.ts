import type { AdapterSet } from '$lib/domain/services';
import type { AppDatabase } from '$lib/server/repositories/schema';
import { LuciaAuthService } from './lucia';
import { nameResolver } from './name_resolver';

export function createAdapterSet(db: AppDatabase): AdapterSet {
  return {
    auth: new LuciaAuthService(db),
    nameResolver: nameResolver,
  };
}
