/**
 * useAsyncData Hook Tests
 *
 * Tests for the generic async data fetching hook
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, cleanup, act } from '@testing-library/react';
import { useAsyncData } from '@/hooks/core/useAsyncData';

describe('useAsyncData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Initial fetch', () => {
    it('should fetch data successfully on mount', async () => {
      const mockData = { id: 1, name: 'Test' };
      const fetcher = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useAsyncData(fetcher));

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during fetch', async () => {
      const errorMessage = 'Network error';
      const fetcher = vi.fn().mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAsyncData(fetcher));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(errorMessage);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should handle non-Error exceptions', async () => {
      const fetcher = vi.fn().mockRejectedValue('String error');

      const { result } = renderHook(() => useAsyncData(fetcher));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('An error occurred');
    });

    it('should set loading to false after fetch completes', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

      const { result } = renderHook(() => useAsyncData(fetcher));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set loading to false after fetch fails', async () => {
      const fetcher = vi.fn().mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useAsyncData(fetcher));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Enabled flag', () => {
    it('should not fetch when enabled is false', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

      const { result } = renderHook(() =>
        useAsyncData(fetcher, { enabled: false })
      );

      // Give it time to potentially fetch
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(fetcher).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe(null);
    });

    it('should fetch when enabled changes from false to true', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

      const { result, rerender } = renderHook(
        ({ enabled }) => useAsyncData(fetcher, { enabled }),
        { initialProps: { enabled: false } }
      );

      expect(fetcher).not.toHaveBeenCalled();

      // Enable fetching
      rerender({ enabled: true });

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(result.current.data).toEqual({ data: 'test' });
      });
    });

    it('should not refetch when enabled changes from true to false', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

      const { result, rerender } = renderHook(
        ({ enabled }) => useAsyncData(fetcher, { enabled }),
        { initialProps: { enabled: true } }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual({ data: 'test' });
      });

      expect(fetcher).toHaveBeenCalledTimes(1);

      // Disable fetching
      rerender({ enabled: false });

      // Give it time to potentially fetch again
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should still be called only once
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callbacks', () => {
    it('should call onSuccess callback with data', async () => {
      const mockData = { id: 1, name: 'Test' };
      const fetcher = vi.fn().mockResolvedValue(mockData);
      const onSuccess = vi.fn();

      renderHook(() => useAsyncData(fetcher, { onSuccess }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockData);
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('should call onError callback on failure', async () => {
      const error = new Error('Test error');
      const fetcher = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();

      renderHook(() => useAsyncData(fetcher, { onError }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });

      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('should not call onSuccess on error', async () => {
      const fetcher = vi.fn().mockRejectedValue(new Error('Test error'));
      const onSuccess = vi.fn();

      renderHook(() => useAsyncData(fetcher, { onSuccess }));

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalled();
      });

      // Give time for callbacks to execute
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should not call onError on success', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });
      const onError = vi.fn();

      renderHook(() => useAsyncData(fetcher, { onError }));

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalled();
      });

      // Give time for callbacks to execute
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('Refetch functionality', () => {
    it('should refetch data when refetch is called', async () => {
      const fetcher = vi.fn()
        .mockResolvedValueOnce({ data: 'first' })
        .mockResolvedValueOnce({ data: 'second' });

      const { result } = renderHook(() => useAsyncData(fetcher));

      await waitFor(() => {
        expect(result.current.data).toEqual({ data: 'first' });
      });

      expect(fetcher).toHaveBeenCalledTimes(1);

      // Call refetch
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.data).toEqual({ data: 'second' });
      });

      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should clear error on successful refetch', async () => {
      const fetcher = vi.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({ data: 'success' });

      const { result } = renderHook(() => useAsyncData(fetcher));

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      // Refetch
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.data).toEqual({ data: 'success' });
      });

      expect(result.current.error).toBe(null);
    });

    it('should update loading state during refetch', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

      const { result } = renderHook(() => useAsyncData(fetcher));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start refetch wrapped in act
      await act(async () => {
        await result.current.refetch();
      });

      // Should finish loading
      expect(result.current.loading).toBe(false);
    });
  });

  describe('RefetchDependencies', () => {
    it('should refetch when dependency changes', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

      const { rerender } = renderHook(
        ({ dep }) => useAsyncData(fetcher, { refetchDependencies: [dep] }),
        { initialProps: { dep: 1 } }
      );

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledTimes(1);
      });

      // Change dependency
      rerender({ dep: 2 });

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledTimes(2);
      });
    });

    it('should not refetch when dependency does not change', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

      const { rerender } = renderHook(
        ({ dep }) => useAsyncData(fetcher, { refetchDependencies: [dep] }),
        { initialProps: { dep: 1 } }
      );

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledTimes(1);
      });

      // Rerender without changing dependency
      rerender({ dep: 1 });

      // Give it time to potentially fetch again
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should still be called only once
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should refetch with multiple dependencies', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

      const { rerender } = renderHook(
        ({ dep1, dep2 }) => useAsyncData(fetcher, { refetchDependencies: [dep1, dep2] }),
        { initialProps: { dep1: 1, dep2: 'a' } }
      );

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledTimes(1);
      });

      // Change first dependency
      rerender({ dep1: 2, dep2: 'a' });

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledTimes(2);
      });

      // Change second dependency
      rerender({ dep1: 2, dep2: 'b' });

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Reset functionality', () => {
    it('should reset data, error, and loading state', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

      const { result } = renderHook(() => useAsyncData(fetcher));

      await waitFor(() => {
        expect(result.current.data).toEqual({ data: 'test' });
      });

      // Reset wrapped in act
      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(false);
    });

    it('should reset error state', async () => {
      const fetcher = vi.fn().mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useAsyncData(fetcher));

      await waitFor(() => {
        expect(result.current.error).toBe('Test error');
      });

      // Reset wrapped in act
      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.data).toBe(null);
    });
  });

  describe('Fetcher reference handling', () => {
    it('should use latest fetcher when it changes', async () => {
      const fetcher1 = vi.fn().mockResolvedValue({ data: 'first' });
      const fetcher2 = vi.fn().mockResolvedValue({ data: 'second' });

      const { result, rerender } = renderHook(
        ({ fetcher }) => useAsyncData(fetcher),
        { initialProps: { fetcher: fetcher1 } }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual({ data: 'first' });
      });

      // Change fetcher
      rerender({ fetcher: fetcher2 });

      // Refetch with new fetcher
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.data).toEqual({ data: 'second' });
      });

      expect(fetcher2).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty data', async () => {
      const fetcher = vi.fn().mockResolvedValue(null);

      const { result } = renderHook(() => useAsyncData(fetcher));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle undefined response', async () => {
      const fetcher = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => useAsyncData(fetcher));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(undefined);
      expect(result.current.error).toBe(null);
    });

    it('should handle array data', async () => {
      const mockArray = [1, 2, 3];
      const fetcher = vi.fn().mockResolvedValue(mockArray);

      const { result } = renderHook(() => useAsyncData(fetcher));

      await waitFor(() => {
        expect(result.current.data).toEqual(mockArray);
      });
    });

    it('should handle primitive data types', async () => {
      const primitives = [42, 'string', true, false, 0];

      for (const primitive of primitives) {
        const fetcher = vi.fn().mockResolvedValue(primitive);
        const { result } = renderHook(() => useAsyncData(fetcher));

        await waitFor(() => {
          expect(result.current.data).toBe(primitive);
        });
      }
    });
  });
});

