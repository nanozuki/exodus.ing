import type { PageServerLoad } from './$types';
import { compileMarkdown } from '$lib/markdown';
import { services } from '$lib/server/registry';
import { hasPermission, Permission } from '$lib/domain/entities/role';
import type { ArticleListItem } from '$lib/domain/entities/article';
import type { Paginated } from '$lib/domain/values/page';
import type { CommentListItem } from '$lib/domain/entities/comment';
import type { User } from '$lib/domain/entities/user';
import { AppError } from '$lib/errors';

type Tab = 'articles' | 'comments';
function parseTab(isWriter: boolean, tab: string | null): Tab {
  if (isWriter) {
    return tab === 'comments' ? 'comments' : 'articles';
  }
  return 'comments';
}
type ListData = {
  tabs: Tab[];
} & (
  | { tab: 'articles'; articles: Paginated<ArticleListItem> }
  | { tab: 'comments'; comments: Paginated<CommentListItem> }
);

async function getUser(param: string): Promise<User> {
  const user = param.startsWith('@')
    ? await services.user.findUserByUsername(param.slice(1))
    : await services.user.findUserById(param);
  return user ? user : AppError.UserNotFound(param).throw();
}

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const username = params.username;
  const user = await getUser(username);
  const roles = await services.role.getUserRoles(user.id);
  const isWriter = hasPermission(roles, Permission.CreateArticle);

  const page: number = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1;
  const tab: Tab = parseTab(isWriter, url.searchParams.get('tab'));
  const tabs = isWriter ? ['articles', 'comments'] : ['comments'];
  const isMyself = locals.loggedInUser && user.id === locals.loggedInUser.id;

  if (tab === 'articles') {
    const [aboutMe, articles] = await Promise.all([
      compileMarkdown(user.aboutMe),
      services.articleList.listByUserId(user.id, page),
    ]);
    return {
      user: {
        ...user,
        aboutMe,
      },
      listData: { tabs, tab: 'articles', articles } as ListData,
      isMyself,
      isWriter,
    };
  } else {
    const [aboutMe, comments] = await Promise.all([
      compileMarkdown(user.aboutMe),
      services.comment.listByUser(user.id, page),
    ]);
    return {
      user: {
        ...user,
        aboutMe,
      },
      listData: { tabs, tab: 'comments', comments } as ListData,
      isMyself,
      isWriter,
    };
  }
};
