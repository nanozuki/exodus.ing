import type { Session } from '$lib/models/session';
import { eq } from 'drizzle-orm';
import { tSession, type AppDatabase } from '$lib/server/db/schema';
import { wrap } from './utils';

export async function findSessionById(db: AppDatabase, sessionId: string): Promise<Session | null> {
  return wrap(
    'findSessionById',
    async () => (await db.select().from(tSession).where(eq(tSession.id, sessionId)))[0] ?? null,
  );
}

export async function createSession(db: AppDatabase, session: Session): Promise<Session> {
  return wrap('createSession', async () => (await db.insert(tSession).values(session).returning())[0]);
}

export interface UpdateSessionParams {
  id: string;
  expiresAt: Date;
}

export async function updateSession(db: AppDatabase, { id, expiresAt }: UpdateSessionParams): Promise<void> {
  return wrap('updateSession', async () => {
    await db.update(tSession).set({ expiresAt }).where(eq(tSession.id, id));
  });
}

export async function deleteSession(db: AppDatabase, sessionId: string): Promise<void> {
  return wrap('deleteSession', async () => {
    await db.delete(tSession).where(eq(tSession.id, sessionId));
  });
}
