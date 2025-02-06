import { Observable } from 'rxjs';
import { IFetchPageResult } from '../library/shared/interface/_base/fetch-page-result.interface';

export interface IBaseCRUDService<T> {
  className: string;

  fetchPage(
    filterText?: string,
    page?: number,
    pageSize?: number,
    sortField?: string,
    sortDirection?: 'asc' | 'desc'
  ): Observable<IFetchPageResult<Partial<T>>>;
  read(id: string): Observable<Partial<T>>;
  create(element: T): Observable<Partial<T>>;
  update(element: Partial<T> & { id?: string }): Observable<boolean>;
  delete(id: string): Observable<boolean>;
}

export abstract class _BaseCRUDService<T>
  implements Partial<IBaseCRUDService<T>>
{
  abstract className: string;
  // to be implemented for send request to server
}
