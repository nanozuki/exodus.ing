import { AppError } from '$lib/errors';
import { type RequestEvent } from '@sveltejs/kit';

export async function GET({ locals, url }: RequestEvent): Promise<Response> {
  const code = url.searchParams.get('code');
  const stateId = url.searchParams.get('state');
  if (!code || !stateId) {
    return AppError.OAuthValidationError('code or state is empty').throw();
  }

  const state = await locals.authPage.handleGithubCallback(code, stateId);

  return new Response(null, {
    status: 302,
    headers: {
      Location: state.next?.startsWith('/') ? state.next : '/',
    },
  });
}
