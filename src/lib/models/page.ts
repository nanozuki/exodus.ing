// pageNumber is one-based; callers validate the page and size.
export interface Pagination {
  pageNumber: number;
  pageSize: number;
}

// count is the total matching record count before pagination.
export interface Paginated<T> {
  pageNumber: number;
  pageSize: number;
  count: number;
  items: T[];
}
