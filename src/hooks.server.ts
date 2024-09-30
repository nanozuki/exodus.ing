import { buildAppLocals } from '$lib/server/locals';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals = await buildAppLocals(event);
  return resolve(event);
};
