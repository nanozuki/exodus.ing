import { redirect } from '@sveltejs/kit';
import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { building, dev } from '$app/env';
import { attachLocals } from '#lib/server/transport/auth.js';
import { getConfig } from '#lib/server/config.js';
import { buildServices, adapters, db } from '#lib/server/registry.js';

function redirectToCanonicalOrigin(request: Request) {
  if (dev || building) return;

  const url = new URL(request.url);
  const canonicalUrl = new URL(getConfig().appUrl);
  if (url.origin === canonicalUrl.origin) return;

  url.protocol = canonicalUrl.protocol;
  url.host = canonicalUrl.host;
  url.port = canonicalUrl.port;
  redirect(308, url, { external: [canonicalUrl.origin] });
}

/**
 * Redirects deployed page requests from any other origin to `APP_URL`'s origin with a 308, keeping path and query,
 * then attaches authentication locals before route handling. Canonicalization is skipped in development and while
 * building, and static assets never reach this hook. The exact path `/healthcheck` bypasses both canonicalization and
 * authentication so internal probes reach its route.
 */
export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname === '/healthcheck') return resolve(event);

  redirectToCanonicalOrigin(event.request);
  const start = Date.now();
  await attachLocals(event);
  const response = await resolve(event);
  const duration = Date.now() - start;
  console.log(`[REQUEST] ${event.url.pathname} executed in ${duration}ms`);
  return response;
};

/** Builds the shared services in the registry at server startup. */
export const init: ServerInit = async () => {
  if (!db || !adapters) {
    await buildServices();
  }
};
