import type { IdPath } from './id_path';
import type { UserSummary } from './user';
import type { ArticleSummary } from './article';

/** `content` is plain text; render its line breaks without interpreting HTML or Markdown. */
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

/**
 * A page of a user's comments grouped by their article. Pagination counts individual comments, so the same article
 * group may recur on another page.
 */
export interface CommentListItem {
  article: ArticleSummary;
  comments: CommentSummary[];
}
