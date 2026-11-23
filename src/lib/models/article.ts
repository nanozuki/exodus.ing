import type { IdPath } from './id_path';
import type { UserSummary } from './user';

/**
 * `content` holds the Markdown source or the original external URL, according to `contentType`. `replyTo` is the
 * direct parent article, when there is one. `author` reflects the author's current user record.
 */
export interface Article {
  id: string;
  path: IdPath;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  author: UserSummary;
  contentType: ArticleContentType;
  content: string;
  replyTo?: ArticleSummary;
}

export type ArticleContentType = 'markdown' | 'external';

export interface ArticleSummary {
  id: string;
  title: string;
  author: UserSummary;
}

/**
 * The interaction counts are persisted projections. `replyCount` counts direct reply articles, excluding deeper
 * descendants.
 */
export interface ArticleListItem {
  id: string;
  path: IdPath;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  author: UserSummary;
  contentType: ArticleContentType;
  content: string;
  replyTo?: ArticleSummary;
  replyCount: number;
  bookmarkCount: number;
  commentCount: number;
}

export interface ArticleFeedsItem {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  author: UserSummary;
  contentType: ArticleContentType;
  content: string;
}

export interface ArticleContent {
  id: string;
  title: string;
  content: string;
  contentType: ArticleContentType;
}
