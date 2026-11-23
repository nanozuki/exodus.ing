// session.ts persists supplied session data. Use cases own ID generation, current-time reads, expiration decisions,
// and renewal policy.

import type { Session } from '#lib/models/session.js';
import { eq } from 'drizzle-orm';
import { tSession, type AppDatabase } from '#lib/server/db/schema.js';
import { wrap } from './utils';

/** Returns the stored session, including its secret hash; the caller verifies the secret. */
export async function findSessionById(db: AppDatabase, sessionId: string): Promise<Session | null> {
  return wrap(
    'findSessionById',
    async () => (await db.select().from(tSession).where(eq(tSession.id, sessionId)))[0] ?? null,
  );
}

/** Stores the session as given, applying no lifetime policy, and returns it. */
export async function createSession(db: AppDatabase, session: Session): Promise<Session> {
  return wrap('createSession', async () => (await db.insert(tSession).values(session).returning())[0]);
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

/** Deletes the session without checking existence; use cases also call it to discard an expired session. */
export async function deleteSession(db: AppDatabase, sessionId: string): Promise<void> {
  return wrap('deleteSession', async () => {
    await db.delete(tSession).where(eq(tSession.id, sessionId));
  });
}
