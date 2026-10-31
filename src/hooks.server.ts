import { attachLocals } from '$lib/server/auth';
import { getConfig } from '$lib/server/config';
import { buildServices, adapters, db } from '$lib/server/registry';
import { redirect, type Handle, type ServerInit } from '@sveltejs/kit';

function ensureHost(request: Request) {
  const host = getConfig().appUrl;
  if (!request.url.startsWith(host)) {
    throw redirect(303, host);
  }
}

export const handle: Handle = async ({ event, resolve }) => {
  // Temporary proxy diagnostics before redirects; omit query strings containing OAuth credentials.
  const url = new URL(event.request.url);
  console.log(
    '[REQUEST_ORIGIN]',
    JSON.stringify({
      url: `${url.origin}${url.pathname}`,
      host: event.request.headers.get('host'),
      'x-forwarded-proto': event.request.headers.get('x-forwarded-proto'),
      'x-forwarded-host': event.request.headers.get('x-forwarded-host'),
      'fly-forwarded-port': event.request.headers.get('fly-forwarded-port'),
    }),
  );

  ensureHost(event.request);
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
