import { getRequestEvent, query } from '$app/server';
import { redirect } from '@sveltejs/kit';
import z from 'zod';
import { getConsoleRoutes } from './routes';

export const loadLayoutData = query(z.object({ pathname: z.string() }), async ({ pathname }) => {
  const user = getRequestEvent().locals.requireLoggedInUser('settings');
  const routes = getConsoleRoutes(user);
  if (!routes.some((route) => route.route === pathname)) redirect(302, routes[0].route);
  return { user, routes };
});
