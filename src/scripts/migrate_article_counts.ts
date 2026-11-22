// migrate_article_counts.ts rewrites article interaction counts as soon as it is imported, writing to the database
// configured by the environment. It never closes the database connection.

import { getDatabase } from '#lib/server/db/index.js';
import { getConfig } from '#lib/server/config.js';
import { tArticle, tBookmark, tComment } from '#lib/server/db/schema.js';
import { eq, sql } from 'drizzle-orm/sql';

/**
 * Recounts every article's comments, bookmarks, and direct reply articles, stores the counts, and logs progress. Each
 * article commits independently; a failure leaves earlier updates applied.
 */
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
