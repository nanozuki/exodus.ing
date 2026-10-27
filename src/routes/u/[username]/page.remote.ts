import { form, getRequestEvent, query } from '$app/server';
import { listArticlesOfUser } from '$lib/server/repositories/article';
import { listCommentsOfUser } from '$lib/server/repositories/comment';
import { getRolesOfUser } from '$lib/server/repositories/role';
import { findUserByUsername, findUserById } from '$lib/server/repositories/user';
import { AUTH_COOKIE_NAME } from '$lib/server/auth';
import { Permission, hasPermission } from '$lib/models/role';
import type { User } from '$lib/models/user';
import { throwError } from '$lib/errors';
import { compileMarkdown } from '$lib/markdown';
import { db } from '$lib/server/registry';
import { redirect } from '@sveltejs/kit';
import z from 'zod';

type Tab = 'articles' | 'comments';

type ListData = {
  tabs: Tab[];
} & (
  | { tab: 'articles'; articles: Awaited<ReturnType<typeof listArticlesOfUser>> }
  | { tab: 'comments'; comments: Awaited<ReturnType<typeof listCommentsOfUser>> }
);

function parseTab(isWriter: boolean, tab: string | undefined): Tab {
  if (isWriter) {
    return tab === 'comments' ? 'comments' : 'articles';
  }
  return 'comments';
}

async function getUser(param: string): Promise<User> {
  const user = param.startsWith('@') ? await findUserByUsername(db, param.slice(1)) : await findUserById(db, param);
  return user ? user : throwError('NOT_FOUND', { resource: '用户' });
}

export const loadPageData = query(
  z.object({
    username: z.string(),
    tab: z.string().optional(),
    page: z.number().min(1).default(1),
  }),
  async ({ username, tab, page }) => {
    const pageSize = 20;
    const user = await getUser(username);
    const roles = await getRolesOfUser(db, user.id);
    const isWriter = hasPermission(roles, Permission.CreateArticle);
    const tabs: Tab[] = isWriter ? ['articles', 'comments'] : ['comments'];
    const selectedTab = parseTab(isWriter, tab);
    const { locals } = getRequestEvent();
    const isMyself = locals.loggedInUser?.id === user.id;

    if (selectedTab === 'articles') {
      const [aboutMe, articles] = await Promise.all([
        compileMarkdown(user.aboutMe),
        listArticlesOfUser(db, user.id, { pageNumber: page, pageSize: pageSize }),
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
      listCommentsOfUser(db, user.id, { pageNumber: page, pageSize: pageSize }),
    ]);
    return {
      user: { ...user, aboutMe },
      listData: { tabs, tab: 'comments', comments } as ListData,
      isMyself,
      isWriter,
    };
  },
);

// Signing out removes the cookie; the stored session remains valid.
export const logout = form(async () => {
  const { cookies } = getRequestEvent();
  cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
  redirect(303, '/');
});
