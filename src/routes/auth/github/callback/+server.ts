import { setAuthCookie, readGitHubCallbackData } from '$lib/server/auth';
import { catchError, throwAppError } from '$lib/errors';
import { adapters, db } from '$lib/server/registry';
import { now } from '$lib/server/adapters/clock';
import { generateSessionId } from '$lib/server/adapters/session_id';
import { loginWithGitHub } from '$lib/server/use-cases/user';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET(request: RequestEvent): Promise<Response> {
  try {
    const { code, data } = readGitHubCallbackData(request);
    const githubUser = await adapters.githubOAuth.getUser(code);
    const session = await loginWithGitHub({ db, now, generateSessionId }, { githubUser, signUp: data.signUp });
    setAuthCookie(request.cookies, session);
    return new Response(null, { status: 302, headers: { Location: data.next?.startsWith('/') ? data.next : '/' } });
  } catch (error) {
    throwAppError(catchError(error));
  }
}
