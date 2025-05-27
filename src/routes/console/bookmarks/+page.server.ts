import type { PageServerLoad } from './$types';
import type { ArticleListItem } from '$lib/domain/entities/article';
import type { Paginated } from '$lib/domain/values/page';
import { services } from '$lib/server/registry';

export const load: PageServerLoad = async ({ locals, url }) => {
  const loggedInUser = locals.requireLoggedInUser('console bookmarks');
  const page: number = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1;
  const bookmarks: Paginated<ArticleListItem> = await services.articleList.listUserBookmarked(loggedInUser.id, page);
  return {
    bookmarks,
  };
};
