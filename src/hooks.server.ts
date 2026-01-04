import { getConfig } from '$lib/server/config';
import { buildServices, attachLocals, adapters, repositories } from '$lib/server/registry';
import { redirect, type Handle, type ServerInit } from '@sveltejs/kit';

function ensureHost(request: Request) {
  const host = getConfig().EXODUSING_HOST;
  if (!request.url.startsWith(host)) {
    throw redirect(303, host);
  }
}

export const handle: Handle = async ({ event, resolve }) => {
  ensureHost(event.request);
  const start = Date.now();
  await attachLocals(event);
  const response = resolve(event);
  const duration = Date.now() - start;
  console.log(`[REQUEST] ${event.url.pathname} executed in ${duration}ms`);
  return response;
};

export const init: ServerInit = async () => {
  if (!repositories || !adapters) {
    await buildServices();
  }
};
