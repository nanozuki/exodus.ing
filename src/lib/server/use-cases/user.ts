import type { LoggedInUser } from '#lib/models/user.js';
import type { Session } from '#lib/models/session.js';
import { throwError } from '#lib/errors.js';
import type { AppDatabase } from '#lib/server/db/schema.js';
import type { Random } from '#lib/server/adapters/random.js';
import {
  findUserByUsername,
  findUserByName,
  findUserByGitHubId,
  createUser,
  updateUser,
} from '#lib/server/repositories/user.js';
import { createSession } from './session';

/**
 * Checks signup choices before account creation: a supplied `username` must not start with `@` or already exist, and
 * a supplied `name` must not already exist; a failure throws PARAMETER_INVALID on that field. Callers pass trimmed
 * values and omit empty ones. This preflight reserves nothing; creation still relies on database uniqueness.
 */
export async function validateSignUp(
  deps: { db: AppDatabase },
  params: { username?: string; name?: string },
): Promise<void> {
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
 * Signs in a GitHub identity the OAuth adapter has verified and returns a new session from `createSession`. An
 * account with that GitHub ID is reused unchanged; otherwise one is created from `signUp` with an empty bio. A missing
 * username falls back to the GitHub username, and a missing name to the resulting username. A new username starting
 * with `@` throws PARAMETER_INVALID. Account and session creation are separate writes. OAuth state, cookies, and
 * redirects stay with the caller.
 */
export async function loginWithGitHub(
  deps: { db: AppDatabase; now: () => Date; random: Random },
  params: { githubUser: { id: number; username: string }; signUp?: { username?: string; name?: string } },
): Promise<{ session: Session; token: string }> {
  let user = await findUserByGitHubId(deps.db, params.githubUser.id);
  if (!user) {
    const username = params.signUp?.username || params.githubUser.username;
    const name = params.signUp?.name || username;
    if (username.startsWith('@')) return throwError('PARAMETER_INVALID', { username: '用户名不能以 @ 开头' });
    user = await createUser(deps.db, { username, name, githubId: params.githubUser.id, aboutMe: '' });
  }
  return createSession(deps, { userId: user.id });
}
