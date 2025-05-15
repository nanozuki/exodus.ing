import { AppError } from '$lib/errors';
import { services } from '$lib/server/registry';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const start = Date.now();
  const loggedInUser = await services.auth.loadSession(event.cookies);
  event.locals = {
    loggedInUser,
    requireLoggedInUser: (context: string) => {
      if (!loggedInUser) {
        return AppError.Unauthorized(context).throw();
      }
      return loggedInUser;
    },
  };
  const response = resolve(event);
  const duration = Date.now() - start;
  console.log(`[REQUEST] ${event.url.pathname} executed in ${duration}ms`);
  return response;
};
