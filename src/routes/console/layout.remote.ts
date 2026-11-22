import { getRequestEvent, query } from '$app/server';
import { redirect } from '@sveltejs/kit';
import z from 'zod';
import { getConsoleRoutes } from './routes';

/**
 * Requires login and returns the viewer with the console pages their roles allow. When `pathname` is not exactly one
 * of those pages, redirects 302 to the first one. `pathname` only selects navigation, never grants access, and is part
 * of the query identity, so moving between console pages runs it again. Child pages call it with the same pathname to
 * share the layout's result.
 */
export const loadLayoutData = query(z.object({ pathname: z.string() }), async ({ pathname }) => {
  const user = getRequestEvent().locals.requireLoggedInUser('settings');
  const routes = getConsoleRoutes(user);
  if (!routes.some((route) => route.route === pathname)) redirect(302, routes[0].route);
  return { user, routes };
});
