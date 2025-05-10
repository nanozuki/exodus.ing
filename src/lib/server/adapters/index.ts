import type { AdapterSet } from '$lib/domain/services';
import type { RequestEvent } from '@sveltejs/kit';
import type { AppDatabase } from '$lib/server/repositories/schema';
import { LuciaAuthService } from './lucia';
import { nameResolver } from './name_resolver';
import { once } from '$lib/once';

export function createAdapterSet(event: RequestEvent, db: AppDatabase): AdapterSet {
  return {
    auth: once(() => new LuciaAuthService(event, db)),
    nameResolver: once(() => nameResolver),
  };
}
