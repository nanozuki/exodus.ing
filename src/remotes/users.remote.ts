import { getRequestEvent, query } from '$app/server';
import { ARTICLE_PAGE_SIZE } from '$lib/domain/entities/article';
import { COMMENT_PAGE_SIZE } from '$lib/domain/entities/comment';
import { Permission, hasPermission } from '$lib/domain/entities/role';
import type { User } from '$lib/domain/entities/user';
import { throwError } from '$lib/errors';
import { compileMarkdown } from '$lib/markdown';
import { repositories } from '$lib/server/registry';
import z from 'zod';

type Tab = 'articles' | 'comments';

type ListData = {
  tabs: Tab[];
} & (
  | { tab: 'articles'; articles: Awaited<ReturnType<typeof repositories.article.listByUserId>> }
  | { tab: 'comments'; comments: Awaited<ReturnType<typeof repositories.comment.listByUser>> }
);

function parseTab(isWriter: boolean, tab: string | undefined): Tab {
  if (isWriter) {
    return tab === 'comments' ? 'comments' : 'articles';
  }
  return 'comments';
}

async function getUser(param: string): Promise<User> {
  const user = param.startsWith('@')
    ? await repositories.user.findByUsername(param.slice(1))
    : await repositories.user.findById(param);
  return user ? user : throwError('NOT_FOUND', { resource: '用户' });
}

export const getUserPageData = query(
  z.object({
    username: z.string(),
    tab: z.string().optional(),
    page: z.number().min(1).default(1),
  }),
  async ({ username, tab, page }) => {
    const user = await getUser(username);
    const roles = await repositories.role.getUserRoles(user.id);
    const isWriter = hasPermission(roles, Permission.CreateArticle);
    const tabs: Tab[] = isWriter ? ['articles', 'comments'] : ['comments'];
    const selectedTab = parseTab(isWriter, tab);
    const { locals } = getRequestEvent();
    const isMyself = locals.loggedInUser?.id === user.id;

    if (selectedTab === 'articles') {
      const [aboutMe, articles] = await Promise.all([
        compileMarkdown(user.aboutMe),
        repositories.article.listByUserId(user.id, { pageNumber: page, pageSize: ARTICLE_PAGE_SIZE }),
      ]);
      return {
        user: { ...user, aboutMe },
        listData: { tabs, tab: 'articles', articles } as ListData,
        isMyself,
        isWriter,
      };
    }

    const [aboutMe, comments] = await Promise.all([
      compileMarkdown(user.aboutMe),
      repositories.comment.listByUser(user.id, { pageNumber: page, pageSize: COMMENT_PAGE_SIZE }),
    ]);
    return {
      user: { ...user, aboutMe },
      listData: { tabs, tab: 'comments', comments } as ListData,
      isMyself,
      isWriter,
    };
  },
);
