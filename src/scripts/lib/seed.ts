import {
  tArticle,
  tBookmark,
  tComment,
  tInviteCode,
  tPendingAuth,
  tSession,
  tUser,
  tUserAuth,
  tUserRole,
} from '#lib/server/db/schema.js';
import { sql } from 'drizzle-orm/sql';
import { schema } from '#lib/server/db/schema.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import { testDataset } from '#lib/testing/data.js';
import type { Client } from 'pg';

// Replaces all application data in the supplied database; the caller retains ownership of the client.
export async function seedE2EData(client: Client): Promise<void> {
  const { users, articles, comments, bookmarks, userRoles, inviteCodes } = testDataset;
  const db = drizzle(client, { schema });
  await db.transaction(async (tx) => {
    await tx.delete(tBookmark);
    await tx.delete(tComment);
    await tx.delete(tInviteCode);
    await tx.delete(tUserRole);
    await tx.delete(tSession);
    await tx.delete(tUserAuth);
    await tx.delete(tPendingAuth);
    await tx.delete(tArticle);
    await tx.delete(tUser);

    await tx.insert(tUser).values(users);
    await tx.insert(tUserRole).values(userRoles);
    await tx.insert(tInviteCode).values(inviteCodes);
    await tx.insert(tArticle).values(articles);
    await tx.insert(tBookmark).values(bookmarks);
    await tx.insert(tComment).values(comments);

    await tx.execute(
      sql`SELECT setval(pg_get_serial_sequence('invite_code', 'id'), (SELECT COALESCE(MAX(id), 1) FROM invite_code))`,
    );
  });

  console.log(`[SEED] inserted ${users.length} users`);
  console.log(`[SEED] inserted ${articles.length} articles`);
  console.log(`[SEED] inserted ${bookmarks.length} bookmarks`);
  console.log(`[SEED] inserted ${comments.length} comments`);
  console.log(`[SEED] inserted ${inviteCodes.length} invite codes`);
}
