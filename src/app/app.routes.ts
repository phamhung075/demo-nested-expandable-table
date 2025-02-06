import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '**', redirectTo: 'nested-table', pathMatch: 'full' },
  {
    path: 'nested-table',
    loadChildren: () =>
      import('./components/product/product-table/product-table.routes').then(
        (m) => m.routes
      ),
  },
];
