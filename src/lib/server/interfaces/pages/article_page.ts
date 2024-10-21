import type { Article, ArticleCard } from '$lib/domain/entities/article';
import type { Comment, CommentInput } from '$lib/domain/entities/comment';
import type { User } from '$lib/domain/entities/user';
import type { ArticleService } from '$lib/domain/services/article';
import type { Value } from 'vfile';
import type { BookmarkService } from '$lib/domain/services/bookmark';
import type { CommentService, CommentUpdateRequest } from '$lib/domain/services/comment';
import { compileArticle, type MarkdownMeta } from '$lib/markdown';

type ArticleView = Omit<Article, 'content'> & {
  content: Value;
  meta: MarkdownMeta;
};

export interface ArticleData {
  article: ArticleView;
  comments: Comment[];
  replies: ArticleCard[];
  user: {
    isAuthor: boolean;
    isBookmarked: boolean;
  };
}

export class ArticlePage {
  constructor(
    private readonly article: ArticleService,
    private readonly comment: CommentService,
    private readonly bookmark: BookmarkService,
  ) {}

  async getById(articleId: string, loggedUser?: User | null): Promise<ArticleData> {
    const [article, isBookmarked, comments, replies] = await Promise.all([
      this.article.getById(articleId),
      loggedUser ? this.bookmark.isBookmarked(articleId, loggedUser.id) : false,
      this.comment.listByArticle(articleId),
      this.article.listReplies(articleId),
    ]);
    const result = await compileArticle(article.content);
    if (!result.ok) {
      return result.error.throw();
    }
    return {
      article: {
        ...article,
        content: result.value,
        meta: result.meta,
      },
      comments,
      replies,
      user: {
        isAuthor: loggedUser ? article.authorId === loggedUser.id : false,
        isBookmarked,
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
