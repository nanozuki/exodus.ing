import { setAuthCookie, readGitHubCallbackData } from '#lib/server/auth.js';
import { adapters, db } from '#lib/server/registry.js';
import { now } from '#lib/server/adapters/clock.js';
import { generateSessionId } from '#lib/server/adapters/session_id.js';
import { loginWithGitHub } from '#lib/server/use-cases/user.js';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET(request: RequestEvent): Promise<Response> {
  const { code, data } = readGitHubCallbackData(request);
  const githubUser = await adapters.githubOAuth.getUser(code);
  const session = await loginWithGitHub({ db, now, generateSessionId }, { githubUser, signUp: data.signUp });
  setAuthCookie(request.cookies, session);
  return new Response(null, { status: 302, headers: { Location: data.next?.startsWith('/') ? data.next : '/' } });
}
