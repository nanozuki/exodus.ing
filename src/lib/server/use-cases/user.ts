import type { LoggedInUser } from '#lib/models/user.js';
import type { Session } from '#lib/models/session.js';
import { throwError } from '#lib/errors.js';
import type { AppDatabase } from '#lib/server/db/schema.js';
import type { Random } from '#lib/server/adapters/random.js';
import {
  findUserByUsername,
  findUserByName,
  findUserByIdentity,
  createUser,
  updateUser,
} from '#lib/server/repositories/user.js';
import { createSession } from './session';

// This preflight does not reserve names; creation still relies on database uniqueness constraints.
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

// Input is preserved verbatim; no trimming or uniqueness precheck is applied.
export async function updateUsername(
  deps: { db: AppDatabase },
  params: { actor: LoggedInUser; username: string },
): Promise<void> {
  if (params.username.startsWith('@')) return throwError('PARAMETER_INVALID', { username: '用户名不能以 @ 开头' });
  if (params.username === params.actor.username) return;
  await updateUser(deps.db, { id: params.actor.id, username: params.username });
}

// Signup hints affect new accounts only. Account and session creation are separate writes.
export async function loginWithGitHub(
  deps: { db: AppDatabase; now: () => Date; random: Random },
  params: { githubUser: { id: number; username: string }; signUp?: { username?: string; name?: string } },
): Promise<{ session: Session; token: string }> {
  const identity = { provider: 'github', subject: String(params.githubUser.id) } as const;
  let user = await findUserByIdentity(deps.db, identity);
  if (!user) {
    const username = params.signUp?.username || params.githubUser.username;
    const name = params.signUp?.name || username;
    if (username.startsWith('@')) return throwError('PARAMETER_INVALID', { username: '用户名不能以 @ 开头' });
    user = await createUser(deps.db, { username, name, aboutMe: '', identity });
  }
  return createSession(deps, { userId: user.id });
}
