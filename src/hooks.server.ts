import { redirect } from '@sveltejs/kit';
import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { building, dev } from '$app/env';
import { attachLocals } from '#lib/server/auth.js';
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

// Canonicalize deployment requests before authentication or route handling.
export const handle: Handle = async ({ event, resolve }) => {
  redirectToCanonicalOrigin(event.request);
  const start = Date.now();
  await attachLocals(event);
  const response = await resolve(event);
  const duration = Date.now() - start;
  console.log(`[REQUEST] ${event.url.pathname} executed in ${duration}ms`);
  return response;
};

export const init: ServerInit = async () => {
  if (!db || !adapters) {
    await buildServices();
  }
};
