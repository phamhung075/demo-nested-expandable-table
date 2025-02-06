import { ValidatorFn } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { WritableSignal } from '@angular/core';
import { IOption } from './options.interface';

export interface IFormBase {
  classDescription?: string;
  options?: (IOption | undefined)[];
  filteredOptions?: Observable<(IOption | undefined)[]>;
  loading?: boolean;

  form?: FormGroup;
  photoUrlField?: string;
  _formalizer?: (element: any) => void;
  // add nested values
  [key: string]: any;
}
