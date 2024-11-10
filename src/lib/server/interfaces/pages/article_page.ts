import type { Article, ArticleCard } from '$lib/domain/entities/article';
import type { Comment, CommentInput } from '$lib/domain/entities/comment';
import type { User } from '$lib/domain/entities/user';
import type { ArticleService } from '$lib/domain/services/article';
import type { BookmarkService } from '$lib/domain/services/bookmark';
import type { CommentService, CommentUpdateRequest } from '$lib/domain/services/comment';
import { compileArticle, throwResultError } from '$lib/markdown';
import type { Value } from 'vfile';

export type ArticleView = Omit<Article, 'content'> & {
  content: Value;
  title: string;
};

export type CommentView = Comment & { replyTo?: Comment };

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

export type UserView = {
  id: string;
  username: string;
  name: string;
  isBookmarked: boolean;
};

export interface ArticleData {
  article: ArticleView;
  comments: CommentView[];
  replies: ArticleCard[];
  user?: UserView;
}

export class ArticlePage {
  constructor(
    private readonly article: ArticleService,
    private readonly comment: CommentService,
    private readonly bookmark: BookmarkService,
  ) {}

  async getById(articleId: string, loggedUser?: User): Promise<ArticleData> {
    const [article, isBookmarked, comments, replies] = await Promise.all([
      this.article.getById(articleId),
      loggedUser ? this.bookmark.isBookmarked(articleId, loggedUser.id) : false,
      this.comment.listByArticle(articleId),
      this.article.listReplies(articleId),
    ]);
    const result = await compileArticle(article.content);
    if (!result.ok) {
      return throwResultError(result.errors);
    }
    return {
      article: {
        ...article,
        content: result.value,
        title: result.title,
      },
      comments: commentViews(comments),
      replies,
      user: loggedUser && {
        id: loggedUser.id,
        username: loggedUser.username,
        name: loggedUser.name,
        isBookmarked: isBookmarked,
      },
    };
  }

  async addComment(input: CommentInput): Promise<string> {
    return await this.comment.create(input);
  }

  async editComment(req: CommentUpdateRequest): Promise<void> {
    return await this.comment.update(req);
  }

  async addBookmark(articleId: string, userId: string): Promise<void> {
    return await this.bookmark.addBookmark(articleId, userId);
  }

  async removeBookmark(articleId: string, userId: string): Promise<void> {
    return await this.bookmark.removeBookmark(articleId, userId);
  }
}
