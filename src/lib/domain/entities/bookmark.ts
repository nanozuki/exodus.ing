export interface Bookmark {
  userId: string;
  articleId: string;
  createdAt: Date;
}

export interface BookmarkStatus {
  isBookmarked: boolean;
  bookmarkCount: number;
}
