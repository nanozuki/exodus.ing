import type { IdPath } from './id_path';
import type { UserSummary } from './user';

// Content stores Markdown source or the original external URL, according to contentType.
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

// replyCount counts direct responses, excluding deeper descendants.
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
