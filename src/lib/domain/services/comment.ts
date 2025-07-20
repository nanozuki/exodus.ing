import type {
  Comment,
  CommentInput,
  CommentListItem,
  CommentRepository,
  CommentView,
} from '$lib/domain/entities/comment';
import type { Paginated } from '$lib/domain/values/page';
import { throwError } from '$lib/errors';

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

export const COMMENT_PAGE_SIZE = 20;

export class CommentService {
  constructor(private repository: CommentRepository) {}

  async listByArticle(articleId: string): Promise<CommentView[]> {
    const comments = await this.repository.listByArticle(articleId);
    return commentViews(comments);
  }

  async listByUser(userId: string, pageNumber: number): Promise<Paginated<CommentListItem>> {
    return await this.repository.listByUser(userId, { pageNumber, pageSize: COMMENT_PAGE_SIZE });
  }

  async create(comment: CommentInput): Promise<string> {
    return await this.repository.create(comment);
  }

  async update(req: CommentUpdateRequest): Promise<void> {
    const comment = await this.repository.getById(req.commentId);
    if (comment.author.id !== req.userId) {
      return throwError('BAD_REQUEST', '只能编辑自己的评论');
    }
    return await this.repository.update(req.commentId, { content: req.content });
  }
}

export interface CommentUpdateRequest {
  userId: string;
  commentId: string;
  content: string;
}
