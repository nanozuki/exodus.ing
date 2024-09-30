export interface Article {
  id: string;
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
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  userId: string;
  contentType: ArticleContentType;
  content: string;
}

export interface ArticlePatch {
  updatedAt: Date;
  title: string;
  content: string;
}

export interface ArticleRepository {
  getById(articleId: string): Promise<Article>;
  list(limit: number, offset: number): Promise<Article[]>;
  listByUserId(userId: string, limit: number, offset: number): Promise<Article[]>;

  generateId(): Promise<string>;
  create(article: ArticleInput): Promise<void>;
  update(articleId: string, patch: Partial<ArticlePatch>): Promise<void>;
}
