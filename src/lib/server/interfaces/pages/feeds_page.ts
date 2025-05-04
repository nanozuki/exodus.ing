import type { Feed, FeedsService } from '$lib/domain/services/feeds';

export class FeedsPage {
  constructor(private readonly feeds: FeedsService) {}

  async getFeeds(): Promise<Feed> {
    return await this.feeds.getArticlesFeed(50);
  }
}
