import type { Article, ArticleBadge } from '$lib/domain/entities/article';
import type { ArticleService } from '$lib/domain/services/article';
// import type { ArticleReplyService } from '$lib/domain/services/article_reply';
// import type { BookmarkService } from '$lib/domain/services/bookmark';
// import type { CommentService } from '$lib/domain/services/comment';

export interface ArticleData {
  article: Article;
  bookmarkCount: number;
  comments: Comment;
  replies: ArticleBadge[];
}

export class ArticlePage {
  constructor(
    private readonly article: ArticleService,
    // private readonly comment: CommentService,
    // private readonly bookmark: BookmarkService,
    // private readonly reply: ArticleReplyService,
  ) {}

  async getById(articleId: string): Promise<Article> {
    return await this.article.getById(articleId);
  }
}
