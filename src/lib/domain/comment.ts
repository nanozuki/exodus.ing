import type { Article } from './article';
import type { IdPath } from './values';

export interface Comment {
  id: string;
  path: IdPath;
  createdAt: Date;
  updatedAt: Date;
  articleId: string;
  userId: string;
  content: string;
}

export interface ArticleInteractions {
  comments: Comment[];
  bookmarksCount: number;
  replyTo?: Article;
  repliesCount: number;
}
