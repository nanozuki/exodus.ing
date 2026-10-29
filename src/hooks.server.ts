import { redirect } from '@sveltejs/kit';
import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { attachLocals } from '#lib/server/auth.js';
import { getConfig } from '#lib/server/config.js';
import { buildServices, adapters, db } from '#lib/server/registry.js';

function ensureHost(request: Request) {
  const host = getConfig().appUrl;
  if (!request.url.startsWith(host)) {
    throw redirect(303, host);
  }
}

export const handle: Handle = async ({ event, resolve }) => {
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
