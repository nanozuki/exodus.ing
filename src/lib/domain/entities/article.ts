import type { IdPath } from '$lib/domain/values/id_path';

export interface Article {
  id: string;
  path: IdPath;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  contentType: ArticleContentType;
  content: string;
  replyTo?: ArticleCard;
  bookmarkCount: number;
}

export type ArticleContentType = 'markdown' | 'external';

export interface ArticleInput {
  title: string;
  authorId: string;
  contentType: ArticleContentType;
  content: string;
  replyToId?: string;
}

export interface ArticlePatch {
  title: string;
  content: string;
}

export interface ArticleCard {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
}

export interface ArticleListItem {
  id: string;
  path: IdPath;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  contentType: ArticleContentType;
  replyTo?: ArticleCard;
  replyCount: number;
  bookmarkCount: number;
  commentCount: number;
}

export interface ArticleFeedsItem {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  authorName: string;
  authorUsername: string;
  contentType: ArticleContentType;
  content: string;
}

export interface ArticleContent {
  id: string;
  title: string;
  content: string;
  contentType: ArticleContentType;
}

export const ARTICLE_PAGE_SIZE = 20;
