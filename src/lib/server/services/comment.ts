import { COMMENT_PAGE_SIZE } from '$lib/domain/entities/comment';
import type { Comment, CommentInput, CommentListItem, CommentView } from '$lib/domain/entities/comment';
import type { Paginated } from '$lib/domain/values/page';
import { throwError } from '$lib/errors';
import { repositories } from '$lib/server/registry';

function commentViews(comments: Comment[]): CommentView[] {
  const map = new Map<string, Comment>();
  for (const comment of comments) {
    map.set(comment.id, comment);
  }
  const views: CommentView[] = [];
  for (const comment of comments) {
    if (comment.path.length === 1) {
      views.push(comment);
    } else {
      const replyTo = map.get(comment.path[comment.path.length - 2]);
      views.push({ ...comment, replyTo });
    }
  }
  return views;
}

export class CommentService {
  constructor() {}

  async listByArticle(articleId: string): Promise<CommentView[]> {
    const comments = await repositories.comment.listByArticle(articleId);
    return commentViews(comments);
  }

  async listByUser(userId: string, pageNumber: number): Promise<Paginated<CommentListItem>> {
    return await repositories.comment.listByUser(userId, { pageNumber, pageSize: COMMENT_PAGE_SIZE });
  }

  async create(comment: CommentInput): Promise<string> {
    return await repositories.comment.create(comment);
  }

  async update(req: CommentUpdateRequest): Promise<void> {
    const comment = await repositories.comment.getById(req.commentId);
    if (comment.author.id !== req.userId) {
      return throwError('BAD_REQUEST', '只能编辑自己的评论');
    }
    return await repositories.comment.update(req.commentId, { content: req.content });
  }
}

export interface CommentUpdateRequest {
  userId: string;
  commentId: string;
  content: string;
}
