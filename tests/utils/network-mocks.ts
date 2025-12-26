/**
 * Network Mocking Utilities
 * 
 * Helper functions to mock various network scenarios
 */

import { vi } from 'vitest';

/**
 * Mock a network error (connection failed)
 */
export const mockNetworkError = () => {
  return Promise.reject(new TypeError('Network request failed'));
};

/**
 * Mock a timeout error
 */
export const mockTimeout = (delay: number = 30000) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timeout'));
    }, delay);
  });
};

/**
 * Mock a rate limit response (429)
 */
export const mockRateLimit = (retryAfter: number = 60) => {
  const error: any = new Error('Too Many Requests');
  error.response = {
    status: 429,
    headers: new Headers({
      'Retry-After': retryAfter.toString(),
      'X-RateLimit-Remaining': '0',
    }),
    json: async () => ({
      error: 'Rate limit exceeded',
      retryAfter,
    }),
  };
  return Promise.reject(error);
};

/**
 * Mock various HTTP error responses
 */
export const mockHttpError = (status: number, message?: string) => {
  const errorMessages: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };

  const error: any = new Error(message || errorMessages[status] || 'HTTP Error');
  error.response = {
    status,
    statusText: errorMessages[status],
    json: async () => ({
      error: message || errorMessages[status],
    }),
  };
  return Promise.reject(error);
};

/**
 * Mock malformed JSON response
 */
export const mockMalformedJSON = () => {
  const error = new SyntaxError('Unexpected token < in JSON at position 0');
  return Promise.reject(error);
};

/**
 * Mock CORS error
 */
export const mockCORSError = () => {
  const error = new TypeError('Failed to fetch');
  (error as any).message = 'CORS policy blocked';
  return Promise.reject(error);
};

/**
 * Mock slow network response
 */
export const mockSlowResponse = <T>(data: T, delay: number = 3000): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

/**
 * Mock intermittent connectivity (success/fail alternately)
 */
export const mockIntermittentConnectivity = <T>(
  successData: T,
  failureCount: number = 2
) => {
  let attempts = 0;
  
  return vi.fn(() => {
    attempts++;
    if (attempts <= failureCount) {
      return mockNetworkError();
    }
    return Promise.resolve(successData);
  });
};

/**
 * Mock API response with custom status and data
 */
export const mockApiResponse = <T>(data: T, status: number = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    json: async () => data,
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  });
};

/**
 * Mock fetch with custom behavior
 */
export const mockFetch = (responses: Record<string, any>) => {
  return vi.fn((url: string) => {
    const urlStr = url.toString();
    for (const [pattern, response] of Object.entries(responses)) {
      if (urlStr.includes(pattern)) {
        if (response instanceof Error) {
          return Promise.reject(response);
        }
        return Promise.resolve(response);
      }
    }
    return mockHttpError(404, 'Not Found');
  });
};

/**
 * Create a mock fetch that fails after N successful calls
 */
export const mockFetchFailAfter = <T>(
  successData: T,
  successCount: number = 3
) => {
  let calls = 0;
  
  return vi.fn(() => {
    calls++;
    if (calls <= successCount) {
      return mockApiResponse(successData);
    }
    return mockNetworkError();
  });
};

/**
 * Mock abort controller timeout
 */
export const mockAbortTimeout = (delay: number = 5000) => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), delay);
  return controller;
};

