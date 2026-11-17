import { setAuthCookie, readGitHubCallbackData, sanitizeNext } from '#lib/server/auth.js';
import { getConfig } from '#lib/server/config.js';
import { adapters, db } from '#lib/server/registry.js';
import { now } from '#lib/server/adapters/clock.js';
import { random } from '#lib/server/adapters/random.js';
import { loginWithGitHub } from '#lib/server/use-cases/user.js';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET(request: RequestEvent): Promise<Response> {
  const { code, data } = readGitHubCallbackData(request);
  const githubUser = await adapters.githubOAuth.getUser(code);
  const { session, token } = await loginWithGitHub({ db, now, random }, { githubUser, signUp: data.signUp });
  setAuthCookie(request.cookies, { token, expiresAt: session.expiresAt });
  const location = sanitizeNext(data.next, getConfig().appUrl);
  return new Response(null, { status: 302, headers: { Location: location } });
}
