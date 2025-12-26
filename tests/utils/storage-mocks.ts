/**
 * Storage Mocking Utilities
 * 
 * Helper functions to mock browser storage APIs
 */

import { vi } from 'vitest';

/**
 * Mock localStorage quota exceeded error
 */
export const mockLocalStorageQuotaExceeded = () => {
  const error = new Error('QuotaExceededError');
  error.name = 'QuotaExceededError';
  
  Storage.prototype.setItem = vi.fn(() => {
    throw error;
  });
};

/**
 * Mock localStorage disabled/unavailable
 */
export const mockLocalStorageDisabled = () => {
  Object.defineProperty(window, 'localStorage', {
    value: undefined,
    writable: true,
  });
};

/**
 * Mock localStorage with corrupted data
 */
export const mockLocalStorageCorrupted = () => {
  Storage.prototype.getItem = vi.fn(() => {
    return '{invalid json';
  });
};

/**
 * Mock sessionStorage disabled
 */
export const mockSessionStorageDisabled = () => {
  Object.defineProperty(window, 'sessionStorage', {
    value: undefined,
    writable: true,
  });
};

/**
 * Create a functional mock localStorage
 */
export const createMockLocalStorage = () => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
};

/**
 * Create a functional mock sessionStorage
 */
export const createMockSessionStorage = () => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
};

/**
 * Setup mock storage with initial data
 */
export const setupMockStorage = (initialData: Record<string, any> = {}) => {
  const mockStorage = createMockLocalStorage();
  
  // Pre-populate with initial data
  Object.entries(initialData).forEach(([key, value]) => {
    mockStorage.setItem(key, JSON.stringify(value));
  });

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });

  return mockStorage;
};

/**
 * Mock storage with size limit (for testing quota)
 */
export const createMockStorageWithLimit = (maxSize: number = 5000) => {
  let store: Record<string, string> = {};
  let currentSize = 0;

  const calculateSize = (data: string) => {
    return new Blob([data]).size;
  };

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      const size = calculateSize(value);
      
      if (currentSize + size > maxSize) {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      }

      if (store[key]) {
        currentSize -= calculateSize(store[key]);
      }
      
      store[key] = value;
      currentSize += size;
    }),
    removeItem: vi.fn((key: string) => {
      if (store[key]) {
        currentSize -= calculateSize(store[key]);
        delete store[key];
      }
    }),
    clear: vi.fn(() => {
      store = {};
      currentSize = 0;
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
};

/**
 * Restore original storage implementations
 */
export const restoreStorage = () => {
  // This would typically restore the original implementations
  // For vitest, we just clear the mocks
  vi.restoreAllMocks();
};

/**
 * Mock private browsing mode (storage throws errors)
 */
export const mockPrivateBrowsing = () => {
  const error = new Error('SecurityError');
  error.name = 'SecurityError';

  Storage.prototype.setItem = vi.fn(() => {
    throw error;
  });

  Storage.prototype.getItem = vi.fn(() => {
    throw error;
  });
};

