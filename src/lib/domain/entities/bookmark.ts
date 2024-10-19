export interface Bookmark {
  userId: string;
  articleId: string;
  createdAt: Date;
}

export interface BookmarkRepository {
  listByUserId(userId: string): Promise<Bookmark[]>;
  isBookmarked(articleId: string, userId: string): Promise<boolean>;
  create(userId: string, articleId: string): Promise<void>;
  delete(userId: string, articleId: string): Promise<void>;
}
