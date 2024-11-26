export interface Pagination {
  pageNumber: number; // 1-indexed
  pageSize: number;
}

export interface Paginated<T> {
  pageNumber: number; // 1-indexed
  count: number;
  items: T[];
}
