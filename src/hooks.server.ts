import { buildServices, attachLocals, services } from '$lib/server/registry';
import type { Handle, ServerInit } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const start = Date.now();
  await attachLocals(event);
  const response = resolve(event);
  const duration = Date.now() - start;
  console.log(`[REQUEST] ${event.url.pathname} executed in ${duration}ms`);
  return response;
};

export const init: ServerInit = async () => {
  if (!services) {
    await buildServices();
  }
};
