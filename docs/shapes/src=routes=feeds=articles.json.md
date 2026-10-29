# src/routes/feeds/articles.json

Expose the public JSON Feed endpoint, converting recent article records to feed
metadata and HTML without fetching linked external articles.

## Files

### `src/routes/feeds/articles.json/+server.ts`

Supporting types and declarations used by the public signatures below (not
additional exports):

```typescript
declare const feed: {
  version: string;
  title: string;
  home_page_url: string;
  feed_url: string;
  icon: string;
  language: string;
  items: FeedItem[];
};

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
  date_published: string;
  date_modified?: string;
  author?: Author;
  authors?: Author[];
}
```

#### `Feed`

```typescript
export type Feed = typeof feed;
```

Expose the JSON Feed 1.1 metadata structure with FeedItem author/date/link
fields. Current site URLs are hardcoded to https://exodus.ing and language is
zh-CN, independently of APP_URL.

#### `GET`

```typescript
export declare const GET: RequestHandler;
```

Call `listArticleFeeds(db, { pageNumber: 1, pageSize: 30 })` and consume its
`items` to read at most 30 articles ordered by updatedAt descending. Convert
Markdown through compileMarkdown (retaining its H1), or construct an
external-content notice/link without fetching the page. Map the
ArticleFeedsItem.author UserSummary into the feed-local Author structure using
its name and profile URL. Include both author and authors, RFC3339 timestamps,
and external_url only for external records. Return application/feed+json with
`Cache-Control: public, max-age=7200`. Read/conversion failures propagate.
External URL HTML interpolation is not separately escaped.
