import type { IdentityProvider, LoggedInUser } from '#lib/models/user.js';
import { PreAuthPurpose, type PreAuthSession, type Session } from '#lib/models/session.js';
import { throwError } from '#lib/errors.js';
import type { AppDatabase } from '#lib/server/db/schema.js';
import type { Clock } from '#lib/server/adapters/clock.js';
import type { Random } from '#lib/server/adapters/random.js';
import {
  findUserByUsername,
  findUserByName,
  findUserByIdentity,
  createUser,
  updateUser,
} from '#lib/server/repositories/user.js';
import { deletePreAuthSession } from '#lib/server/repositories/pre_auth_session.js';
import { createPreAuthSession, createSession, validatePreAuthSession } from './session';

// Rejects a username starting with `@` and a taken username or name before account creation. It reserves nothing;
// creation still relies on database uniqueness, which `createUser` reports on the same fields.
async function validateSignUp(deps: { db: AppDatabase }, params: { username?: string; name?: string }): Promise<void> {
  if (params.username) {
    if (params.username.startsWith('@')) return throwError('PARAMETER_INVALID', { username: '用户名不能以 @ 开头' });
    if (await findUserByUsername(deps.db, params.username))
      return throwError('PARAMETER_INVALID', { username: '用户名已存在' });
  }
  if (params.name && (await findUserByName(deps.db, params.name)))
    return throwError('PARAMETER_INVALID', { name: '昵称已存在' });
}

/**
 * Sets the actor's username to `username` exactly as given, relying on database uniqueness alone. A leading `@`
 * throws PARAMETER_INVALID; the current username is a no-op.
 */
export async function updateUsername(
  deps: { db: AppDatabase },
  params: { actor: LoggedInUser; username: string },
): Promise<void> {
  if (params.username.startsWith('@')) return throwError('PARAMETER_INVALID', { username: '用户名不能以 @ 开头' });
  if (params.username === params.actor.username) return;
  await updateUser(deps.db, { id: params.actor.id, username: params.username });
}

/**
 * `signed_in` carries a new auth session and its token. `sign_up_required` carries a new pending sign-up session and
 * its token, for the caller to keep until the sign-up page completes or cancels it.
 */
export type SignInResult =
  | { status: 'signed_in'; session: Session; token: string }
  | { status: 'sign_up_required'; session: PreAuthSession<PreAuthPurpose.SignUp>; token: string };

/**
 * Signs in an identity the provider adapter has verified. When the identity belongs to a user, creates an auth session
 * with `createSession` and changes nothing else. Otherwise creates no user: it starts a pending sign-up, a `sign_up`
 * pre-auth session expiring 10 minutes after `now()` that holds `identity`, the provider's suggested `username` and
 * `name` in `hints`, and `next`, stored unsanitized. OAuth state, cookies, and redirects stay with the caller.
 */
export async function signInWithIdentity(
  deps: { db: AppDatabase; now: Clock; random: Random },
  params: {
    identity: { provider: IdentityProvider; subject: string };
    hints: { username?: string; name?: string };
    next?: string;
  },
): Promise<SignInResult> {
  const user = await findUserByIdentity(deps.db, params.identity);
  if (user) {
    return { status: 'signed_in', ...(await createSession(deps, { userId: user.id })) };
  }
  const { session, token } = await createPreAuthSession(deps, {
    purpose: PreAuthPurpose.SignUp,
    payload: { identity: params.identity, hints: params.hints, next: params.next },
  });
  return { status: 'sign_up_required', session, token };
}

/**
 * Returns the values the sign-up form starts with for the pending sign-up `token` names: the username hint, or empty
 * without one, and the name hint, falling back to the username hint. Returns null when the token names no live
 * pending sign-up: it is malformed, carries the wrong secret, belongs to another flow, or has expired. Reading does
 * not consume the pending sign-up.
 */
export async function fetchSignUpPrefill(
  deps: { db: AppDatabase; now: Clock },
  params: { token: string },
): Promise<{ username: string; name: string } | null> {
  const session = await validatePreAuthSession(deps, { token: params.token, purpose: PreAuthPurpose.SignUp });
  if (!session) return null;
  const username = session.payload.hints.username ?? '';
  return { username, name: session.payload.hints.name ?? username };
}

/**
 * Creates the account for the pending sign-up `token` names and signs it in. Callers pass trimmed, nonempty `username`
 * and `name`. Returns null, creating nothing, when the token names no live pending sign-up, as for
 * `fetchSignUpPrefill`. A `username` starting with `@`, or a taken `username` or `name`, throws PARAMETER_INVALID on
 * that field; an identity that already belongs to a user throws DATABASE_ERROR. Every failure creates nothing and
 * keeps the pending sign-up. Otherwise writes the user, with an empty bio, and its identity in one transaction,
 * deletes the pending sign-up, and returns a new auth session with its token and the stored, unsanitized `next`.
 * Concurrent completions of one pending sign-up create at most one account; the others fail with one of these errors.
 * The writes after the user's creation are separate.
 */
export async function completeSignUp(
  deps: { db: AppDatabase; now: Clock; random: Random },
  params: { token: string; username: string; name: string },
): Promise<{ session: Session; token: string; next?: string } | null> {
  const pending = await validatePreAuthSession(deps, { token: params.token, purpose: PreAuthPurpose.SignUp });
  if (!pending) return null;
  await validateSignUp(deps, { username: params.username, name: params.name });
  const user = await createUser(deps.db, {
    username: params.username,
    name: params.name,
    aboutMe: '',
    identity: pending.payload.identity,
  });
  await deletePreAuthSession(deps.db, pending.id);
  return { ...(await createSession(deps, { userId: user.id })), next: pending.payload.next };
}

/**
 * Deletes the live pending sign-up `token` names; any other token is a no-op, since an expired one is cleared when a
 * pre-auth session is next created.
 */
export async function cancelSignUp(deps: { db: AppDatabase; now: Clock }, params: { token: string }): Promise<void> {
  const pending = await validatePreAuthSession(deps, { token: params.token, purpose: PreAuthPurpose.SignUp });
  if (pending) await deletePreAuthSession(deps.db, pending.id);
}
