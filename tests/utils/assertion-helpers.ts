/**
 * Custom Assertion Helpers
 * 
 * Helper functions for common test assertions
 */

import { expect } from 'vitest';
import { toast } from 'sonner';

/**
 * Assert that a toast error was shown with specific message
 */
export const expectToastError = (message: string) => {
  expect(toast.error).toHaveBeenCalledWith(message);
};

/**
 * Assert that a toast success was shown with specific message
 */
export const expectToastSuccess = (message: string) => {
  expect(toast.success).toHaveBeenCalledWith(message);
};

/**
 * Assert loading state matches expected value
 */
export const expectLoadingState = (isLoading: boolean, component: { isLoading?: boolean }) => {
  expect(component.isLoading).toBe(isLoading);
};

/**
 * Assert that an error state contains expected message
 */
export const expectErrorState = (error: string | null, expectedMessage: string) => {
  expect(error).toBeTruthy();
  expect(error).toContain(expectedMessage);
};

/**
 * Assert that data was updated correctly
 */
export const expectDataUpdate = <T>(actual: T, expected: Partial<T>) => {
  expect(actual).toMatchObject(expected);
};

/**
 * Assert that a function was called with specific arguments
 */
export const expectCalledWith = (fn: any, ...args: any[]) => {
  expect(fn).toHaveBeenCalledWith(...args);
};

/**
 * Assert that a function was called N times
 */
export const expectCallCount = (fn: any, count: number) => {
  expect(fn).toHaveBeenCalledTimes(count);
};

/**
 * Assert that a function was not called
 */
export const expectNotCalled = (fn: any) => {
  expect(fn).not.toHaveBeenCalled();
};

/**
 * Assert that an array contains an item matching criteria
 */
export const expectArrayContains = <T>(arr: T[], matcher: Partial<T>) => {
  const found = arr.some(item => {
    return Object.entries(matcher).every(([key, value]) => {
      return (item as any)[key] === value;
    });
  });
  expect(found).toBe(true);
};

/**
 * Assert that an array has specific length
 */
export const expectArrayLength = <T>(arr: T[], length: number) => {
  expect(arr).toHaveLength(length);
};

/**
 * Assert that a value is within range
 */
export const expectInRange = (value: number, min: number, max: number) => {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
};

/**
 * Assert that a promise rejects with specific error
 */
export const expectToReject = async (promise: Promise<any>, errorMessage?: string) => {
  await expect(promise).rejects.toThrow(errorMessage);
};

/**
 * Assert that a promise resolves with specific value
 */
export const expectToResolve = async <T>(promise: Promise<T>, expectedValue?: T) => {
  const result = await promise;
  if (expectedValue !== undefined) {
    expect(result).toEqual(expectedValue);
  }
  return result;
};

/**
 * Assert that localStorage contains specific key-value
 */
export const expectLocalStorage = (key: string, value: any) => {
  const stored = localStorage.getItem(key);
  if (value === null) {
    expect(stored).toBeNull();
  } else {
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toEqual(value);
  }
};

/**
 * Assert that sessionStorage contains specific key-value
 */
export const expectSessionStorage = (key: string, value: any) => {
  const stored = sessionStorage.getItem(key);
  if (value === null) {
    expect(stored).toBeNull();
  } else {
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toEqual(value);
  }
};

/**
 * Assert that object has specific properties
 */
export const expectHasProperties = <T extends object>(obj: T, properties: (keyof T)[]) => {
  properties.forEach(prop => {
    expect(obj).toHaveProperty(prop as string);
  });
};

/**
 * Assert that value is truthy
 */
export const expectTruthy = (value: any) => {
  expect(value).toBeTruthy();
};

/**
 * Assert that value is falsy
 */
export const expectFalsy = (value: any) => {
  expect(value).toBeFalsy();
};

/**
 * Assert that two objects are deeply equal
 */
export const expectDeepEqual = <T>(actual: T, expected: T) => {
  expect(actual).toEqual(expected);
};

/**
 * Assert that navigation occurred to specific path
 */
export const expectNavigationTo = (router: any, path: string) => {
  expect(router.push).toHaveBeenCalledWith(path);
};

/**
 * Assert that a function throws specific error
 */
export const expectThrows = (fn: () => void, errorMessage?: string) => {
  if (errorMessage) {
    expect(fn).toThrow(errorMessage);
  } else {
    expect(fn).toThrow();
  }
};

/**
 * Assert that value matches regex pattern
 */
export const expectMatchesPattern = (value: string, pattern: RegExp) => {
  expect(value).toMatch(pattern);
};

/**
 * Assert that date is recent (within last N seconds)
 */
export const expectRecentDate = (date: Date | string, maxSecondsOld: number = 5) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffSeconds = (now.getTime() - dateObj.getTime()) / 1000;
  expect(diffSeconds).toBeLessThanOrEqual(maxSecondsOld);
  expect(diffSeconds).toBeGreaterThanOrEqual(0);
};

/**
 * Assert cart totals are calculated correctly
 */
export const expectCorrectTotals = (
  items: Array<{ price: number; salePrice: number | null; quantity: number }>,
  totals: { subtotal: number; discount: number; total: number }
) => {
  let expectedSubtotal = 0;
  let expectedDiscount = 0;

  items.forEach(item => {
    const itemSubtotal = item.price * item.quantity;
    expectedSubtotal += itemSubtotal;

    if (item.salePrice !== null) {
      expectedDiscount += (item.price - item.salePrice) * item.quantity;
    }
  });

  const expectedTotal = expectedSubtotal - expectedDiscount;

  expect(totals.subtotal).toBe(expectedSubtotal);
  expect(totals.discount).toBe(expectedDiscount);
  expect(totals.total).toBe(expectedTotal);
};

