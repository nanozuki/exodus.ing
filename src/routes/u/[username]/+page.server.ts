import type { PageServerLoad } from './$types';
import type { ArticleListItem } from '$lib/domain/entities/article';
import type { Paginated } from '$lib/domain/values/page';
import { compileMarkdown } from '$lib/markdown';
import { services } from '$lib/server/registry';

type PageTab = 'articles' | 'bookmarks';

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const username = params.username;
  const tab: PageTab = url.searchParams.get('tab') === 'bookmarks' ? 'bookmarks' : 'articles';
  const page: number = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1;
  const loggedInUser = locals.loggedInUser;
  const user = await services.user.getUserByKey(username);
  const aboutMe = await compileMarkdown(user.aboutMe);
  const articles = await services.articleList.listByUserId(user.id, page);
  const bookmarks: Paginated<ArticleListItem> =
    loggedInUser && loggedInUser.id === user.id
      ? await services.articleList.listUserBookmarked(user.id, page)
      : { items: [], count: 0, pageNumber: 0 };
  return {
    user: {
      ...user,
      aboutMe,
    },
    articles,
    bookmarks,
    isMyself: loggedInUser ? user.id === loggedInUser.id : false,
    tab,
  };
};
