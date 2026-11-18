// Importing this script immediately copies legacy GitHub IDs into user identities.

import { getDatabase } from '#lib/server/db/index.js';
import { getConfig } from '#lib/server/config.js';
import { tUser, tUserIdentity } from '#lib/server/db/schema.js';
import { isNotNull, sql } from 'drizzle-orm';

// Run after pushing the schema that adds user_identity. Atomic and idempotent; existing identities and the legacy
// column stay unchanged.
export async function migrateUserIdentities(): Promise<void> {
  const config = getConfig();
  const db = await getDatabase(config);
  // One INSERT ... SELECT keeps the copy atomic, and skipping linked provider accounts keeps reruns idempotent.
  const inserted = await db
    .insert(tUserIdentity)
    .select(
      db
        .select({
          userId: tUser.id,
          provider: sql<'github'>`'github'::identity_provider`.as('provider'),
          subject: sql<string>`${tUser.githubId}::text`.as('subject'),
          createdAt: sql<Date>`now()`.as('created_at'),
        })
        .from(tUser)
        .where(isNotNull(tUser.githubId)),
    )
    .onConflictDoNothing()
    .returning({ userId: tUserIdentity.userId });
  console.log(`migrated ${inserted.length} GitHub identities`);
}

await migrateUserIdentities();
