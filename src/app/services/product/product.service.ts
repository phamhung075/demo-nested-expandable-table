import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { faker } from '@faker-js/faker';
import { IFetchPageResult } from '../../library/shared/interface/_base/fetch-page-result.interface';
import { IProduct } from '../../library/shared/interface/Product.interface';
import { IBaseCRUDService } from '../baseCRUD.service';

const NPRODUCT = 9879;

@Injectable({
  providedIn: 'root',
})
export class ProductService implements IBaseCRUDService<IProduct> {
  private static instance: ProductService;
  private static mockProduct: Partial<IProduct>[] = []; // Make mockProduct static
  private static readonly STORAGE_KEY = 'mockProducts';

  private constructor() {
    // Only initialize if mockProduct is empty
    if (ProductService.mockProduct.length === 0) {
      const stored = localStorage.getItem(ProductService.STORAGE_KEY);
      ProductService.mockProduct = stored
        ? JSON.parse(stored)
        : this.generateInitialProduct();
      ProductService.saveToStorage();
    }
  }
  className: string = 'Product';
  private static saveToStorage(): void {
    localStorage.setItem(
      ProductService.STORAGE_KEY,
      JSON.stringify(ProductService.mockProduct)
    );
  }
  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  public getProduct(): Partial<IProduct>[] {
    return ProductService.mockProduct;
  }

  private generateInitialProduct(count: number = NPRODUCT): IProduct[] {
    const STATUS_OPTIONS: IProduct['status'][] = [
      'Active',
      'Inactive',
      'Pending',
      'Archived',
    ];

    const productCategories = [
      'Smartphone',
      'Laptop',
      'Tablet',
      'Monitor',
      'Headphones',
      'Keyboard',
      'Mouse',
      'Speaker',
      'Camera',
      'Printer',
    ];

    const productFeatures = [
      'Pro',
      'Elite',
      'Ultra',
      'Premium',
      'Plus',
      'Max',
      'Advanced',
      'Smart',
      'Professional',
      'Gaming',
    ];

    const brands = [
      'TechPro',
      'NextGen',
      'SmartTech',
      'EliteTech',
      'InnoWare',
      'FutureTech',
      'PrimeTech',
      'UltraCore',
      'MaxTech',
      'ProTech',
    ];

    return Array.from({ length: count }, (_, index) => {
      const createdAt = faker.date.between({
        from: '2024-01-15',
        to: '2024-02-03',
      });

      const updatedAt = faker.date.between({
        from: createdAt,
        to: '2024-02-10',
      });

      // Generate a product name by combining different elements
      const brand = faker.helpers.arrayElement(brands);
      const category = faker.helpers.arrayElement(productCategories);
      const feature = faker.helpers.arrayElement(productFeatures);
      const model = faker.string.numeric('###');

      // Create product name with different patterns
      const namePatterns = [
        `${brand} ${category} ${feature}`,
        `${brand} ${feature} ${category} ${model}`,
        `${feature} ${category} ${model}`,
        `${brand} ${category} Series ${model}`,
        `${category} ${feature} Edition`,
      ];

      return {
        id: (index + 1).toString(),
        name: faker.helpers.arrayElement(namePatterns),
        description: `${faker.commerce.productAdjective()} ${category} with ${faker.commerce.productMaterial()} finish and ${faker.commerce
          .productAdjective()
          .toLowerCase()} features`,
        status: faker.helpers.arrayElement(STATUS_OPTIONS),
        createdAt,
        updatedAt,
      };
    });
  }

