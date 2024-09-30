import { AppError } from '$lib/errors';
import { compile } from '$lib/markdown';
import { listArticlesByUserId } from '$lib/server/article';
import { getUserById, getUserByUsername } from '$lib/server/user';
import type { Value } from 'vfile';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  let user = await getUserByUsername(locals, params.username);
  if (!user) {
    user = await getUserById(locals, params.username);
  }
  if (!user) {
    return AppError.UserNotFound(params.username).throw();
  }
  const articles = await listArticlesByUserId(locals, user.id, 10, 0);
  let aboutMe: Value | null = null;
  if (user.aboutMe.length > 0) {
    const compiled = await compile(user.aboutMe);
    aboutMe = compiled.value;
  }
  return {
    articles,
    user,
    isMyself: user.id === locals.loggedInUser?.id,
    aboutMe,
  };
};
