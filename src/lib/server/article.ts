import { ArticleNotFound, Unauthorized } from '$lib/errors';
import { error } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import type { Article } from '$lib/entities';
import { generateArticleId } from './id';
import { tArticle, tUser } from '$lib/schema';
import { getUserVerifiedDomains } from './user_domain';

export async function createMarkdownArticle(
  locals: App.Locals,
  title: string,
  content: string,
): Promise<string> {
  const userId = locals.user?.id;
  if (!userId) {
    error(401, Unauthorized('create article'));
  }
  const articleId = await generateArticleId(locals);
  const now = new Date();
  await locals.db.insert(tArticle).values({
    id: articleId,
    createdAt: now,
    updatedAt: now,
    userId,
    title,
    content,
    contentType: 'markdown',
  });
  return articleId;
}

export async function createExternalLinkArticle(
  locals: App.Locals,
  title: string,
  url: string,
  publishedAt: Date,
  lastEditedAt: Date,
): Promise<string> {
  const userId = locals.user?.id;
  if (!userId) {
    error(401, Unauthorized('create article'));
  }
  const domain = new URL(url).hostname;
  const verifiedDomains = await getUserVerifiedDomains(locals, userId);
  if (!verifiedDomains.some((d) => d.domain === domain)) {
    error(403, Unauthorized('create article'));
  }
  const articleId = await generateArticleId(locals);
  await locals.db.insert(tArticle).values({
    id: articleId,
    createdAt: publishedAt,
    updatedAt: lastEditedAt,
    userId,
    title,
    contentType: 'external_link',
    content: url,
  });
  return articleId;
}

export async function updateMarkdownArticle(
  locals: App.Locals,
  articleId: string,
  title: string,
  content: string,
): Promise<void> {
  const userId = locals.user?.id;
  if (!userId) {
    error(401, Unauthorized('update article'));
  }
  const now = new Date();
  await locals.db
    .update(tArticle)
    .set({
      title,
      content,
      updatedAt: now,
    })
    .where(eq(tArticle.id, articleId));
}

interface ArticleListItem {
  articleId: string;
  userId: string;
  username: string;
  name: string;
  title: string;
  createdAt: Date;
}

export async function listArticles(
  locals: App.Locals,
  limit: number,
  offset: number,
): Promise<ArticleListItem[]> {
  const articles = await locals.db
    .select({
      articleId: tArticle.id,
      userId: tUser.id,
      username: tUser.username,
      name: tUser.name,
      title: tArticle.title,
      createdAt: tArticle.createdAt,
    })
    .from(tArticle)
    .innerJoin(tUser, eq(tArticle.userId, tUser.id))
    .orderBy(desc(tArticle.createdAt))
    .limit(limit)
    .offset(offset);
  return articles.map((article) => ({
    ...article,
    name: article.name || article.username,
  }));
}

export async function listArticlesByUserId(
  locals: App.Locals,
  userId: string,
  limit: number,
  offset: number,
): Promise<ArticleListItem[]> {
  const articles = await locals.db
    .select({
      articleId: tArticle.id,
      userId: tUser.id,
      username: tUser.username,
      name: tUser.name,
      title: tArticle.title,
      createdAt: tArticle.createdAt,
    })
    .from(tArticle)
    .innerJoin(tUser, eq(tArticle.userId, tUser.id))
    .where(eq(tArticle.userId, userId))
    .orderBy(desc(tArticle.createdAt))
    .limit(limit)
    .offset(offset);
  return articles.map((article) => ({
    ...article,
    name: article.name || article.username,
  }));
}

type ArticleContent = Article & { userId: string; username: string; name: string };

export async function getArticle(locals: App.Locals, articleId: string): Promise<ArticleContent> {
  // if articleId's length is 16, it's legacy articleId, shorten it by first 6 characters
  if (articleId.length === 16) {
    articleId = articleId.slice(0, 6);
  }
  const articles = await locals.db
    .select({
      id: tArticle.id,
      createdAt: tArticle.createdAt,
      updatedAt: tArticle.updatedAt,
      userId: tArticle.userId,
      title: tArticle.title,
      content: tArticle.content,
      contentType: tArticle.contentType,
      username: tUser.username,
      name: tUser.name,
    })
    .from(tArticle)
    .where(eq(tArticle.id, articleId))
    .innerJoin(tUser, eq(tArticle.userId, tUser.id));
  if (articles.length === 0) {
    error(404, ArticleNotFound(`articleId=${articleId}`));
  }
  return {
    ...articles[0],
    name: articles[0].name || articles[0].username,
  };
}
