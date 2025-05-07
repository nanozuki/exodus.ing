import { AppError } from '$lib/errors';
import { type RequestEvent } from '@sveltejs/kit';

export async function GET({ locals, url }: RequestEvent): Promise<Response> {
  const code = url.searchParams.get('code');
  const stateId = url.searchParams.get('state');
  console.log('code', code, 'stateId', stateId);
  if (!code || !stateId) {
    return AppError.OAuthValidationError('code or state is empty').throw();
  }

  try {
    const state = await locals.auth.handleGithubCallback(code, stateId);
    return new Response(null, {
      status: 302,
      headers: {
        Location: state.next?.startsWith('/') ? state.next : '/',
      },
    });
  } catch (e) {
    return AppError.catch(e).throw();
  }
}
