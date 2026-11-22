import { setAuthCookie, readGitHubCallbackData, sanitizeNext } from '#lib/server/auth.js';
import { getConfig } from '#lib/server/config.js';
import { adapters, db } from '#lib/server/registry.js';
import { now } from '#lib/server/adapters/clock.js';
import { random } from '#lib/server/adapters/random.js';
import { loginWithGitHub } from '#lib/server/use-cases/user.js';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Validates the callback's code and state (the state cookie is deleted on every path), fetches the GitHub identity,
 * and signs in or creates the account with `loginWithGitHub` using the signup hints from the state. It then sets the
 * auth cookie and redirects 302 to the sanitized `next`. User and session creation do not share a transaction.
 * Failures propagate to SvelteKit's default error handling.
 */
export async function GET(request: RequestEvent): Promise<Response> {
  const { code, data } = readGitHubCallbackData(request);
  const githubUser = await adapters.githubOAuth.getUser(code);
  const { session, token } = await loginWithGitHub({ db, now, random }, { githubUser, signUp: data.signUp });
  setAuthCookie(request.cookies, { token, expiresAt: session.expiresAt });
  const location = sanitizeNext(data.next, getConfig().appUrl);
  return new Response(null, { status: 302, headers: { Location: location } });
}