  fetchPage(
    filter: string = '',
    page: number = 1,
    pageSize: number = 10,
    sortField: string = 'updatedAt',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Observable<IFetchPageResult<Partial<IProduct>>> {
    console.log(
      `Fetching page ${page} with filter "${filter}" and sorting by ${sortField} ${sortDirection}`
    );

    // Validate input parameters
    const validatedPage = Math.max(1, Math.floor(page));
    const validatedPageSize = Math.max(1, Math.floor(pageSize));
    const sanitizedFilter = filter
      .replace(/[^\w\s-]/g, '')
      .toLowerCase()
      .trim();

    // Apply filtering
    let filteredProduct = ProductService.mockProduct.filter((item) =>
      Object.values(item).some(
        (value) =>
          value &&
          value
            .toString()
            .toLowerCase()
            .includes((sanitizedFilter || '').toLowerCase().trim())
      )
    );

    // Apply sorting with special handling for numeric IDs
    filteredProduct = [...filteredProduct].sort((a, b) => {
      const aValue = this.getSortValue(
        a as IProduct,
        sortField as keyof IProduct
      );
      const bValue = this.getSortValue(
        b as IProduct,
        sortField as keyof IProduct
      );

      // Special handling for numeric IDs
      if (sortField === 'id') {
        const aNum = typeof aValue === 'string' ? parseInt(aValue, 10) : aValue;
        const bNum = typeof bValue === 'string' ? parseInt(bValue, 10) : bValue;

        if (isNaN(aNum) || isNaN(bNum)) {
          return 0; // Handle invalid numbers gracefully
        }

        const comparison = aNum > bNum ? 1 : aNum < bNum ? -1 : 0;
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      // Regular comparison for other fields
      if (aValue === bValue) return 0;
      const comparison = aValue > bValue ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Calculate pagination values
    const total = filteredProduct.length;
    const totalPages = Math.ceil(total / validatedPageSize);
    const safeValidatedPage = Math.min(validatedPage, totalPages);

    const start = (safeValidatedPage - 1) * validatedPageSize;
    const end = Math.min(start + validatedPageSize, total);

    // Get paginated IProduct
    const paginatedProduct = filteredProduct.slice(start, end);

    return new Observable<IFetchPageResult<Partial<IProduct>>>((observer) => {
      setTimeout(() => {
        observer.next({
          data: paginatedProduct,
          total,
          count: paginatedProduct.length,
          page: safeValidatedPage,
          totalPages,
          limit: validatedPageSize,
          hasNextPage: safeValidatedPage < totalPages,
          hasPreviousPage: safeValidatedPage > 1,
          sortField,
          sortDirection,
        });
        observer.complete();
      }, 300); // Simulate one second delay
    });
  }

  // Helper function to handle sorting values
  private getSortValue(item: IProduct, field: keyof IProduct): any {
    const value = item[field];

    // Handle numeric IDs
    if (field === 'id' && typeof value === 'string' && /^\d+$/.test(value)) {
      return parseInt(value, 10);
    }

    return value;
  }

  read(id: string): Observable<Partial<IProduct>> {
    return new Observable<Partial<IProduct>>((observer) => {
      setTimeout(() => {
        const item = ProductService.mockProduct.find((d) => d.id === id);
        if (!item) {
          observer.error(new Error(`Produit avec l'ID ${id} non trouvé`));
        } else {
          // Return the actual reference instead of a copy
          observer.next(item);
        }
        observer.complete();
      }, 300);
    });
  }

  delete(id: string): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      setTimeout(() => {
        try {
          const index = ProductService.mockProduct.findIndex(
            (d) => d.id === id
          );
          if (index === -1) {
            observer.error(new Error(`Product with ID ${id} not found`));
            return;
          }

          ProductService.mockProduct.splice(index, 1);
          ProductService.saveToStorage();
          observer.next(true);
        } catch (error) {
          observer.error(error);
        }
        observer.complete();
      }, 300);
    });
  }

  update(item: Partial<IProduct> & { id?: string }): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      setTimeout(() => {
        const index = ProductService.mockProduct.findIndex(
          (d) => d.id === item.id
        );
        if (index !== -1) {
          ProductService.mockProduct[index] = {
            ...ProductService.mockProduct[index],
            ...item,
            updatedAt: new Date(),
          };
          ProductService.saveToStorage();
          observer.next(true);
        } else {
          observer.next(false);
        }
        observer.complete();
      }, 300);
    });
  }

  // Update other CRUD methods to use saveToStorage()
  create(element: Partial<IProduct>): Observable<Partial<IProduct>> {
    return new Observable<Partial<IProduct>>((observer) => {
      setTimeout(() => {
        try {
          // Find the highest existing ID
          const maxId = Math.max(
            ...ProductService.mockProduct.map((p) => parseInt(p.id || '0', 10))
          );

          const newElement = {
            ...element,
            id: (maxId + 1).toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          ProductService.mockProduct.push(newElement);
          ProductService.saveToStorage();
          observer.next(newElement);
        } catch (error) {
          observer.error(error);
        } finally {
          observer.complete();
        }
      }, 300);
    });
  }
}
