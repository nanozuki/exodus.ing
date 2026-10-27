import type { IdPath } from './id_path';
import type { UserSummary } from './user';
import type { ArticleSummary } from './article';

// Content is plain text; render line breaks without interpreting HTML or Markdown.
export interface Comment {
  id: string;
  path: IdPath;
  createdAt: Date;
  updatedAt: Date;
  articleId: string;
  author: UserSummary;
  content: string;
}

export interface CommentSummary {
  id: string;
  updatedAt: Date;
  content: string;
}

// Pagination counts individual comments; the same article group may recur on another page.
export interface CommentListItem {
  article: ArticleSummary;
  comments: CommentSummary[];
}
