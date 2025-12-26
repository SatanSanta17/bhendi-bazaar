/**
 * useMutation Hook Tests
 *
 * Tests for the generic mutation hook
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, cleanup, act } from '@testing-library/react';
import { useMutation } from '@/hooks/core/useMutation';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic mutation', () => {
    it('should mutate data successfully', async () => {
      const mockResult = { id: 1, name: 'Updated' };
      const mutationFn = vi.fn().mockResolvedValue(mockResult);

      const { result } = renderHook(() => useMutation(mutationFn, { showToast: false }));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);

      let mutateResult;
      await act(async () => {
        mutateResult = await result.current.mutate({ name: 'Test' });
      });

      expect(mutateResult).toEqual(mockResult);
      expect(result.current.data).toEqual(mockResult);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mutationFn).toHaveBeenCalledWith({ name: 'Test' });
    });

    it('should handle mutation error', async () => {
      const error = new Error('Mutation failed');
      const mutationFn = vi.fn().mockRejectedValue(error);

      const { result } = renderHook(() => useMutation(mutationFn, { showToast: false }));

      // Use act and catch the error
      let caughtError;
      await act(async () => {
        try {
          await result.current.mutate({ id: 1 });
        } catch (err) {
          caughtError = err;
        }
      });

      // Verify error was thrown
      expect(caughtError).toBe(error);
      
      // State should be updated after act completes
      expect(result.current.error).toBe('Mutation failed');
      expect(result.current.data).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading to false after mutation completes', async () => {
      const mutationFn = vi.fn().mockResolvedValue({ data: 'test' });

      const { result } = renderHook(() => useMutation(mutationFn, { showToast: false }));

      await act(async () => {
        await result.current.mutate({ id: 1 });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle non-Error exceptions', async () => {
      const mutationFn = vi.fn().mockRejectedValue('String error');

      const { result } = renderHook(() => useMutation(mutationFn, { showToast: false }));

      // Use act and catch the error
      let caughtError;
      await act(async () => {
        try {
          await result.current.mutate({ id: 1 });
        } catch (err) {
          caughtError = err;
        }
      });

      // Verify error was thrown
      expect(caughtError).toBe('String error');
      
      // State should show generic error message
      expect(result.current.error).toBe('An error occurred');
    });
  });

  describe('Callbacks', () => {
    it('should call onSuccess callback with data', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mutationFn = vi.fn().mockResolvedValue(mockData);
      const onSuccess = vi.fn();

      const { result } = renderHook(() =>
        useMutation(mutationFn, { onSuccess, showToast: false })
      );

      await act(async () => {
        await result.current.mutate({ id: 1 });
      });

      expect(onSuccess).toHaveBeenCalledWith(mockData);
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('should call onError callback on failure', async () => {
      const error = new Error('Test error');
      const mutationFn = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();

      const { result } = renderHook(() =>
        useMutation(mutationFn, { onError, showToast: false })
      );

      await expect(async () => {
        await act(async () => {
          await result.current.mutate({ id: 1 });
        });
      }).rejects.toThrow();

      expect(onError).toHaveBeenCalledWith(error);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('should not call onSuccess on error', async () => {
      const mutationFn = vi.fn().mockRejectedValue(new Error('Failed'));
      const onSuccess = vi.fn();

      const { result } = renderHook(() =>
        useMutation(mutationFn, { onSuccess, showToast: false })
      );

      await expect(async () => {
        await act(async () => {
          await result.current.mutate({ id: 1 });
        });
      }).rejects.toThrow();

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should not call onError on success', async () => {
      const mutationFn = vi.fn().mockResolvedValue({ data: 'test' });
      const onError = vi.fn();

      const { result } = renderHook(() =>
        useMutation(mutationFn, { onError, showToast: false })
      );

      await act(async () => {
        await result.current.mutate({ id: 1 });
      });

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('Toast notifications', () => {
    it('should show success toast with custom message', async () => {
      const mutationFn = vi.fn().mockResolvedValue({ data: 'test' });
      const successMessage = 'Operation successful!';

      const { result } = renderHook(() =>
        useMutation(mutationFn, { successMessage })
      );

      await act(async () => {
        await result.current.mutate({ id: 1 });
      });

      expect(toast.success).toHaveBeenCalledWith(successMessage);
    });

    it('should show error toast with custom message', async () => {
      const mutationFn = vi.fn().mockRejectedValue(new Error('Failed'));
      const errorMessage = 'Operation failed!';

      const { result } = renderHook(() =>
        useMutation(mutationFn, { errorMessage })
      );

      await expect(async () => {
        await act(async () => {
          await result.current.mutate({ id: 1 });
        });
      }).rejects.toThrow();

      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });

    it('should not show toast when showToast is false', async () => {
      const mutationFn = vi.fn().mockResolvedValue({ data: 'test' });

      const { result} = renderHook(() =>
        useMutation(mutationFn, {
          successMessage: 'Success',
          showToast: false,
        })
      );

      await act(async () => {
        await result.current.mutate({ id: 1 });
      });

      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('Multiple mutations', () => {
    it('should handle sequential mutations', async () => {
      const mutationFn = vi.fn()
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce({ id: 2 });

      const { result } = renderHook(() =>
        useMutation(mutationFn, { showToast: false })
      );

      await act(async () => {
        await result.current.mutate({ name: 'First' });
      });
      expect(result.current.data).toEqual({ id: 1 });

      await act(async () => {
        await result.current.mutate({ name: 'Second' });
      });
      expect(result.current.data).toEqual({ id: 2 });

      expect(mutationFn).toHaveBeenCalledTimes(2);
    });

    it('should clear error on successful retry', async () => {
      const mutationFn = vi.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({ data: 'success' });

      const { result } = renderHook(() =>
        useMutation(mutationFn, { showToast: false })
      );

      // First mutation fails - catch error
      let caughtError;
      await act(async () => {
        try {
          await result.current.mutate({ id: 1 });
        } catch (err) {
          caughtError = err;
        }
      });

      // Verify error was caught and state was set
      expect(caughtError).toBeDefined();
      expect(result.current.error).toBe('First error');

      // Second mutation succeeds
      await act(async () => {
        await result.current.mutate({ id: 1 });
      });

      expect(result.current.error).toBe(null);
      expect(result.current.data).toEqual({ data: 'success' });
    });
  });

  describe('Reset functionality', () => {
    it('should reset data, error, and loading state', async () => {
      const mutationFn = vi.fn().mockResolvedValue({ data: 'test' });

      const { result } = renderHook(() =>
        useMutation(mutationFn, { showToast: false })
      );

      await act(async () => {
        await result.current.mutate({ id: 1 });
      });

      expect(result.current.data).toEqual({ data: 'test' });

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    it('should reset error state', async () => {
      const mutationFn = vi.fn().mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() =>
        useMutation(mutationFn, { showToast: false })
      );

      // Catch error
      let caughtError;
      await act(async () => {
        try {
          await result.current.mutate({ id: 1 });
        } catch (err) {
          caughtError = err;
        }
      });

      // Verify error was caught and state was set
      expect(caughtError).toBeDefined();
      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.data).toBe(null);
    });
  });

  describe('Edge cases', () => {
    it('should handle complex variables', async () => {
      const complexVariables = {
        id: 1,
        nested: {
          field: 'value',
          array: [1, 2, 3],
        },
        flag: true,
      };
      const mutationFn = vi.fn().mockResolvedValue({ success: true });

      const { result } = renderHook(() =>
        useMutation(mutationFn, { showToast: false })
      );

      await act(async () => {
        await result.current.mutate(complexVariables);
      });

      expect(mutationFn).toHaveBeenCalledWith(complexVariables);
      expect(result.current.data).toEqual({ success: true });
    });
  });
});
