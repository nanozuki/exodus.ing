import type { Handle } from '@sveltejs/kit';
import { buildAppLocals } from '$lib/server/locals';

export const handle: Handle = async ({ event, resolve }) => {
  const { local, cookie } = await buildAppLocals(event);
  event.locals = local;
  if (cookie) {
    event.cookies.set(cookie.name, cookie.value, {
      path: '.',
      ...cookie.attributes,
    });
  }
  return resolve(event);
};
