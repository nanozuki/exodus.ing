import { setAuthCookie } from '$lib/domain/entities/session';
import type { OAuthCookieData } from '$lib/domain/values/auth';
import { catchError, throwAppError, throwError } from '$lib/errors';
import { adapters, repositories } from '$lib/server/registry';
import { type RequestEvent } from '@sveltejs/kit';

async function handleGithubCallback(request: RequestEvent): Promise<OAuthCookieData> {
  const { user: ghUser, data: cookieData } = await adapters.githubOAuth.handleCallback(request);
  const { cookies } = request;
  let user = await repositories.user.findByGitHubId(ghUser.id);
  if (!user) {
    // New user, create user from OAuth data.
    const username = cookieData.signUp?.username || ghUser.username;
    const name = cookieData.signUp?.name || username;
    if (username.startsWith('@')) {
      return throwError('PARAMETER_INVALID', { username: '用户名不能以 @ 开头' });
    }
    user = await repositories.user.create({
      username,
      name,
      githubId: ghUser.id,
      aboutMe: '',
    });
  }
  const session = await repositories.session.create(user.id);
  setAuthCookie(cookies, session);
  return cookieData;
}

export async function GET(request: RequestEvent): Promise<Response> {
  try {
    const data = await handleGithubCallback(request);
    return new Response(null, {
      status: 302,
      headers: {
        Location: data.next?.startsWith('/') ? data.next : '/',
      },
    });
  } catch (e) {
    const err = catchError(e);
    throwAppError(err);
  }
}
