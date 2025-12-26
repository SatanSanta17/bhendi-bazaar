/**
 * Async Test Helpers
 * 
 * Utility functions for handling asynchronous operations in tests
 */

import { act } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';

/**
 * Wait for the next tick of the event loop
 */
export const waitForNextTick = () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

/**
 * Flush all pending promises
 */
export const flushPromises = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

/**
 * Advance all timers by specified milliseconds
 */
export const advanceTimers = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
    await flushPromises();
  });
};

/**
 * Wait for condition to be true with timeout
 */
export const waitForCondition = async (
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 50
): Promise<void> => {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
};

/**
 * Wait for all pending microtasks
 */
export const flushMicrotasks = () => {
  return new Promise<void>((resolve) => queueMicrotask(resolve));
};

/**
 * Wait for specific amount of time
 */
export const wait = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry an async operation until it succeeds or max attempts reached
 */
export const retryAsync = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 100
): Promise<T> => {
  let lastError: Error | unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await wait(delay);
      }
    }
  }
  
  throw lastError;
};

/**
 * Run function and measure execution time
 */
export const measureTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  return { result, duration };
};

/**
 * Setup and cleanup for fake timers
 */
export const useFakeTimers = () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
};

/**
 * Wait for async state updates in React components
 */
export const waitForStateUpdate = async () => {
  await act(async () => {
    await flushMicrotasks();
  });
};

/**
 * Create a deferred promise (for manual resolution)
 */
export const createDeferred = <T = void>() => {
  let resolve: (value: T) => void;
  let reject: (reason?: any) => void;
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
};

/**
 * Create a promise that never resolves (for timeout testing)
 */
export const createHangingPromise = <T = never>(): Promise<T> => {
  return new Promise(() => {
    // Never resolves
  });
};

/**
 * Wait for all pending timers to complete
 */
export const runAllTimers = async () => {
  await act(async () => {
    vi.runAllTimers();
  });
};

/**
 * Run only pending timers (not recursive)
 */
export const runOnlyPendingTimers = async () => {
  await act(async () => {
    vi.runOnlyPendingTimers();
  });
};

