import type { IdPath } from '$lib/domain/values/id_path';
import type { Paginated, Pagination } from '$lib/domain/values/page';

export interface Article {
  id: string;
  path: IdPath;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  authorName: string;
  authorUsername: string;
  contentType: ArticleContentType;
  content: string;
  replyTo?: ArticleBadge;
}

export type ArticleContentType = 'markdown' | 'external_link';

export interface ArticleInput {
  title: string;
  userId: string;
  contentType: ArticleContentType;
  content: string;
  replyTo?: string;
}

export interface ArticlePatch {
  title: string;
  content: string;
}

export interface ArticleBadge {
  id: string;
  title: string;
  authorName: string;
  authorUsername: string;
}

export interface ArticleListItem {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  authorName: string;
  authorUsername: string;
  contentType: ArticleContentType;
  replyTo?: ArticleBadge;
  replyCount: number;
  bookmarkCount: number;
  commentCount: number;
}

export interface ArticleRepository {
  getById(articleId: string): Promise<Article>;
  list(page: Pagination): Promise<Paginated<ArticleListItem>>;
  listByUserId(userId: string, page: Pagination): Promise<Paginated<ArticleListItem>>;
  create(input: ArticleInput): Promise<string>;
  update(articleId: string, patch: Partial<ArticlePatch>): Promise<void>;
}
