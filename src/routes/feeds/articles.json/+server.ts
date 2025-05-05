import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
  const feed = await locals.feedsPage.getFeeds();
  return Response.json(feed, {
    headers: {
      'Content-Type': 'application/feed+json',
      'Cache-Control': 'public, max-age=7200',
    },
  });
};
