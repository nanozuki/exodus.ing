import { AppError } from '$lib/errors';
import { type RequestEvent } from '@sveltejs/kit';

export async function GET({ locals, url }: RequestEvent): Promise<Response> {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) {
    return AppError.OAuthValidationError('code or state is empty').throw();
  }

  await locals.auth.handleGithubCallback(code, state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
    },
  });
}
