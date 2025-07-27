import { getDatabase } from '$lib/server/repositories/index';
import { getConfig } from '$lib/server/config';
import { tArticle, tBookmark, tComment } from '$lib/server/repositories/schema';
import { eq, sql } from 'drizzle-orm/sql';

export async function migrateArticlesCounts(): Promise<void> {
  const config = getConfig();
  const db = await getDatabase(config);
  const articles = await db.select({ id: tArticle.id, path: tArticle.path }).from(tArticle);
  console.log(`found ${articles.length} articles`);
  for (const article of articles) {
    const commentCount = await db.$count(tComment, eq(tComment.articleId, article.id));
    const bookmarkCount = await db.$count(tBookmark, eq(tBookmark.articleId, article.id));
    const replyCount = await db.$count(tArticle, eq(tArticle.path, sql`${article.path} || ${tArticle.id} || '/'`));
    await db.update(tArticle).set({ commentCount, bookmarkCount, replyCount }).where(eq(tArticle.id, article.id));
    console.log(`migrate ${article.id} counts: `, { commentCount, bookmarkCount, replyCount });
  }
}

await migrateArticlesCounts();
