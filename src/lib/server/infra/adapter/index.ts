import type { Adapters } from '$lib/domain/services';
import { createLazyProxy } from '$lib/lazy';
import type { RequestEvent } from '@sveltejs/kit';
import type { AppD1Database } from '../repository/schema';
import { LuciaAuthService } from './lucia';
import { nameResolver } from './name_resolver';

export function buildAdapters(event: RequestEvent, db: AppD1Database) {
  return createLazyProxy<Adapters>({
    auth: () => new LuciaAuthService(event, db),
    nameResolver: () => nameResolver,
  });
}
