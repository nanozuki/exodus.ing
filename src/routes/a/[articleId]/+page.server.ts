import { compile } from '$lib/markdown';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  const article = await locals.article.getArticle(params.articleId);
  const interactions = await locals.article.getInteractions(article.id);
  const file = await compile(article.content);
  return {
    article,
    interactions,
    myself: locals.auth.loggedInUser?.id === article.author.userId,
    file: file.value,
    meta: file.data.meta,
  };
};
