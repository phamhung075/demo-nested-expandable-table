import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule, registerLocaleData } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Injector,
  SecurityContext,
  ViewEncapsulation,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute } from '@angular/router';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { IFormBase } from '../../../library/shared/interface/_base/form-base.interface';
import { IOption } from '../../../library/shared/interface/_base/options.interface';
import { IProduct } from '../../../library/shared/interface/Product.interface';
import { _NestedTable } from '../../../library/shared/nested-table/core';
import { EditStateService } from '../../../services/_core/edit-state/edit-state.service';
import { ProductService } from '../../../services/product/product.service';
import {
  Product__FORM_BASE_CONFIG,
  Product_FormBase,
  ProductCreateComponent,
} from '../product-create/product-create.component';
import localeFr from '@angular/common/locales/fr';
import { DomSanitizer } from '@angular/platform-browser';

registerLocaleData(localeFr, 'fr-FR');

@Component({
  selector: 'app-data-table',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    ToastrModule,
    MatSortModule,
    MatToolbarModule,
  ],
  templateUrl: './product-table.component.html',
  styleUrls: ['product-table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
  providers: [
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: {} },
    {
      provide: Product__FORM_BASE_CONFIG,
      useClass: Product_FormBase,
    },
  ],
  standalone: true,
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTableComponent
  extends _NestedTable<IProduct>
  implements AfterViewInit
{
  columnsToDisplay: string[] = ['id', 'name', 'description', 'status'];
  columnsToDisplay_LargeScreen: string[] = [
    'id',
    'name',
    'description',
    'status',
    'createdAt',
    'updatedAt',
  ];
  columnsToDisplay_MiddleScreen: string[] = [
    'id',
    'name',
    'description',
    'status',
    'updatedAt',
  ];
  columnsToDisplay_SmallScreen: string[] = ['id', 'name', 'status'];
  form!: FormGroup;
  IOption__Product_Status!: IOption[];
  constructor(
    notificationService: ToastrService,
    changeDetectorRef: ChangeDetectorRef,
    editStateSrv: EditStateService,
    breakpointObserver: BreakpointObserver,
    dialog: MatDialog,
    route: ActivatedRoute,
    injector: Injector,
    formbuilder: FormBuilder,
    sanitizer: DomSanitizer,
    protected readonly aliasService: ProductService,
    @Inject(Product__FORM_BASE_CONFIG) protected formBaseConfig: IFormBase
  ) {
    super(
      notificationService,
      changeDetectorRef,
      editStateSrv,
      breakpointObserver,
      dialog,
      route,
      injector,
      formbuilder,
      sanitizer
    );
  }

  getClassName(): string {
    return this.formBaseConfig.classDescription!;
  }

  getInitForm(): FormGroup {
    return this.formBaseConfig.form!;
  }

  async initValues(): Promise<void> {
    this.IOption__Product_Status =
      this.formBaseConfig['IOption__Product_Status']!;
    // Initialize any additional values needed
  }

  // Changed from formatDataToInput to formatProductToInput to match the abstract method
  async formatProductToInput(element: Partial<IProduct>): Promise<void> {
    this.createdByMe$S.set(true);
    // Format the data as needed
  }

  convertColumnToStr(column: string): string {
    const columnMap: { [key: string]: string } = {
      id: 'ID',
      name: 'Name',
      description: 'Description',
      status: 'Status',
      actions: 'Actions',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
    };
    return columnMap[column] || column;
  }

  _formalizer(element: Partial<IProduct>): void {
    // Add any additional formatting logic needed before saving
  }

  applyFilter(event: Event): void {
    const rawValue = (event.target as HTMLInputElement).value;
    const sanitizedValue =
      this.sanitizer.sanitize(SecurityContext.HTML, rawValue) || '';
    const filteredValue = sanitizedValue
      .replace(/[^\w\s-]/g, '')
      .toLowerCase()
      .trim();
    this.searchSubject.next(filteredValue);
  }

  async openDialogCreate(): Promise<void> {
    const dialogRef = this.dialog.open(ProductCreateComponent, {
      autoFocus: false,
      height: '90%',
      width: '90%',
      data: { _testView: this._testView$S() },
    });

    // Subscribe to dialog close event
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === true) {
        // Only reload if creation was successful
        this.editStateSrv.next(false);
        await this.loadTable();
        this.paginator?.firstPage();
      }
    });
  }
}
