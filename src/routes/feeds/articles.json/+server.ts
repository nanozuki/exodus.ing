import { listArticleFeeds } from '$lib/server/repositories/article';
import type { ArticleFeedsItem } from '$lib/models/article';
import { compileMarkdown } from '$lib/markdown';
import { db } from '$lib/server/registry';
import { formatRFC3339 } from 'date-fns';
import type { RequestHandler } from '@sveltejs/kit';

const feed = {
  version: 'https://jsonfeed.org/version/1.1',
  title: 'Exodus 文章',
  home_page_url: 'https://exodus.ing/',
  feed_url: 'https://exodus.ing/feeds/articles.json',
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
  // Both dates use RFC 3339.
  date_published: string;
  date_modified?: string;
  // Keep the singular author field for older feed readers.
  author?: Author;
  authors?: Author[];
}

async function convertToFeedItem(article: ArticleFeedsItem): Promise<FeedItem> {
  const content_html =
    article.contentType === 'markdown'
      ? (await compileMarkdown(article.content)).toString()
      : `<p>此文章发表于站外</p>
<a href=${article.content} target="_blank" rel="noopener noreferrer" class="underline">点此阅读原文</a>`;
  const external_url = article.contentType === 'markdown' ? undefined : article.content;
  return {
    id: article.id,
    url: `https://exodus.ing/a/${article.id}`,
    title: article.title,
    content_html,
    external_url,
    date_published: formatRFC3339(article.createdAt),
    date_modified: formatRFC3339(article.updatedAt),
    author: {
      name: article.author.name,
      url: `https://exodus.ing/u/@${article.author.username}`,
    },
    authors: [
      {
        name: article.author.name,
        url: `https://exodus.ing/u/@${article.author.username}`,
      },
    ],
  };
}

const FEED_ARTICLE_LIMIT = 30;

export const GET: RequestHandler = async () => {
  const { items: articles } = await listArticleFeeds(db, { pageNumber: 1, pageSize: FEED_ARTICLE_LIMIT });
  const items: FeedItem[] = await Promise.all(articles.map((article) => convertToFeedItem(article)));
  const result = { ...feed, items };
  return Response.json(result, {
    headers: {
      'Content-Type': 'application/feed+json',
      'Cache-Control': 'public, max-age=7200',
    },
  });
};
