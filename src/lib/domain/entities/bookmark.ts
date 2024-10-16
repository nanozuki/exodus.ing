export interface Bookmark {
  userId: string;
  articleId: string;
  createdAt: Date;
}

export interface BookmarkInput {
  userId: string;
  articleId: string;
}

export interface BookmarkRepository {
  listByUserId(userId: string): Promise<Bookmark[]>;
  countByArticleId(articleId: string): Promise<number>;
  create(input: BookmarkInput): Promise<void>;
  delete(userId: string, articleId: string): Promise<void>;
}
