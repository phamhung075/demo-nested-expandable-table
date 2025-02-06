import { ChangeDetectorRef } from '@angular/core';
import { Component } from '@angular/core';
import { IOption } from '../library/shared/interface/_base/options.interface';

@Component({
  template: '',
})
export abstract class _ParseUtilsAbstract {
  constructor(protected readonly changeDetectorRef: ChangeDetectorRef) {}

  /**
   * Retrieves the value of a property in an object using a given path.
   * @param obj - The object to retrieve the property from.
   * @param path - The path to the property, using dot notation.
   * @returns The value of the property, or undefined if the property does not exist.
   */
  protected _getPropertyByPath(obj: any, path: string): string {
    return path
      .split(' ')
      .map((subPath) =>
        subPath
          .split('.')
          .reduce((acc, part) => (acc ? acc[part] : undefined), obj)
      )
      .join(' \u2014 ');
  }

  /**
   * Converts a string array to an array of IOption objects.
   * interface IOption {
   *     key: string;
   *     label: string;
   * }
   * @param array - The string array to convert.
   * @returns An array of IOption objects.
   */
  protected _convertStringArrayToIOptions(array: string[]): IOption[] {
    return array.map((item) => ({
      key: item,
      label: item,
    }));
  }

  /**
   * Converts an enum object to an array of IOption objects.
   * interface IOption {
   *     key: string;
   *     label: string;
   * }
   * @param enumObj - The enum object to convert.
   * @returns An array of IOption objects representing the enum values.
   */
  protected _convertEnumToIOptions<T extends object>(enumObj: T): IOption[] {
    return Object.keys(enumObj)
      .filter((key) => isNaN(Number(key))) // Filtre pour exclure les clés numériques
      .map((key) => ({
        key: enumObj[key as keyof T] as string,
        label: enumObj[key as keyof T] as string,
      }));
  }

  /**
   * Formats a date to a string in the format 'YYYY-MM-DD' for raw material input value.
   *
   * @param date - The date to be formatted. It can be either a string or a Date object.
   * @returns The formatted date string in the format 'YYYY-MM-DD'.
   */
  protected _formatDateToRawMatInputValue(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', date);
      return '0000-00-00';
    }
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Converts the given value to a number or returns the default value if the value is undefined or null.
   * If the value is a string, it attempts to convert it to a number using the unary plus operator.
   * If the conversion fails, it returns the default value.
   *
   * @param value - The value to convert to a number.
   * @param defaultValue - The default value to return if the value is undefined or null. Default is 0.
   * @returns The converted number or the default value.
   */
  protected _convertToNumberOrDefault(
    value: string | null | undefined | number,
    defaultValue = 0
  ) {
    if (value === undefined || value === null) {
      return defaultValue;
    } else if (typeof value === 'string') {
      const number = +value;
      return isNaN(number) ? defaultValue : number;
    } else {
      return value;
    }
  }

  /**
   * Converts a string property of an object to a Date object if it is a valid date string.
   * @param element - The object containing the property to be converted.
   * @param propertyName - The name of the property to be converted.
   * @returns void
   */
  protected _convertStringToDate<T>(element: T, propertyName: keyof T): void {
    const value = element[propertyName];

    // Check if the property exists, is a string, and is not an empty string
    if (value && typeof value === 'string' && value.trim() !== '') {
      try {
        const parsedDate = new Date(value);
        if (!isNaN(parsedDate.getTime())) {
          // TypeScript might complain about this assignment without a type assertion,
          // because it cannot guarantee that every property of T can be a Date.
          element[propertyName] = parsedDate as unknown as T[keyof T];
        } else {
          console.error(`${String(propertyName)} is not a valid date string.`);
        }
      } catch (error) {
        console.error(
          `${String(propertyName)} could not be converted to a Date object.`,
          error
        );
      }
    }
  }
}
