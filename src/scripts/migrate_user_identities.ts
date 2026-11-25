// migrate_user_identities.ts copies GitHub account links into `user_identity` as soon as it is imported, writing to
// the database configured by the environment. Run it after pushing the schema that adds `user_identity` and before
// deploying code that signs in through identities. It never closes the database connection.

import { isNotNull, sql } from 'drizzle-orm';
import { getConfig } from '#lib/server/config.js';
import { getDatabase } from '#lib/server/db/index.js';
import { tUser, tUserIdentity } from '#lib/server/db/schema.js';
import type { IdentityProvider } from '#lib/models/user.js';

/**
 * Inserts a `github` identity for every user with a non-null `github_id`, its subject the ID in decimal, and logs the
 * number of rows inserted. An identity that already exists is left unchanged, so running it again inserts nothing.
 * `github_id` itself is left in place.
 */
export async function migrateUserIdentities(): Promise<void> {
  const db = await getDatabase(getConfig());
  // One statement, so a rerun relies on the (subject, provider) key rather than a separate existence check.
  const inserted = await db
    .insert(tUserIdentity)
    .select(
      db
        .select({
          provider: sql<IdentityProvider>`'github'`.as('provider'),
          subject: sql<string>`${tUser.githubId}::text`.as('subject'),
          userId: tUser.id,
          createdAt: tUser.createdAt,
        })
        .from(tUser)
        .where(isNotNull(tUser.githubId)),
    )
    .onConflictDoNothing()
    .returning({ subject: tUserIdentity.subject });
  console.log(`inserted ${inserted.length} github identities`);
}

await migrateUserIdentities();
