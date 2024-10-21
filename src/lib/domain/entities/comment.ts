import type { IdPath } from '$lib/domain/values/id_path';

export interface Comment {
  id: string;
  path: IdPath;
  createdAt: Date;
  updatedAt: Date;
  articleId: string;
  userId: string;
  content: string;
}

export interface CommentInput {
  articleId: string;
  userId: string;
  content: string;
  replyTo?: string;
}

export interface CommentPatch {
  content: string;
}

export interface CommentRepository {
  listByArticle(articleId: string): Promise<Comment[]>;
  getById(commentId: string): Promise<Comment>;
  create(comment: CommentInput): Promise<string>;
  update(commentId: string, patch: Partial<CommentPatch>): Promise<void>;
}