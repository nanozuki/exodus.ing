import { catchError, throwAppError } from '$lib/errors';
import { services } from '$lib/server/registry';
import { type RequestEvent } from '@sveltejs/kit';

export async function GET(request: RequestEvent): Promise<Response> {
  try {
    const data = await services.auth.handleGithubCallback(request);
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
