import type { RequestHandler } from '@sveltejs/kit';

/**
 * Returns 200 with an empty body. The server hook resolves this path before canonical-origin redirects and
 * authentication.
 */
export const GET: RequestHandler = () => new Response(null, { status: 200 });
