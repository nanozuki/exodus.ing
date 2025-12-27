import { query } from '$app/server';
import { repositories } from '$lib/server/registry';
import { ARTICLE_PAGE_SIZE } from '$lib/domain/entities/article';
import z from 'zod';
import { compileArticle } from '$lib/markdown';

export const listArticles = query(z.number().min(1), async (page) => {
  return await repositories.article.list({ pageNumber: page, pageSize: ARTICLE_PAGE_SIZE });
});

export const getArticleDetails = query(z.string(), async (articleId) => {
  // if articleId's length is 16, it's legacy articleId, shorten it by first 6 characters
  if (articleId.length === 16) {
    articleId = articleId.slice(0, 6);
  }
  const article = await repositories.article.getById(articleId);
  const compiled = await compileArticle(article.content);
  return { ...article, content: compiled.value.toString(), title: compiled.title };
});

export const listRepliesOfArticle = query(z.string(), async (articleId) => {
  return await repositories.article.listReplies(articleId);
});
