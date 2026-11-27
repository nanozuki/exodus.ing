// pre_auth_session.ts persists supplied pre-auth session data. Use cases own ID generation, current-time reads, and
// lifetimes; this file reads no clock.

import {
  preAuthPayloadSchemas,
  type PreAuthPayload,
  type PreAuthPurpose,
  type PreAuthSession,
} from '#lib/models/session.js';
import { and, eq, lte } from 'drizzle-orm';
import { tPreAuthSession, type AppDatabase } from '#lib/server/db/schema.js';
import { wrap } from './utils';

/**
 * Returns the stored pre-auth session when it belongs to `purpose`, with its payload parsed by that purpose's schema in
 * `preAuthPayloadSchemas`; a session of another purpose yields null. A stored payload that fails parsing throws
 * DATABASE_ERROR. The result includes the secret hash; the caller verifies the secret.
 */
export async function findPreAuthSessionById<P extends PreAuthPurpose>(
  db: AppDatabase,
  sessionId: string,
  purpose: P,
): Promise<PreAuthSession<P> | null> {
  return wrap('findPreAuthSessionById', async () => {
    const [row] = await db
      .select()
      .from(tPreAuthSession)
      .where(and(eq(tPreAuthSession.id, sessionId), eq(tPreAuthSession.purpose, purpose)));
    if (!row) return null;
    // `satisfies` on the schema map ties each purpose to its schema, which TypeScript cannot correlate through `P`.
    const payload = preAuthPayloadSchemas[purpose].parse(row.payload) as PreAuthPayload<P>;
    const { id, secretHash, expiresAt } = row;
    return { id, purpose, secretHash, payload, expiresAt } as PreAuthSession<P>;
  });
}

/**
 * Stores the pre-auth session as given, applying no lifetime policy, and returns it. In the same transaction it first
 * deletes every pre-auth session, of any purpose, whose `expiresAt` is at or before `now`, so abandoned flows are
 * cleared as new ones start.
 */
export async function createPreAuthSession<P extends PreAuthPurpose>(
  db: AppDatabase,
  session: PreAuthSession<P>,
  now: Date,
): Promise<PreAuthSession<P>> {
  return wrap('createPreAuthSession', () =>
    db.transaction(async (tx) => {
      await tx.delete(tPreAuthSession).where(lte(tPreAuthSession.expiresAt, now));
      await tx.insert(tPreAuthSession).values(session);
      return session;
    }),
  );
}

/** Deletes the pre-auth session without checking existence. */
export async function deletePreAuthSession(db: AppDatabase, sessionId: string): Promise<void> {
  return wrap('deletePreAuthSession', async () => {
    await db.delete(tPreAuthSession).where(eq(tPreAuthSession.id, sessionId));
  });
}
