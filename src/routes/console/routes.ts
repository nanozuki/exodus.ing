import { Permission } from '$lib/domain/entities/role';

export type ConsoleRoute = { route: string; title: string };
export const consoleRoutes = {
  profile: { route: '/console/profile', title: '个人资料' },
  bookmarks: { route: '/console/bookmarks', title: '收藏' },
  account: { route: '/console/account', title: '账户' },
  invites: { route: '/console/invites', title: '邀请' },
  beWriter: { route: '/console/be-writer', title: '成为作者' },
};

export async function getConsoleRoutes(locals: App.Locals): Promise<ConsoleRoute[]> {
  const routes = [consoleRoutes.profile, consoleRoutes.bookmarks, consoleRoutes.account];
  const isWriter = await locals.hasPermission(Permission.CreateArticle);
  if (!isWriter) {
    routes.push(consoleRoutes.beWriter);
  } else {
    routes.push(consoleRoutes.invites);
  }
  return routes;
}
