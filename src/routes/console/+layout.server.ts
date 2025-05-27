import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getConsoleRoutes } from './routes';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const user = locals.requireLoggedInUser('settings');
  const routes = await getConsoleRoutes(locals);
  const currentRoute = url.pathname;
  // if the current route is not in the console routes, redirect to the first one
  if (!routes.some((route) => route.route === currentRoute)) {
    redirect(302, routes[0].route);
  }
  return { user, routes };
};
