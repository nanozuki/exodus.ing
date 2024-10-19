import type { CommentInput, CommentRepository } from '$lib/domain/entities/comment';
import type { Comment } from '$lib/domain/entities/comment';
import { AppError } from '$lib/errors';

export class CommentService {
  constructor(private repository: CommentRepository) {}

  async listByArticle(articleId: string): Promise<Comment[]> {
    return this.repository.listByArticle(articleId);
  }

  async create(comment: CommentInput): Promise<string> {
    return this.repository.create(comment);
  }

  async update(req: CommentUpdateRequest): Promise<void> {
    const comment = await this.repository.getById(req.commentId);
    if (comment.userId !== req.userId) {
      return AppError.Forbidden('Only the author can edit the comment').throw();
    }
    return this.repository.update(req.commentId, { content: req.content });
  }
}

export interface CommentUpdateRequest {
  userId: string;
  commentId: string;
  content: string;
}
