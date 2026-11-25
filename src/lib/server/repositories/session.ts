// session.ts persists supplied session data. Use cases own ID generation, current-time reads, lifetimes, and renewal
// policy; this file reads no clock.

import type { Session } from '#lib/models/session.js';
import { eq, lte } from 'drizzle-orm';
import { tSession, type AppDatabase } from '#lib/server/db/schema.js';
import { wrap } from './utils';

/** Returns the stored session, including its secret hash; the caller verifies the secret. */
export async function findSessionById(db: AppDatabase, sessionId: string): Promise<Session | null> {
  return wrap(
    'findSessionById',
    async () => (await db.select().from(tSession).where(eq(tSession.id, sessionId)))[0] ?? null,
  );
}

/**
 * Stores the session as given, applying no lifetime policy, and returns it. In the same transaction it first deletes
 * every session, of any user, whose `expiresAt` is at or before `now`, so expired sessions are cleared as new ones
 * start.
 */
export async function createSession(db: AppDatabase, session: Session, now: Date): Promise<Session> {
  return wrap('createSession', () =>
    db.transaction(async (tx) => {
      await tx.delete(tSession).where(lte(tSession.expiresAt, now));
      return (await tx.insert(tSession).values(session).returning())[0];
    }),
  );
}

export interface UpdateSessionParams {
  id: string;
  expiresAt: Date;
}

/** Sets the session's expiration without checking existence. */
export async function updateSession(db: AppDatabase, { id, expiresAt }: UpdateSessionParams): Promise<void> {
  return wrap('updateSession', async () => {
    await db.update(tSession).set({ expiresAt }).where(eq(tSession.id, id));
  });
}

/** Deletes the session without checking existence. */
export async function deleteSession(db: AppDatabase, sessionId: string): Promise<void> {
  return wrap('deleteSession', async () => {
    await db.delete(tSession).where(eq(tSession.id, sessionId));
  });
}
