import { query } from '$app/server';
import z from 'zod';
import type { Article } from '#lib/models/article.js';
import { compileArticle } from '#lib/markdown.js';
import { throwError } from '#lib/errors.js';
import { db } from '#lib/server/registry.js';
import { getArticleById, getRepliesOfArticle } from '#lib/server/repositories/article.js';

export interface ArticleDetail extends Article {
  markup: string;
}

// Only the detail lookup shortens legacy IDs; the replies lookup keeps the supplied ID.
export const loadPageData = query(z.object({ articleId: z.string() }), async ({ articleId }) => {
  const [stored, replies] = await Promise.all([
    getArticleById(db, articleId.length === 16 ? articleId.slice(0, 6) : articleId),
    getRepliesOfArticle(db, articleId),
  ]);
  let article: ArticleDetail;
  if (stored.contentType === 'markdown') {
    const { markup, title } = await compileArticle(stored.content);
    article = { ...stored, markup, title };
  } else if (stored.contentType === 'external') article = { ...stored, markup: '' };
  else return throwError('INTERNAL_SERVER_ERROR', '未知的文章内容类型');
  return { article, replies };
});
