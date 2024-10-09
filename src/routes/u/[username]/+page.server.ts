import { compile } from '$lib/markdown';
import type { Value } from 'vfile';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  let user = await locals.user.findUserByUsername(params.username);
  if (!user) {
    user = await locals.user.getUserById(params.username);
  }
  const articles = await locals.article.listArticlesByUserId(user.id, 10, 0);
  let aboutMe: Value | null = null;
  if (user.aboutMe.length > 0) {
    const compiled = await compile(user.aboutMe);
    aboutMe = compiled.value;
  }
  return {
    articles,
    user,
    isMyself: user.id === locals.auth.loggedInUser?.id,
    aboutMe,
  };
};
