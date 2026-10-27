// Count includes duplicate relationships. Anonymous viewers have bookmarked=null.
export interface BookmarkState {
  articleId: string;
  count: number;
  bookmarked: boolean | null;
}
