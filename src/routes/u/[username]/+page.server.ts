import type { PageServerLoad } from './$types';
import { compileMarkdown } from '$lib/markdown';
import { services } from '$lib/server/registry';

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const username = params.username;
  const page: number = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1;
  const loggedInUser = locals.loggedInUser;

  const user = await services.user.getUserByKey(username);
  const [aboutMe, articles] = await Promise.all([
    compileMarkdown(user.aboutMe),
    services.articleList.listByUserId(user.id, page),
  ]);
  return {
    user: {
      ...user,
      aboutMe,
    },
    articles,
    isMyself: loggedInUser ? user.id === loggedInUser.id : false,
  };
};
