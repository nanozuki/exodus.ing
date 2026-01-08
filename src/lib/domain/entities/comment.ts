import type { IdPath } from '$lib/domain/values/id_path';
import type { Author } from '../values/author';
import type { ArticleCard } from './article';

export interface Comment {
  id: string;
  path: IdPath;
  createdAt: Date;
  updatedAt: Date;
  articleId: string;
  author: Author;
  content: string;
}

export type CommentView = Comment & { replyTo?: Comment };

export interface CommentCard {
  id: string;
  updatedAt: Date;
  content: string;
}

export interface CommentListItem {
  article: ArticleCard;
  comments: CommentCard[];
}

export interface CommentInput {
  articleId: string;
  userId: string;
  content: string;
  replyToId?: string;
}

export interface CommentPatch {
  content: string;
}

export const COMMENT_PAGE_SIZE = 20;
