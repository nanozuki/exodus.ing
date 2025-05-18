export const consoleRoutes = {
  profile: { route: '/console/profile', title: '个人资料', index: 0 },
  bookmarks: { route: '/console/bookmarks', title: '收藏', index: 1 },
  account: { route: '/console/account', title: '账户', index: 2 },
  invites: { route: '/console/invites', title: '邀请', index: 3 },
  domains: { route: '/console/domains', title: '域名', index: 4 },
};
export const consoleAllRoutes = Object.values(consoleRoutes).sort((a, b) => a.index - b.index);
export const consoleDefaultRoute = consoleAllRoutes[0];
