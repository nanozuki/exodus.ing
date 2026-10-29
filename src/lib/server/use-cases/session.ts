import type { Session } from '#lib/models/session.js';
import type { AppDatabase } from '#lib/server/db/schema.js';
import * as sessions from '#lib/server/repositories/session.js';

const duration = 30 * 86400000;
const threshold = 20 * 86400000;

export type ValidateSessionResult = { session: Session; refresh: boolean };

// Expiry is 30 days after the injected clock’s current instant.
export async function createSession(
  deps: { db: AppDatabase; now: () => Date; generateSessionId: () => string },
  params: { userId: string },
): Promise<Session> {
  const currentTime = deps.now();
  return sessions.createSession(deps.db, {
    id: deps.generateSessionId(),
    userId: params.userId,
    expiresAt: new Date(+currentTime + duration),
  });
}

// Renewal is inclusive at 20 remaining days; refresh tells the caller to rewrite its session cookie.
export async function validateSession(
  deps: { db: AppDatabase; now: () => Date },
  params: { sessionId: string },
): Promise<ValidateSessionResult | null> {
  const currentTime = deps.now();
  const session = await sessions.findSessionById(deps.db, params.sessionId);
  if (!session) return null;
  if (+currentTime >= +session.expiresAt) {
    await sessions.deleteSession(deps.db, session.id);
    return null;
  }
  const refresh = +session.expiresAt - +currentTime <= threshold;
  if (refresh) {
    session.expiresAt = new Date(+currentTime + duration);
    await sessions.updateSession(deps.db, { id: session.id, expiresAt: session.expiresAt });
  }
  return { session, refresh };
}
