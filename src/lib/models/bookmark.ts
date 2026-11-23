/**
 * `count` is the article's number of bookmark relationships, duplicates included. `bookmarked` is null for an
 * anonymous viewer; otherwise it tells whether the viewer has at least one bookmark on the article.
 */
export interface BookmarkState {
  articleId: string;
  count: number;
  bookmarked: boolean | null;
}
