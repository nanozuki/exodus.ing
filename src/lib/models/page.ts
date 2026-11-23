/** `pageNumber` is one-based. Nothing validates these values; callers and query boundaries decide what to accept. */
export interface Pagination {
  pageNumber: number;
  pageSize: number;
}

/**
 * `pageNumber` and `pageSize` echo the requested page, `count` is the total number of matching records before
 * pagination, and `items` is the selected page. When records are grouped, as in `CommentListItem`, `items` can be
 * shorter than `pageSize` because `pageSize` and `count` still count the raw records.
 */
export interface Paginated<T> {
  pageNumber: number;
  pageSize: number;
  count: number;
  items: T[];
}
