import { query } from '$app/server';
import z from 'zod';
import type { Article } from '#lib/models/article.js';
import { compileArticle } from '#lib/markdown.js';
import { throwError } from '#lib/errors.js';
import { db } from '#lib/server/registry.js';
import { getArticleById, getRepliesOfArticle } from '#lib/server/repositories/article.js';

/** An article prepared for the article page; `loadPageData` defines its title and markup. */
export interface ArticleDetail extends Article {
  markup: string;
}

/**
 * Loads an article with its direct responses. Markdown articles get sanitized markup and take their title from the H1;
 * external articles keep their stored title and get empty markup. A missing article throws NOT_FOUND and an unknown
 * content type INTERNAL_SERVER_ERROR. An exactly 16-character legacy ID finds the article by its first six characters,
 * but responses are looked up by the full supplied ID. Comments and bookmark state are separate queries.
 */
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
