import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: '.', pathMatch: 'prefix' },
      {
        path: ':id',
        loadComponent: () =>
          import('./product-table.component').then(
            (m) => m.ProductTableComponent
          ),
      },
    ],
  },
];
