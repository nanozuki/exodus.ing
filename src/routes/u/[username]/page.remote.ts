import { form, getRequestEvent, query } from '$app/server';
import { listArticlesOfUser } from '#lib/server/repositories/article.js';
import { listCommentsOfUser } from '#lib/server/repositories/comment.js';
import { getRolesOfUser } from '#lib/server/repositories/role.js';
import { findUserByUsername, findUserById } from '#lib/server/repositories/user.js';
import { AUTH_COOKIE_NAME } from '#lib/server/transport/auth.js';
import { Permission, hasPermission } from '#lib/models/role.js';
import type { User } from '#lib/models/user.js';
import { throwError } from '#lib/errors.js';
import { compileMarkdown } from '#lib/markdown.js';
import { db } from '#lib/server/registry.js';
import { invalidateSession } from '#lib/server/use-cases/session.js';
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

/**
 * Loads a profile page. `@<username>` finds a user by exact username and any other value by user ID, with the legacy
 * 16-character ID rule; an unknown user throws NOT_FOUND. Writers have the `articles` and `comments` tabs and get
 * `articles` unless `tab` is exactly `comments`; readers have only `comments`. `page` must be at least 1 and defaults
 * to 1; pages hold 20 items. Returns the user, including `githubId` and `verifyCode`, with the biography compiled,
 * plus whether the viewer is that user and whether the user is a writer.
 */
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

/**
 * Signs out: deletes the stored session of the `auth_session` token, if any, then the cookie at `/`, and redirects 303
 * to `/`. Replaying the token afterward yields an anonymous request.
 */
export const logout = form(async () => {
  const { cookies } = getRequestEvent();
  const token = cookies.get(AUTH_COOKIE_NAME);
  if (token) {
    await invalidateSession({ db }, { token });
  }
  cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
  redirect(303, '/');
});
