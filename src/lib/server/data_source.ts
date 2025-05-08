import { dev } from '$app/environment';
import { AppError } from '$lib/errors';
import { schema, type AppD1Database } from '$lib/server/repositories/schema';
import type { RequestEvent } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';

async function getPlatform(event: RequestEvent): Promise<App.Platform> {
  if (dev) {
    const { getPlatformProxy } = await import('wrangler');
    const platform: unknown = await getPlatformProxy();
    return platform as App.Platform;
  }
  if (!event.platform) {
    return AppError.InternalServerError('Platform not found').throw();
  }
  return event.platform;
}

export async function getD1Database(event: RequestEvent): Promise<AppD1Database> {
  const platform = await getPlatform(event);
  const db = drizzle(platform.env.EXODUSING_DB, { schema, logger: true });
  return db;
}
