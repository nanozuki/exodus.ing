import type { RequestHandler } from '@sveltejs/kit';

// Reports HTTP server availability without querying external services.
export const GET: RequestHandler = () => new Response(null, { status: 200 });
