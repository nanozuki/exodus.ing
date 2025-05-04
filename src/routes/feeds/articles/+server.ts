import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
  const feed = await locals.feedsPage.getFeeds();
  return json(feed);
};
