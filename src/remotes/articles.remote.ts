import { form, getRequestEvent, query } from '$app/server';
import { repositories } from '$lib/server/registry';
import { ARTICLE_PAGE_SIZE } from '$lib/domain/entities/article';
import z from 'zod';
import { compileArticle, throwArticleIssue } from '$lib/markdown';
import { Permission } from '$lib/domain/entities/role';
import { throwError } from '$lib/errors';
import { redirect } from '@sveltejs/kit';

export const getArticleDetailById = query(z.string(), async (articleId) => {
  // if articleId's length is 16, it's legacy articleId, shorten it by first 6 characters
  if (articleId.length === 16) {
    articleId = articleId.slice(0, 6);
  }
  const article = await repositories.article.getById(articleId);
  const compiled = await compileArticle(article.content);
  return { ...article, content: compiled.value.toString(), title: compiled.title };
});

export const getArticleContentById = query(z.string(), async (articleId) => {
  return await repositories.article.getContentById(articleId);
});

export const getArticleCardById = query(z.string(), async (articleId) => {
  return await repositories.article.getCardById(articleId);
});

export const listArticles = query(z.number().min(1), async (page) => {
  return await repositories.article.list({ pageNumber: page, pageSize: ARTICLE_PAGE_SIZE });
});

export const listRepliesOfArticle = query(z.string(), async (articleId) => {
  return await repositories.article.listReplies(articleId);
});

export const createOrUpdateMarkdownArticle = form(
  z.object({
    articleId: z.string().optional(),
    content: z.string().min(1),
    replyTo: z.string().optional(),
  }),
  async ({ articleId, content, replyTo }) => {
    const { locals } = getRequestEvent();
    const user = locals.requirePermission(Permission.CreateArticle, '编辑文章');
    const { title, issues } = await compileArticle(content);
    if (issues.length > 0) {
      throwArticleIssue(issues[0], 'content');
    }

    // update article
    if (articleId) {
      const article = await repositories.article.getById(articleId);
      if (article.authorId !== user.id) {
        return throwError('BAD_REQUEST', '只能编辑自己的文章');
      }
      await repositories.article.update(articleId, { title, content });
      redirect(303, `/a/${articleId}`);
    }

    // create article
    const newArticleId = await repositories.article.create({
      authorId: user.id,
      content,
      title,
      contentType: 'markdown',
      replyTo,
    });
    redirect(303, `/a/${newArticleId}`);
  },
);
