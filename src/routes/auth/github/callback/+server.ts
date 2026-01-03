import { catchError, throwAppError } from '$lib/errors';
import { services } from '$lib/server/registry';
import { type RequestEvent } from '@sveltejs/kit';

export async function GET(request: RequestEvent): Promise<Response> {
  try {
    const result = await services.auth.handleGithubCallback(request);
    if (result.type === 'register') {
      // New user: redirect to registration page to complete signup
      const registerUrl = new URL('/auth/register', request.url);
      if (result.next) {
        registerUrl.searchParams.set('next', result.next);
      }
      return new Response(null, {
        status: 302,
        headers: {
          Location: registerUrl.toString(),
        },
      });
    }
    // Existing user: login and redirect
    const nextUrl = result.next?.startsWith('/') && !result.next.startsWith('//') ? result.next : '/';
    return new Response(null, {
      status: 302,
      headers: {
        Location: nextUrl,
      },
    });
  } catch (e) {
    const err = catchError(e);
    throwAppError(err);
  }
}
