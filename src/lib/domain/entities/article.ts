import type { IdPath } from '$lib/domain/values/id_path';
import type { Paginated, Pagination } from '$lib/domain/values/page';

export interface Article {
  id: string;
  path: IdPath;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  author: ArticleAuthor;
  contentType: ArticleContentType;
  content: string;
}

export type ArticleContentType = 'markdown' | 'external_link';

export interface ArticleAuthor {
  userId: string;
  username: string;
  name: string;
}

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

export interface ArticleRepository {
  getById(articleId: string): Promise<Article>;
  list(page: Pagination): Promise<Paginated<Article>>;
  listByUserId(userId: string, page: Pagination): Promise<Paginated<Article>>;
  getByPath(path: IdPath): Promise<Article | null>;
  listByPathPrefix(prefix: IdPath): Promise<Article[]>;

  create(input: ArticleInput): Promise<string>;
  update(articleId: string, patch: Partial<ArticlePatch>): Promise<void>;
}
