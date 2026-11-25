// session.ts creates, validates, and invalidates the auth sessions behind the `auth_session` cookie, and creates and
// validates pre-auth sessions. Both kinds use one token scheme: a token is `<id>.<secret>`, and only the secret's hash
// is stored. Cookie handling stays with the caller.

import { constantTimeEqual } from '@oslojs/crypto/subtle';
import {
  hashSessionSecret,
  type PreAuthPayload,
  type PreAuthPurpose,
  type PreAuthSession,
  type Session,
} from '#lib/models/session.js';
import type { AppDatabase } from '#lib/server/db/schema.js';
import type { Clock } from '#lib/server/adapters/clock.js';
import type { Random } from '#lib/server/adapters/random.js';
import * as sessions from '#lib/server/repositories/session.js';
import * as preAuthSessions from '#lib/server/repositories/pre_auth_session.js';

const duration = 30 * 86400000;
const threshold = 20 * 86400000;
const preAuthDuration = 10 * 60000;

/** `refresh` is true when validation extended the expiry; the caller then rewrites its cookie with the same token. */
export type ValidateSessionResult = { session: Session; refresh: boolean };

// A malformed token, unknown ID, or mismatched secret yields null and leaves stored sessions untouched. `find` looks up
// the stored session of the kind the token belongs to.
async function findVerifiedToken<S extends { secretHash: string }>(
  token: string,
  find: (id: string) => Promise<S | null>,
): Promise<S | null> {
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [id, secret] = parts;
  const session = await find(id);
  if (!session) return null;
  // Compare the hex text itself so a corrupted stored hash is a mismatch rather than a decoding error.
  const encoder = new TextEncoder();
  const matches = constantTimeEqual(encoder.encode(hashSessionSecret(secret)), encoder.encode(session.secretHash));
  return matches ? session : null;
}

function findVerifiedSession(deps: { db: AppDatabase }, params: { token: string }): Promise<Session | null> {
  return findVerifiedToken(params.token, (id) => sessions.findSessionById(deps.db, id));
}

/**
 * Creates a session for `userId` that expires 30 days after `now()`, and returns it with its token. This is the only
 * place the token is available. It also deletes every session already expired at `now()`.
 */
export async function createSession(
  deps: { db: AppDatabase; now: Clock; random: Random },
  params: { userId: string },
): Promise<{ session: Session; token: string }> {
  const currentTime = deps.now();
  const id = deps.random.sessionId();
  const secret = deps.random.sessionSecret();
  const session = await sessions.createSession(
    deps.db,
    {
      id,
      userId: params.userId,
      secretHash: hashSessionSecret(secret),
      expiresAt: new Date(+currentTime + duration),
    },
    currentTime,
  );
  return { session, token: `${id}.${secret}` };
}

/**
 * Returns the session `token` names, or null when the token is malformed (not two non-empty parts), names no session,
 * or carries the wrong secret. A session at or past `expiresAt` yields null and stays stored until `createSession`
 * clears it. Validation writes only the renewal: with 20 days or less remaining, the expiry moves to 30 days after
 * `now()` and `refresh` is true. The token itself never changes.
 */
export async function validateSession(
  deps: { db: AppDatabase; now: Clock },
  params: { token: string },
): Promise<ValidateSessionResult | null> {
  const currentTime = deps.now();
  const session = await findVerifiedSession(deps, params);
  if (!session) return null;
  if (+currentTime >= +session.expiresAt) return null;
  const refresh = +session.expiresAt - +currentTime <= threshold;
  if (refresh) {
    session.expiresAt = new Date(+currentTime + duration);
    await sessions.updateSession(deps.db, { id: session.id, expiresAt: session.expiresAt });
  }
  return { session, refresh };
}

/**
 * Signs out: deletes the session a valid token names, even an expired one, so the token validates as null afterwards.
 * Any other token is a no-op.
 */
export async function invalidateSession(deps: { db: AppDatabase }, params: { token: string }): Promise<void> {
  const session = await findVerifiedSession(deps, params);
  if (session) {
    await sessions.deleteSession(deps.db, session.id);
  }
}

/**
 * Creates a pre-auth session for `purpose` holding `payload`, expiring 10 minutes after `now()`, and returns it with
 * its token, which is available only here. It also deletes every pre-auth session already expired at `now()`.
 */
export async function createPreAuthSession<P extends PreAuthPurpose>(
  deps: { db: AppDatabase; now: Clock; random: Random },
  params: { purpose: P; payload: PreAuthPayload<P> },
): Promise<{ session: PreAuthSession<P>; token: string }> {
  const currentTime = deps.now();
  const id = deps.random.sessionId();
  const secret = deps.random.sessionSecret();
  const session = await preAuthSessions.createPreAuthSession<P>(
    deps.db,
    {
      id,
      purpose: params.purpose,
      secretHash: hashSessionSecret(secret),
      payload: params.payload,
      expiresAt: new Date(+currentTime + preAuthDuration),
    } as PreAuthSession<P>,
    currentTime,
  );
  return { session, token: `${id}.${secret}` };
}

/**
 * Returns the pre-auth session `token` names when its secret matches, it belongs to `purpose`, and `now()` is before
 * its `expiresAt`; otherwise null. Validation writes nothing: it never extends the expiry, leaves an expired session
 * for `createPreAuthSession` to clear, and does not consume the session: the flow deletes it when it completes or is
 * cancelled. A stored payload that fails its purpose's schema throws DATABASE_ERROR.
 */
export async function validatePreAuthSession<P extends PreAuthPurpose>(
  deps: { db: AppDatabase; now: Clock },
  params: { token: string; purpose: P },
): Promise<PreAuthSession<P> | null> {
  const currentTime = deps.now();
  const session = await findVerifiedToken(params.token, (id) =>
    preAuthSessions.findPreAuthSessionById(deps.db, id, params.purpose),
  );
  if (!session || +currentTime >= +session.expiresAt) return null;
  return session;
}
