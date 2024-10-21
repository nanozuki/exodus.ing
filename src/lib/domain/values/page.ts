export interface Pagination {
  number: number; // 1-indexed
  size: number;
}

export interface Paginated<T> {
  number: number; // 1-indexed
  total: number;
  items: T[];
}
