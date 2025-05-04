import type { ArticleRepository, ArticleFeedsItem } from '$lib/domain/entities/article';
import { compileMarkdown } from '$lib/markdown';
import { formatRFC3339 } from 'date-fns';

const feed = {
  version: 'https://jsonfeed.org/version/1.1',
  title: 'Exodus 文章',
  home_page_url: 'https://exodus.ing/',
  feed_url: 'https://exodus.ing/a/feed.json',
  icon: 'https://exodus.ing/icon.svg',
  language: 'zh-CN',
  items: [] as FeedItem[],
};

export type Feed = typeof feed;

interface Author {
  name?: string;
  url?: string;
}

interface FeedItem {
  id: string;
  url: string;
  external_url?: string;
  title: string;
  content_html: string;
  summary?: string;
  date_published: string; // RFC 3339 format
  date_modified?: string; // RFC 3339 format
  authors?: Author[];
}

async function convertToFeedItem(article: ArticleFeedsItem): Promise<FeedItem> {
  const content_html = (await compileMarkdown(article.content)).toString();
  return {
    id: article.id,
    url: `https://exodus.ing/a/${article.id}`,
    title: article.title,
    content_html,
    date_published: formatRFC3339(article.createdAt),
    date_modified: formatRFC3339(article.updatedAt),
    authors: [
      {
        name: article.authorName,
        url: `https://exodus.ing/u/${article.authorUsername}`,
      },
    ],
  };
}

export class FeedsService {
  constructor(private repository: ArticleRepository) {}

  async getArticlesFeed(last: number): Promise<Feed> {
    const articles = await this.repository.listFeeds(last);
    const items: FeedItem[] = await Promise.all(articles.map((article) => convertToFeedItem(article)));
    return { ...feed, items };
  }
}
