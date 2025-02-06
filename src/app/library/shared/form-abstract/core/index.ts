import { ChangeDetectorRef, signal } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { _ParseUtilsAbstract } from '../../../../utils/parse-utils.abstract';

export abstract class _FormBase extends _ParseUtilsAbstract {
  abstract classDescription: string; // Subclasses must define their Class Description for messages
  abstract form: FormGroup;
  _testView$S = signal<boolean>(false); // use signal à la place
  isLoading$S = signal<boolean>(false);
  _isEdit: boolean = true;

  constructor(changeDetectorRef: ChangeDetectorRef) {
    super(changeDetectorRef);
  }

  setControlNoteditable(controlName: string): void {
    const control = this.form.get(controlName);
    control?.disable({ emitEvent: true });
    control?.clearValidators();
    control?.updateValueAndValidity({ emitEvent: true });
    control?.markAsTouched({ onlySelf: false });
    this.changeDetectorRef.markForCheck();
  }

  setControlEditable(controlName: string, isRequired: boolean = false): void {
    const control = this.form.get(controlName);
    control?.enable({ emitEvent: true });
    if (isRequired) {
      control?.setValidators(Validators.required);
    }
    control?.updateValueAndValidity({ emitEvent: true });
    control?.markAsTouched({ onlySelf: false });
    this.changeDetectorRef.markForCheck();
  }
}
