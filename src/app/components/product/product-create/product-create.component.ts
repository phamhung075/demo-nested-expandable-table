import { CommonModule } from '@angular/common';
import {
  InjectionToken,
  Injectable,
  ChangeDetectorRef,
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  OnInit,
  Inject,
  OnDestroy,
  signal,
  model,
  WritableSignal,
  SecurityContext,
} from '@angular/core';
import {
  FormGroup,
  Validators,
  FormBuilder,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom, Observable, Subject, takeUntil } from 'rxjs';
import { _FormBase } from '../../../library/shared/form-abstract/core';
import { ProductService } from '../../../services/product/product.service';
import { EditStateService } from '../../../services/_core/edit-state/edit-state.service';
import { IProduct } from '../../../library/shared/interface/Product.interface';
import { IFormBase } from '../../../library/shared/interface/_base/form-base.interface';
import { IOption } from '../../../library/shared/interface/_base/options.interface';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Enum__Product_Status } from '../../../library/shared/enum/Enum__Product-Status';
import { DomSanitizer } from '@angular/platform-browser';

interface IAlias extends IProduct {}

export const Product__FORM_BASE_CONFIG = new InjectionToken<IFormBase>(
  'Product_FormBase'
);

@Injectable({
  providedIn: 'root',
})
export class Product_FormBase extends _FormBase implements IFormBase {
  classDescription: string = "L'Product";
  photoUrlField = 'logo';
  //autocomplete
  options: (IOption | undefined)[] = []; // Commencez avec une liste vide
  filteredOptions: Observable<(IOption | undefined)[]> = new Observable<
    (IOption | undefined)[]
  >();
  loading = false;

  pageSize = 20;
  IOption__Product_Status: IOption[] =
    this._convertEnumToIOptions(Enum__Product_Status);

  form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    protected toastrService: ToastrService,
    changeDetectorRef: ChangeDetectorRef
  ) {
    super(changeDetectorRef);

    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      status: ['', Validators.required],
      active: [true],
    });
  }

  /**
   * Converts the given `IAlias` element to a specific format.
   * @param element - The `IAlias` element to be converted.
   */
  _formalizer(element: Partial<IAlias>): void {
    if (element) {
      // do some thing before send to server
    }
  }
}

@Component({
  selector: 'create-product',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    FormsModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],

  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-create.component.html',
  styleUrl: './product-create.component.scss',
})
export class ProductCreateComponent
  extends Product_FormBase
  implements OnInit, OnDestroy
{
  isSubmitting = false;
  private destroy$ = new Subject<void>();
  showInfo$S = signal(false);
  isAnnuled$M = model(false);
  logoImage = signal<string>('/assets/images/no-logo.png');

  constructor(
    formBuilder: FormBuilder, // Inject FormBuilder here
    toastrService: ToastrService,
    changeDetectorRef: ChangeDetectorRef,
    private aliasService: ProductService,
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private dialogRef: MatDialogRef<ProductCreateComponent>,
    private editStateSrv: EditStateService
  ) {
    super(formBuilder, toastrService, changeDetectorRef);
  }

  async ngOnInit(): Promise<void> {
    if (this.data) {
      this.setTestView(this.data._testView ?? false);
    }
    this.initForm();
    this.changeDetectorRef.detectChanges();
  }

  initForm(): void {
    // example this.form?.get('contactPresident')?.disable({ emitEvent: true });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTestView(value: boolean) {
    this._testView$S.set(value);
    if (this._testView$S())
      console.log('_testView.createForm Entrerprise_CdkDialogCreate Loaded');
    this.changeDetectorRef.markForCheck();
  }

  async onNoClick(): Promise<void> {
    this.isLoading$S.set(true);
    this.isAnnuled$M.set(true);
    setTimeout(async () => {
      this.form?.reset();
      this.dialogRef?.close(null);
      this.isLoading$S.set(false);
    }, 1000);
    this.editStateSrv.next(false);
  }

  async onSubmit(): Promise<void> {
    if (this.form.valid) {
      this.isSubmitting = true;
      this.isLoading$S.set(true);

      try {
        const element = this.form.value as IAlias;
        await firstValueFrom(this.aliasService.create(element));
        this.toastrService.success(
          `${this.classDescription} a bien été créé`,
          'Succès'
        );
        this.dialogRef.close(true); // Signal successful creation
      } catch (error) {
        console.error(`Error creating ${this.classDescription}: `, error);
        this.toastrService.error(
          'Une erreur est survenue, veuillez réessayer',
          'Erreur'
        );
      } finally {
        this.isSubmitting = false;
        this.isLoading$S.set(false);
      }
    }
  }

  async create(element: Partial<IAlias>): Promise<void> {
    const sanitizedElement = Object.entries(element).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]:
          typeof value === 'string'
            ? this.sanitizer.sanitize(SecurityContext.HTML, value) || ''
            : value,
      }),
      {} as Partial<IAlias>
    );

    this._formalizer(sanitizedElement);

    try {
      if (await this.aliasService.create(sanitizedElement)) {
        this._isEdit = false;
        this.toastrService.success(
          `${this.classDescription} a bien été créée`,
          'Succès'
        );
      }
    } catch (error) {
      this.toastrService.error(
        'Une erreur est survenue, veuillez réessayer',
        'Erreur'
      );
    }
  }
}
