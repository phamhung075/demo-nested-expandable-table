# Angular Material Nested Table Demo

![Capture d'écran 2025-02-06 161811](https://github.com/user-attachments/assets/dd3d5efc-c1a2-43f4-a940-8beb426707b4)

A demonstration of an expandable nested table using Angular Material with full CRUD operations, automatic updates, and a mock backend service.

## Features

- Expandable rows with inline editing
- Material table with pagination and sorting
- Real-time table updates on:
  - Create new product
  - Edit existing product
  - Cancel operations
- Status-based styling with color indicators
- Responsive design for different screen sizes
- Mock backend service for testing

## Project Structure

```
app/
├── components/
│   └── product/
│       ├── product-create/      # Create product modal
│       └── product-table/       # Main table component
├── library/
│   └── shared/
│       ├── enum/               # Status enums
│       ├── interface/          # Type definitions
│       ├── nested-table/       # Base table functionality
│       └── form-abstract/      # Form base classes
├── services/
│   ├── product/               # Product CRUD service
│   └── baseCRUD.service.ts    # Base service interface
└── styles/                    # Shared styles
```

## Getting Started

1. Install dependencies:

```bash
npm install @angular/material @angular/cdk ngx-toastr
```

2. Import required modules in your app.module.ts:

```typescript
import { MatTableModule } from "@angular/material/table";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSortModule } from "@angular/material/sort";
import { ToastrModule } from "ngx-toastr";
```

## Key Components

### ProductTableComponent

The main table component that extends the base nested table functionality:

- Handles expandable rows for inline editing
- Implements sorting and pagination
- Manages real-time updates on CRUD operations
- Provides responsive column display

### ProductCreateComponent

Modal component for creating new products:

- Form validation
- Status selection
- Auto-refresh on successful creation

## State Management

The table uses EditStateService for managing edit states:

- Tracks expanded/collapsed states
- Handles edit mode toggling
- Manages form state during edits

## Automatic Updates

The table automatically refreshes in these scenarios:

1. After create operation:

```typescript
dialogRef.afterClosed().subscribe(() => {
  this.loadTable();
});
```

2. After cancel operation:

```typescript
async _processAnnule(element: T) {
  await this._processReload(element);
  this._toggleExpand(element);
}
```

3. After edit operation:

```typescript
async _save(element: T) {
  if (await this.aliasService.update(this.currentEditElement()!)) {
    this._viewMode();
  }
}
```

## Styling

The project includes dedicated SCSS files for:

- Table styles (nested-table.scss)
- Form styles (form.scss)
- Filter bar styles (filter-bar.scss)
- Responsive layouts

## Service Layer

Uses a mock service (ProductService) that simulates backend operations with:

- Pagination
- Filtering
- Sorting
- CRUD operations

## Development

To start the development server:

```bash
ng serve
```

Navigate to `http://localhost:2900/`
