import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Entrerprise_CdkDialogCreate } from './create-Product-modal.component';

describe('Entrerprise_CdkDialogCreate', () => {
  let component: Entrerprise_CdkDialogCreate;
  let fixture: ComponentFixture<Entrerprise_CdkDialogCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Entrerprise_CdkDialogCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(Entrerprise_CdkDialogCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
