import { form, getRequestEvent, query } from '$app/server';
import { repositories } from '$lib/server/registry';
import { ARTICLE_PAGE_SIZE, type ArticleDetail } from '$lib/domain/entities/article';
import z from 'zod';
import { compileArticle, throwArticleIssue } from '$lib/markdown';
import { Permission } from '$lib/domain/entities/role';
import { throwError } from '$lib/errors';
import { redirect } from '@sveltejs/kit';
import { resolveTxt } from '$lib/server/adapters/name_resolver';

export const getArticleDetailById = query(z.string(), async (articleId): Promise<ArticleDetail> => {
  // if articleId's length is 16, it's legacy articleId, shorten it by first 6 characters
  if (articleId.length === 16) {
    articleId = articleId.slice(0, 6);
  }
  const article = await repositories.article.getById(articleId);
  if (article.contentType === 'markdown') {
    const { markup, title } = await compileArticle(article.content);
    return { ...article, markup, title };
  } else if (article.contentType === 'external') {
    return { ...article, markup: '' };
  } else {
    throw throwError('INTERNAL_SERVER_ERROR', '未知的文章内容类型');
  }
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

export const listBookmarkedArticles = query(z.number().min(1), async (page) => {
  const { locals } = getRequestEvent();
  const loggedInUser = locals.requireLoggedInUser('console bookmarks');
  return await repositories.article.listUserBookmarks(loggedInUser.id, {
    pageNumber: page,
    pageSize: ARTICLE_PAGE_SIZE,
  });
});

export const createOrUpdateMarkdownArticle = form(
  z.object({
    content: z.string().min(1),
    articleId: z.string().optional(),
    replyToId: z.string().optional(),
  }),
  async ({ articleId, content, replyToId }) => {
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
      replyToId,
    });
    redirect(303, `/a/${newArticleId}`);
  },
);

export const verifyDomainOwnership = form(
  z.object({
    url: z.url(),
  }),
  async ({ url }) => {
    const { locals } = getRequestEvent();
    const user = locals.requirePermission(Permission.CreateArticle, '验证站点所有权');
    const { hostname } = new URL(url);
    const textRecords = await resolveTxt(hostname);
    return {
      url,
      hostname,
      verified: textRecords.some((record) => record.includes(`exodus-site-verification=${user.verifyCode}`)),
    };
  },
);

const createOrUpdateExternalArticleSchema = z.object({
  url: z.url(),
  title: z.string(),
  articleId: z.string().optional(),
  replyToId: z.string().optional(),
});

export const createOrUpdateExternalArticle = form(
  createOrUpdateExternalArticleSchema,
  async ({ url, title, articleId, replyToId }) => {
    const { locals } = getRequestEvent();
    const user = locals.requirePermission(Permission.CreateArticle, '编辑文章');
    const { hostname } = new URL(url);
    const textRecords = await resolveTxt(hostname);
    if (!textRecords.some((record) => record.includes(`exodus-site-verification=${user.verifyCode}`))) {
      return throwError('PARAMETER_INVALID', { url: '无法验证站点所有权，请按照说明添加 TXT 记录后重试' });
    }

    // update article
    if (articleId) {
      const article = await repositories.article.getById(articleId);
      if (article.authorId !== user.id) {
        return throwError('BAD_REQUEST', '只能编辑自己的文章');
      }
      await repositories.article.update(articleId, { title, content: url });
      redirect(303, `/a/${articleId}`);
    }

    // create article
    const newArticleId = await repositories.article.create({
      authorId: user.id,
      content: url,
      title,
      contentType: 'external',
      replyToId,
    });
    redirect(303, `/a/${newArticleId}`);
  },
);
