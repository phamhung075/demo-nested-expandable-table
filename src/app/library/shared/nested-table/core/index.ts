import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Injector,
  OnDestroy,
  OnInit,
  SecurityContext,
  ViewChild,
  computed,
  model,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import {
  Subject,
  Subscription,
  debounceTime,
  firstValueFrom,
  takeUntil,
  tap,
} from 'rxjs';

import { MatSort } from '@angular/material/sort';
import { EditStateService } from '../../../../services/_core/edit-state/edit-state.service';
import { IBaseCRUDService } from '../../../../services/baseCRUD.service';
import { _ParseUtilsAbstract } from '../../../../utils/parse-utils.abstract';
import { ToastrService } from 'ngx-toastr';
import { DomSanitizer } from '@angular/platform-browser';
import { ConfirmDialogComponent } from '../../../../components/confirm-dialog/confirm-dialog.component';

export const CUSTOM_BREAKPOINTS = {
  small: '(max-width: 639px)',
  medium: '(min-width: 640px) and (max-width: 1023px)',
  large: '(min-width: 1024px)',
};
@Component({
  template: '',
})
export abstract class _NestedTable<T extends { [key: string]: any }>
  extends _ParseUtilsAbstract
  implements AfterViewInit, OnDestroy, OnInit
{
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatTable) table!: MatTable<any>;
  @ViewChild(MatSort) sort!: MatSort;
  _testView$S = signal<boolean>(true); // environment.testView to change the test view

  private toggleExpandSubject = new Subject<T>();
  private toggleExpandSubscription!: Subscription;
  protected dataSource = new MatTableDataSource<Partial<T>>([]);
  protected pageIndex: number = 0;
  protected pageSize: number = 10; // Default page size
  protected expandedElement: T | null = null;
  protected _isExpandedSubject: Subject<boolean> = new Subject<boolean>();
  protected _isExpanded = signal<boolean>(false);

  protected sortField: string = 'updatedAt';
  protected sortDirection: 'asc' | 'desc' = 'desc';
  private backupElementData: Partial<T> | null = null;

  abstract columnsToDisplay: string[];
  abstract columnsToDisplay_LargeScreen: string[];
  abstract columnsToDisplay_SmallScreen: string[];
  abstract columnsToDisplay_MiddleScreen: string[];

  abstract form: FormGroup;

  protected searchSubject: Subject<string> = new Subject();
  protected currentEditElement = signal<T | undefined>(undefined);
  protected backUpProductSource: any | null = null;
  protected filter = '';
  protected totalCount: number = 0;
  protected valueChangeSubscriptions: Subscription[] = [];

  protected searchSubscription: Subscription = new Subscription();
  protected userSubscription!: Subscription;
  protected breakPointsSubscription: Subscription = new Subscription();
  protected tapSubscription: Subscription = new Subscription();
  protected routeSubscription: Subscription = new Subscription();

  _isEdit = signal<boolean>(false);
  isAnnuled$M = model(false);
  isRestored$M = model(false);

  fakeForm$S = signal<string>('');

  isLoading$S = signal<boolean>(true);

  protected largeScreen_fakeForm =
    '../../../../assets/images/default/largeScreen_fakeForm.png';
  protected smallScreen_fakeForm =
    '../../../../assets/images/default/smallScreen_fakeForm.png';
  protected middleScreen_fakeForm =
    '../../../../assets/images/default/middleScreen_fakeForm.png';

  protected destroy$ = new Subject<void>();

  protected createdByMe$S = signal<boolean>(false);

  excepts: string[] = [];

  protected TIME_OUT = 300;

  isRestored$S = computed(() => {
    return this.isRestored$M();
  });

  backUpElement: T | undefined;
  constructor(
    protected readonly toastrService: ToastrService,
    changeDetectorRef: ChangeDetectorRef,
    protected readonly editStateSrv: EditStateService,
    protected readonly breakpointObserver: BreakpointObserver,
    protected readonly dialog: MatDialog,
    protected readonly route: ActivatedRoute,
    protected readonly injector: Injector,
    protected readonly formbuilder: FormBuilder,
    protected readonly sanitizer: DomSanitizer
  ) {
    super(changeDetectorRef);
    this.editStateSrv.next(this._isExpanded());
    this.setupToggleExpandDebounce();
  }
  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  async onSortChange(event: any) {
    this.sortField = this.sort.active;
    this.sortDirection = this.sort.direction as 'asc' | 'desc';
    await this.loadTable();
  }

  async initRouteSub() {
    this.routeSubscription.add(
      this.route.data.subscribe(async (data) => {
        // Extract values directly from the route data
      })
    );
  }

  /**
   * Initializes the component.
   * This method is called after the component's data-bound properties have been initialized,
   * and the component's view has been fully initialized.
   * It is used to perform any initialization logic for the component.
   */
  async ngOnInit(): Promise<void> {
    await this.initRouteSub();
    this.form = this.getInitForm();
    this._isEdit.set(false);

    this.changeDetectorRef.detach();
    this.setupPaginatorSubscription();
    this.searchSubscription.add(
      this.searchSubject
        .pipe(
          debounceTime(500) // Attend 500ms après le dernier événement keyup avant d'émettre la dernière valeur
        )
        .subscribe({
          next: async (filterValue) => {
            if (filterValue.length >= 2 && !this.isLoading$S()) {
              console.log('loadTable filterValue.length >= 2');
              this.loadTable();
              this.paginator.firstPage();
            }
            if (filterValue.length === 0 && !this.isLoading$S()) {
              console.log('loadTable filterValue.length === 0');

              this.loadTable();
            }
          },
        })
    );

    this._observeBreakpoints();
    this.isRestoredSubscription();
    console.log('loadTable onInit');

    await this.loadTable(); // Appel initial pour charger les contacts.
    if (this.paginator) {
      this.paginator.firstPage();
    }

    this.editStateSrv.isExpanded$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isExpanded) => {
        this._isExpanded.set(isExpanded);
        if (this._isExpanded() === false) {
          this._isEdit.set(false);
        }
        this.changeDetectorRef.detectChanges();
      });

    this.editStateSrv.next(false);
    this._isEdit.set(false);
    await this.initValues();
    this._disableEditControls([]);
    this.changeDetectorRef.reattach();
    this.changeDetectorRef.detectChanges();
  }

  resetRestoredSubsValue() {
    this.isRestored$M.set(false);
  }

  isRestoredSubscription() {
    toObservable(this.isRestored$S, { injector: this.injector })
      ?.pipe(takeUntil(this.destroy$))
      .subscribe(async (isRestored) => {
        if (isRestored) {
          this.toastrService.info('Product restaurée avec succès.');
          this.resetRestoredSubsValue();
        }
      });
  }

  abstract initValues(): Promise<void>;
  protected abstract aliasService: IBaseCRUDService<T>;

  /**
   * Loads the table data asynchronously.
   *
   * This method fetches a page of data from the aliasService, processes each element,
   * and updates the dataSource with the results. It also handles loading indicators
   * and error cases.
   *
   * @returns A Promise that resolves when the table data has been loaded and processed.
   */
  async loadTable(): Promise<void> {
    this.isLoading$S.set(true);
    this.changeDetectorRef.detach();

    try {
      const currentPage = this.paginator?.pageIndex ?? this.pageIndex;
      const currentPageSize = this.paginator?.pageSize ?? this.pageSize;
      const result = await firstValueFrom(
        this.aliasService.fetchPage(
          this.filter,
          currentPage + 1,
          currentPageSize,
          this.sortField,
          this.sortDirection
        )
      );

      if (result.data && result.data.length > 0) {
        await Promise.all(
          result.data.map((element: Partial<T>) =>
            this.formatElement(element as Partial<T>)
          )
        );
        this.dataSource.data = result.data;
        this.totalCount = result.total;
      } else {
        this.dataSource.data = [];
        this.totalCount = 0;
      }
    } catch (error) {
      console.error('Error loading table data:', error);
      this.dataSource.data = [];
      this.totalCount = 0;
    } finally {
      this.changeDetectorRef.reattach();
      this.isLoading$S.set(false);
      this.changeDetectorRef.detectChanges();
    }
  }

  /**
   * Lifecycle hook that is called when the component is destroyed.
   * It unsubscribes from all subscriptions to prevent memory leaks.
   */
  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    if (this.breakPointsSubscription) {
      this.breakPointsSubscription.unsubscribe();
    }
    if (this.tapSubscription) {
      this.tapSubscription.unsubscribe();
    }
    if (this.toggleExpandSubscription) {
      this.toggleExpandSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    this.toggleExpandSubject.complete();
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up the form groups
    this.cleanFormGroup(this.form);
    this.form = {} as FormGroup;
  }

  private async setupPaginatorSubscription() {
    if (this.paginator) {
      console.log('tapSubscription add');
      this.tapSubscription.add(
        this.paginator.page
          .pipe(
            tap(async () => {
              this.editStateSrv.next(false);
              this._isEdit.set(false);
              await this.loadTable(); // load on tapSubscription
              this.isLoading$S.set(false);
              this.changeDetectorRef.detectChanges();
            })
          )
          .subscribe()
      );
    }
  }

  /**
   * Observes the breakpoints and updates the columns to display based on the screen size.
   */
  _observeBreakpoints(): void {
    this.changeDetectorRef.detach();

    this.breakPointsSubscription.add(
      this.breakpointObserver
        .observe([
          CUSTOM_BREAKPOINTS.small,
          CUSTOM_BREAKPOINTS.medium,
          CUSTOM_BREAKPOINTS.large,
        ])
        .subscribe((result: BreakpointState) => {
          if (result.breakpoints[CUSTOM_BREAKPOINTS.small]) {
            this.fakeForm$S.set(this.smallScreen_fakeForm);
            // Pour les petits écrans, afficher uniquement denominationSociale et mailSociete
            this.columnsToDisplay = this.columnsToDisplay_SmallScreen;
          } else if (result.breakpoints[CUSTOM_BREAKPOINTS.medium]) {
            this.fakeForm$S.set(this.middleScreen_fakeForm);
            // Pour les écrans moyens (tablettes), afficher les colonnes pour les écrans moyens
            this.columnsToDisplay = this.columnsToDisplay_MiddleScreen;
          } else if (result.breakpoints[CUSTOM_BREAKPOINTS.large]) {
            this.fakeForm$S.set(this.largeScreen_fakeForm);
            // Pour les écrans plus grands, afficher toutes les colonnes
            this.columnsToDisplay = this.columnsToDisplay_LargeScreen;
          }
          this.changeDetectorRef.detectChanges();
        })
    );
  }

  /**
   * Enters the edit mode for the list table.
   * @param excepts - An optional array of property names to exclude from enabling edit controls.
   */
  _editMode() {
    this.isAnnuled$M.set(false);
    this._isEdit.set(true);
    this._enableEditControls();
  }

  _initForm() {
    this.form = this.cloneFormGroup(this.getInitForm());
    this.changeDetectorRef.detectChanges();
  }

  _initCreatedByValues(): void {
    this.createdByMe$S.set(false);
  }

  _viewMode(): void {
    this._disable2wayBinding();
    this._disableEditControls([]);
    this._isEdit.set(false);
    this.changeDetectorRef.markForCheck();
  }

  _getInitialValue(elementInput: T) {
    const elementActual = elementInput;
    this._initForm();
    this._initCreatedByValues();
    this.formatElement(elementActual);
    this._formGroupGetElementsvalues(elementActual, this.form);
    this._viewMode();
    this.editStateSrv.next(true);
    this._setCurrentEditElement(elementActual);
    this.changeDetectorRef.detectChanges();
  }

  async _processReload(element: T): Promise<void> {
    try {
      const result = await firstValueFrom(
        this.aliasService.read(element['id'])
      );

      if (!result) {
        throw new Error('Element not found');
      }

      // Update the data source to maintain consistency
      const index = this.dataSource.data.findIndex(
        (item) => item['id'] === element['id']
      );
      if (index !== -1) {
        // Update the element in the data source
        this.dataSource.data[index] = result as T;

        // Update the current element if it's the one being edited
        if (this.currentEditElement()?.['id'] === element['id']) {
          this._setCurrentEditElement(result as T);
        }
      }

      // Update the form if needed
      if (
        this._isExpanded() &&
        this.currentEditElement()?.['id'] === element['id']
      ) {
        this._formGroupGetElementsvalues(result as T, this.form);
      }

      this.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('Error in _processReload:', error);
      this.toastrService.error(
        'Erreur lors du rechargement des données',
        'Erreur'
      );
    }
  }

  _processOpen(element: T): void {
    if (element == null) {
      this.toastrService.error(
        'Erreur',
        "Impossible de récupérer les informations de l'élément"
      );
      return;
    }
    if (element['id'] == null) {
      this.toastrService.error(
        'Erreur',
        "Impossible de récupérer id de l'élément"
      );
      return;
    }
    const editElement = element;
    this._getInitialValue(editElement);
    this.changeDetectorRef.detectChanges();
  }

  _processEdit(element: T): void {
    // Store backup before entering edit mode
    this.backupElementData = { ...element };
    this._editMode();
    this.changeDetectorRef.detectChanges();
  }

  _processClose() {
    this.currentEditElement.set(undefined);
    this.cleanFormGroup(this.form);
    this._initCreatedByValues();
    this._isEdit.set(false);
    this.editStateSrv.next(false);
    // Clear backup when closing
    this.backupElementData = null;
  }

  async _processAnnule(element: T) {
    this.isAnnuled$M.set(true);

    if (this.backupElementData) {
      // Find the index of the element in the data source
      const index = this.dataSource.data.findIndex(
        (item) => item['id'] === element['id']
      );
      if (index !== -1) {
        // Restore the backed up data
        this.dataSource.data[index] = { ...this.backupElementData };
        // Also update the current edit element
        this._setCurrentEditElement(this.dataSource.data[index] as T);
        // Reset the form with the backup data
        this._formGroupGetElementsvalues(
          this.backupElementData as T,
          this.form
        );
      }
      // Clear the backup
      this.backupElementData = null;
    }

    this._toggleExpand(element);
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Toggles the expansion state of an element in the list table.
   * isDebouncing : handle click debouncing
   * @param element - The element to toggle the expansion for.
   */
  isDebouncing: boolean = false;
  async _toggleExpand(element: T): Promise<void> {
    console.log('toggleExpand');
    if (this.isDebouncing) {
      return;
    }
    this.isDebouncing = true;

    try {
      if (element['id'] == null) {
        this.toastrService.error(
          'Erreur',
          "Impossible de récupérer id de l'élément"
        );
        this.loadTable();
        this._processClose();
      } else {
        if (element['id'] === this.currentEditElement()?.['id']) {
          // If we're in edit mode and there are unsaved changes
          if (this._isEdit()) {
            // First cancel/reset any changes
            await this._processAnnule(element);
          }
          console.log('_processClose');
          this._processClose();
        } else {
          if (this._isExpanded()) {
            if (this._isEdit()) {
              console.log('_processClose _processOpen');
              // First cancel/reset any changes in the currently edited item
              await this._processAnnule(this.currentEditElement()!);
              this._processClose();
              this._processOpen(element);
            } else {
              console.log('_processAnnule _processClose _processOpen');
              await this._processAnnule(element);
              this._processClose();
              this._processOpen(element);
            }
          } else {
            console.log('_processOpen');
            this._processOpen(element);
          }
        }
      }
    } catch (error) {
      console.error('Error during _toggleExpand:', error);
    } finally {
      this.isDebouncing = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  /**
   * Enables the edit controls of the form, except for the specified controls.
   * @param excepts - An optional array of control names to exclude from enabling.
   */
  _enableEditControls() {
    // Iterate over all form controls
    this._enable2wayBinding(this.currentEditElement()!, this.form);
    Object.keys(this.form.controls).forEach((controlName) => {
      const control = this.form.get(controlName);

      // If isEdit is true, enable the control, otherwise disable it
      if (control) {
        if (!this.excepts?.includes(controlName)) {
          control?.enable();
          this.changeDetectorRef.markForCheck();
        }
      } else {
        console.error('Control not found: ' + controlName);
      }
    });
  }

  /**
   * Disables the edit controls of the form, except for the specified controls.
   * @param except - An optional array of control names to exclude from being disabled.
   */
  _disableEditControls(except?: string[]) {
    // Iterate over all form controls
    Object.keys(this.form.controls).forEach((controlName) => {
      const control = this.form.get(controlName);

      // If isEdit is true, enable the control, otherwise disable it
      if (control) {
        if (!except?.includes(controlName)) {
          control?.disable();
          this.changeDetectorRef.markForCheck();
        }
      } else {
        console.error('Control not found: ' + controlName);
      }
    });
  }

  /**
   * Binds the two-way values between the form controls and the element row table.
   *
   * @template T - The type of the element.
   * @param {T} element - The element to bind the values to.
   * @param {FormGroup} [formGroup=this.form] - The form group containing the form controls.
   */
  _bind2wayValues(element: T, formGroup: FormGroup = this.form) {
    Object.keys(formGroup.controls).forEach((controlName) => {
      const subscription = formGroup
        .get(controlName)
        ?.valueChanges.subscribe((value) => {
          element[controlName as keyof T] = value; // Ensure you're safely accessing element properties
        });
      if (subscription) {
        this.valueChangeSubscriptions.push(subscription);
      }
    });
  }

  /**
   * Disables two-way binding by unsubscribing from all value change subscriptions.
   */
  _disable2wayBinding() {
    this.valueChangeSubscriptions.forEach((sub) => sub.unsubscribe());
    this.valueChangeSubscriptions = []; // Clear the array after unsubscribing
  }

  /**
   * Enables two-way binding for the specified element and form group.
   * Any existing bindings are first disabled before re-binding.
   *
   * @param element - The element to bind.
   * @param formGroup - The form group to bind the element to. Defaults to the component's form group.
   */
  _enable2wayBinding(element: T, formGroup: FormGroup = this.form) {
    this._disable2wayBinding(); // Disable any existing bindings first
    this._bind2wayValues(element, formGroup); // Re-bind
  }

  /**
   * Sets the values of the form controls in the given form group based on the properties of the element (row table).
   *
   * @template T - The type of the element.
   * @param {T} element - The element containing the values to be set in the form group.
   * @param {FormGroup} formGroup - The form group to set the values in.
   */
  _formGroupGetElementsvalues<T extends { [key: string]: any }>(
    element: T,
    formGroup: FormGroup
  ) {
    Object.keys(formGroup.controls).forEach((controlName) => {
      if (element[controlName]) {
        formGroup.get(controlName)!.setValue(element[controlName], {
          emitEvent: true,
        });
        this.changeDetectorRef.markForCheck();
      }
    });
    this.changeDetectorRef.markForCheck();
  }

  /**
   * Sets up the toggle expand debounce functionality.
   * This method subscribes to the toggleExpandSubject and debounces the emitted values.
   * Adjust the debounce time as needed.
   * When a value is emitted, it calls the _toggleExpand method with the emitted element.
   */
  private async setupToggleExpandDebounce() {
    this.toggleExpandSubscription = this.toggleExpandSubject
      .pipe(
        debounceTime(500) // Adjust debounce time as needed
      )
      .subscribe(async (element) => {
        await this._toggleExpand(element);
      });
  }

  /**
   * Toggles the expand state of the specified element.
   *
   * @param element - The element to toggle the expand state for.
   */
  public toggleExtoggleExpandpand(element: T): void {
    this.toggleExpandSubject.next(element);
  }

  /**
   * Updates a row in the data source with the provided updated element.
   *
   * @param updatedElement - The updated element to replace the existing row.
   * @returns A promise that resolves when the row is updated.
   */
  _updateRow(updatedElement: T): void {
    if (!updatedElement) return;

    const sanitizedElement = Object.entries(updatedElement).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]:
          typeof value === 'string'
            ? this.sanitizer.sanitize(SecurityContext.HTML, value) || ''
            : value,
      }),
      {} as T
    );

    const index = this.dataSource.data.findIndex(
      (item) => item['id'] === sanitizedElement['id']
    );

    if (index !== -1) {
      Object.assign(this.dataSource.data[index], sanitizedElement);
      this.changeDetectorRef.markForCheck();
      this.table.renderRows();
    }
  }

  /**
   * Deletes a row from the data source after sanitization and confirmation.
   * @param element - Element to be deleted
   */
  async _deleteRow(element: T): Promise<void> {
    if (!element?.['id']) return;

    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data: {
            title: 'Confirmation',
            message: `Voulez-vous vraiment supprimer cet élément ?`,
          },
        })
        .afterClosed()
    );

    if (!confirmed) return;

    try {
      if (await firstValueFrom(this.aliasService.delete(element['id']))) {
        this._processClose(); // Close expanded view
        await this.loadTable(); // Reload table data
        this.toastrService.success('Élément supprimé avec succès');
      }
    } catch (error) {
      this.toastrService.error('Erreur lors de la suppression');
    }
  }

  canEdit(element: T, user: any) {
    return this.createdByMe$S();
  }

  abstract getInitForm(): FormGroup;
  abstract getClassName(): string;

  _setCurrentEditElement(element: T): void {
    this.currentEditElement.set(element);
    // if (this.user?.id === element['createdBy']?.id) {
    //   this.createdByMe$S.set(true);
    // } else {
    //   this.createdByMe$S.set(false);
    // }
  }

  formatElement(row: Partial<T>): void {
    this.formatProductToInput(row);
    this.changeDetectorRef.detectChanges();
  }

  abstract formatProductToInput(element: Partial<T>): Promise<void>;

  /**
   * Retrieves the value of a specified property from an element and performs additional operations if the value is an object with an `id` property.
   * @param element - The element from which to retrieve the property value.
   * @param propertyName - The name of the property to retrieve.
   * @param service - The service used to retrieve the object by its `id`.
   * @returns A Promise that resolves to the updated element with the property value replaced by the retrieved object.
   */
  async _getElementValue<T extends { id?: string }>(
    element: T,
    propertyName: keyof T,
    service: { read: (id: string) => Promise<any> }
  ) {
    const propertyValue = element[propertyName];
    if (
      propertyValue &&
      typeof propertyValue === 'object' &&
      'id' in propertyValue
    ) {
      element[propertyName] = await service.read(propertyValue.id as string); // Add type assertion here
      this.changeDetectorRef.markForCheck();
    } else {
      element[propertyName] = null as any;
    }
  }

  async _getElementValueAndUpdateForm<T extends { id?: string }>(
    formGroup: FormGroup,
    element: T,
    propertyName: keyof T,
    service: { read: (id: string) => Promise<any> }
  ) {
    const propertyValue = element[propertyName];
    const name = propertyName as string;

    // Check if propertyValue is an object and has an 'id'
    if (
      propertyValue &&
      typeof propertyValue === 'object' &&
      'id' in propertyValue
    ) {
      try {
        // Attempt to fetch new data using the id
        const newElementProduct = await service.read(
          propertyValue.id as string
        );

        // Update the element's property with new data
        element[propertyName] = newElementProduct;
        // Trigger change detection
        this.changeDetectorRef.markForCheck();
        // Update the form control value
        const formControl = formGroup.get(propertyName as string);
        if (formControl) {
          formControl.patchValue(newElementProduct, { emitEvent: true });
        } else {
          console.warn(`FormControl ${name} not found in FormGroup.`);
        }
      } catch (error) {
        console.error(`Failed to fetch data for property '${name}':`, error);
        // Optionally handle the error by setting the form control value to null or providing a fallback value
        formGroup.get(propertyName as string)?.setValue(null);
      }
    } else {
      // If propertyValue is not an object with an id, set the property to null
      formGroup.get(propertyName as string)?.setValue(null);
    }
  }

  /**
   * Formats a date value to an input string and updates the element's property with the formatted value.
   * If the date value is not a valid string or Date object, it logs an error and returns a default value.
   * @param element - The element object to update.
   * @param propertyName - The name of the property to update.
   * @returns The formatted date string or a default value if an error occurs.
   */
  protected _formatDateToInput<T, K extends keyof T>(
    element: T,
    propertyName: K
  ): string {
    const dateValue = element[propertyName];

    if (
      typeof dateValue === 'object' &&
      dateValue !== null &&
      '__type' in dateValue &&
      dateValue.__type === 'Date' &&
      'iso' in dateValue
    ) {
      // Handle Parse date object
      const isoString = dateValue.iso as string;
      const formattedDate = this._formatDateToRawMatInputValue(isoString);
      element[propertyName as keyof T] = formattedDate as unknown as T[K];
      return formattedDate;
    } else if (typeof dateValue === 'string' || dateValue instanceof Date) {
      // Handle string or Date object
      const formattedDate = this._formatDateToRawMatInputValue(dateValue);
      element[propertyName as keyof T] = formattedDate as unknown as T[K];
      return formattedDate;
    } else {
      console.error(`${String(propertyName)} is not a valid date`, dateValue);
      return '0000-00-00'; // Default value in case of an error
    }
  }

  abstract convertColumnToStr(column: string): string;

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

  abstract _formalizer(element: T): void;

  async _save(element: T): Promise<void> {
    this.isLoading$S.set(true);
    // currentEditElement have value initial of element(row table) on _editMode() function
    // element input on this function is value of form after submit
    this._formalizer(this.currentEditElement()!);
    if (await this.aliasService.update(this.currentEditElement()!)) {
      this.toastrService.clear();
      this.toastrService.success(
        `${this.getClassName()} mis à jour avec succès`,
        'Succès'
      );
      this._viewMode();
    } else {
      this.toastrService.clear();
      this.toastrService.error(
        `${this.getClassName()} n'a pas pu être mis à jour`,
        'Erreur'
      );
      await this._processReload(this.currentEditElement()!['id']);
    }
    this.isLoading$S.set(false);
  }

  cloneFormGroup(formGroup: FormGroup): FormGroup {
    const clonedFormGroup = this.formbuilder.group({});
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      clonedFormGroup.addControl(
        key,
        this.formbuilder.control(
          control?.value,
          control?.validator,
          control?.asyncValidator
        )
      );
    });
    return clonedFormGroup;
  }

  cleanFormGroup(formGroup: FormGroup | null): void {
    if (formGroup) {
      Object.keys(formGroup.controls).forEach((key) => {
        if (formGroup.get(key)) {
          formGroup.removeControl(key);
        }
      });
    }
  }
}
