import { catchError, throwAppError, throwError } from '$lib/errors';
import { services } from '$lib/server/registry';
import { type RequestEvent } from '@sveltejs/kit';

export async function GET({ url, cookies }: RequestEvent): Promise<Response> {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) {
    return throwError('BAD_REQUEST', 'OAuth 验证错误: code or state is empty');
  }
  try {
    const stateObj = await services.auth.handleGithubCallback(cookies, code, state);
    return new Response(null, {
      status: 302,
      headers: {
        Location: stateObj.next?.startsWith('/') ? stateObj.next : '/',
      },
    });
  } catch (e) {
    const err = catchError(e);
    throwAppError(err);
  }
}
