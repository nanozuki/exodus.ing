import type { Comment, CommentInput, CommentRepository } from '$lib/domain/entities/comment';
import { AppError } from '$lib/errors';

export class CommentService {
  constructor(private repository: CommentRepository) {}

  async listByArticle(articleId: string): Promise<Comment[]> {
    return await this.repository.listByArticle(articleId);
  }

  async create(comment: CommentInput): Promise<string> {
    return await this.repository.create(comment);
  }

  async update(req: CommentUpdateRequest): Promise<void> {
    const comment = await this.repository.getById(req.commentId);
    if (comment.author.id !== req.userId) {
      return AppError.Forbidden('Only the author can edit the comment').throw();
    }
    return await this.repository.update(req.commentId, { content: req.content });
  }
}

export interface CommentUpdateRequest {
  userId: string;
  commentId: string;
  content: string;
}
