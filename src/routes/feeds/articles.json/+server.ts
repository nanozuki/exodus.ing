import { services } from '$lib/server/registry';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  const feed = await services.feeds.getArticlesFeed();
  return Response.json(feed, {
    headers: {
      'Content-Type': 'application/feed+json',
      'Cache-Control': 'public, max-age=7200',
    },
  });
};
