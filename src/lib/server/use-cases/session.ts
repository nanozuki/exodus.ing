import { constantTimeEqual } from '@oslojs/crypto/subtle';
import { hashSessionSecret, type Session } from '#lib/models/session.js';
import type { AppDatabase } from '#lib/server/db/schema.js';
import type { Random } from '#lib/server/adapters/random.js';
import * as sessions from '#lib/server/repositories/session.js';

const duration = 30 * 86400000;
const threshold = 20 * 86400000;

export type ValidateSessionResult = { session: Session; refresh: boolean };

// A malformed token, unknown ID, or mismatched secret yields null and leaves stored sessions untouched.
async function findVerifiedSession(deps: { db: AppDatabase }, params: { token: string }): Promise<Session | null> {
  const parts = params.token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [id, secret] = parts;
  const session = await sessions.findSessionById(deps.db, id);
  if (!session) return null;
  // Compare the hex text itself so a corrupted stored hash is a mismatch rather than a decoding error.
  const encoder = new TextEncoder();
  const matches = constantTimeEqual(encoder.encode(hashSessionSecret(secret)), encoder.encode(session.secretHash));
  return matches ? session : null;
}

// Expiry is 30 days after the injected clock's current instant. The token is returned only here because the
// secret is not stored.
export async function createSession(
  deps: { db: AppDatabase; now: () => Date; random: Random },
  params: { userId: string },
): Promise<{ session: Session; token: string }> {
  const currentTime = deps.now();
  const id = deps.random.sessionId();
  const secret = deps.random.sessionSecret();
  const session = await sessions.createSession(deps.db, {
    id,
    userId: params.userId,
    secretHash: hashSessionSecret(secret),
    expiresAt: new Date(+currentTime + duration),
  });
  return { session, token: `${id}.${secret}` };
}

// Renewal is inclusive at 20 remaining days; refresh tells the caller to rewrite its cookie with the same token.
export async function validateSession(
  deps: { db: AppDatabase; now: () => Date },
  params: { token: string },
): Promise<ValidateSessionResult | null> {
  const currentTime = deps.now();
  const session = await findVerifiedSession(deps, params);
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

// Sign-out: afterwards the token validates as null. Cookie removal stays with the caller.
export async function invalidateSession(deps: { db: AppDatabase }, params: { token: string }): Promise<void> {
  const session = await findVerifiedSession(deps, params);
  if (session) {
    await sessions.deleteSession(deps.db, session.id);
  }
}
