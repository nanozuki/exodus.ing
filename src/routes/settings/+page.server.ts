import type { UserDomain } from '$lib/entities';
import { Unauthorized, UserNotFound } from '$lib/errors';
import { getUserById, updateProfile, updateUsername } from '$lib/server/user';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// const mockDomains = (userId: string): UserDomain[] => [
//   {
//     id: 1,
//     userId,
//     domain: 'example.com',
//     verifyTxtRecord: 'exodus-site-verification=1234567890',
//     verifiedAt: new Date(),
//   },
// ];
const mockDomains: Map<string, UserDomain[]> = new Map();

const getDomains = (userId: string): UserDomain[] => {
  if (!mockDomains.has(userId)) {
    mockDomains.set(userId, [
      {
        id: 1,
        userId,
        domain: 'example.com',
        verifyTxtRecord: 'exodus-site-verification=1234567890',
        verifiedAt: new Date(),
      },
    ]);
  }
  return mockDomains.get(userId)!;
};

const addDomain = (userId: string, domain: string): UserDomain => {
  const domains = mockDomains.get(userId) || [];
  const id = domains.length + 1;
  const verifyTxtRecord = `exodus-site-verification=${id}`;
  const userDomain = {
    id,
    userId,
    domain,
    verifyTxtRecord,
    verifiedAt: null,
  };
  domains.push(userDomain);
};

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    return error(401, Unauthorized('User settings'));
  }
  const user = await getUserById(locals, locals.user?.id);
  if (!user) {
    return error(404, UserNotFound(locals.user?.id));
  }
  // const domains = await getUserDomains(locals, user.id);
  const domains = getDomains(user.id);
  return {
    user,
    domains,
  };
};

export const actions = {
  profile: async ({ url, locals, request }) => {
    const data = await request.formData();
    const name = data.get('name');
    if (typeof name !== 'string' || name.length === 0) {
      return fail(400, { error: { name: '名字不能为空' } });
    }
    const aboutMe = data.get('aboutMe');
    if (typeof aboutMe !== 'string') {
      return fail(400, { error: { aboutMe: '介绍必须是字符串' } });
    }
    await updateProfile(locals, locals.user!.id, name, aboutMe);
    redirect(302, url.toString());
  },
  username: async ({ locals, request }) => {
    const userId = locals.user?.id;
    if (!userId) {
      return error(401, Unauthorized('update username'));
    }
    const data = await request.formData();
    const username = data.get('username');
    if (typeof username !== 'string') {
      return { error: '用户名不能为空' };
    }
    if (username.length === 0) {
      return {
        username: typeof username === 'string' ? username : undefined,
        error: '用户名不能为空',
      };
    } else if (username === locals.user!.username) {
      return { username };
    }

    try {
      await updateUsername(locals, userId, username);
    } catch (e) {
      if (e instanceof Error) {
        return {
          username: typeof username === 'string' ? username : undefined,
          error: e.message,
        };
      }
      return {
        username: typeof username === 'string' ? username : undefined,
        error: JSON.stringify(e),
      };
    }
    redirect(301, `/u/${username}`);
  },
  add_domain: async ({ locals, request }) => {
    const data = await request.formData();
    const domain = data.get('domain');
    if (typeof domain !== 'string') {
      return { error: '域名不能为空' };
    }
    addDomain(locals.user!.id, domain);
  },
} satisfies Actions;
