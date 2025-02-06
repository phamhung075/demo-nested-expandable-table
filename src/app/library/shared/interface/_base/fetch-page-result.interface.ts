export interface IFetchPageResult<T> {
  data: T[];
  total: number;
  count: number;
  page: number;
  totalPages: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  sortField: string;
  sortDirection: 'asc' | 'desc';
}
