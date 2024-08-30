import { ArticleNotFound, Unauthorized } from '$lib/errors';
import * as schema from '$lib/schema';
import { error } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import type { Article } from '$lib/schema';
import { generateArticleId } from './id';

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
  await locals.db.insert(schema.article).values({
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
    .update(schema.article)
    .set({
      title,
      content,
      updatedAt: now,
    })
    .where(eq(schema.article.id, articleId));
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
      articleId: schema.article.id,
      userId: schema.user.id,
      username: schema.user.username,
      name: schema.user.name,
      title: schema.article.title,
      createdAt: schema.article.createdAt,
    })
    .from(schema.article)
    .innerJoin(schema.user, eq(schema.article.userId, schema.user.id))
    .orderBy(desc(schema.article.createdAt))
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
      articleId: schema.article.id,
      userId: schema.user.id,
      username: schema.user.username,
      name: schema.user.name,
      title: schema.article.title,
      createdAt: schema.article.createdAt,
    })
    .from(schema.article)
    .innerJoin(schema.user, eq(schema.article.userId, schema.user.id))
    .where(eq(schema.article.userId, userId))
    .orderBy(desc(schema.article.createdAt))
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
      id: schema.article.id,
      createdAt: schema.article.createdAt,
      updatedAt: schema.article.updatedAt,
      userId: schema.article.userId,
      title: schema.article.title,
      content: schema.article.content,
      contentType: schema.article.contentType,
      username: schema.user.username,
      name: schema.user.name,
    })
    .from(schema.article)
    .where(eq(schema.article.id, articleId))
    .innerJoin(schema.user, eq(schema.article.userId, schema.user.id));
  if (articles.length === 0) {
    error(404, ArticleNotFound(`articleId=${articleId}`));
  }
  return {
    ...articles[0],
    name: articles[0].name || articles[0].username,
  };
}
