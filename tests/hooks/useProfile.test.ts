/**
 * useProfile Hook Tests
 *
 * Comprehensive tests for profile management including loading, updating,
 * error handling, and edge cases
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useProfile } from '@/hooks/useProfile';
import { createMockUser } from '../utils/mock-factories';

// Mock fetch
global.fetch = vi.fn();

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockProfileData = {
    user: createMockUser(),
    profile: {
      id: 'profile-1',
      userId: 'user-1',
      profilePic: 'https://example.com/pic.jpg',
      mobile: '9876543210',
      addresses: [
        {
          id: 'addr-1',
          name: 'Home',
          phone: '9876543210',
          line1: '123 Street',
          line2: '',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
          isDefault: true,
        },
      ],
    },
  };

  describe('Profile Loading', () => {
    it('should fetch profile on mount when authenticated', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfileData,
      });

      const { result } = renderHook(() => useProfile(true));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockProfileData.user);
      expect(result.current.profile).toEqual(mockProfileData.profile);
      expect(global.fetch).toHaveBeenCalledWith('/api/profile', {
        credentials: 'include',
      });
    });

    it('should not fetch when unauthenticated', async () => {
      const { result } = renderHook(() => useProfile(false));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.profile).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle profile fetch error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(() => useProfile(true));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error).toContain('Failed to load profile');
      expect(result.current.user).toBeNull();
    });

    it('should handle 401 unauthorized', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const { result } = renderHook(() => useProfile(true));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error).toContain('Unauthorized');
    });

    it('should handle network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useProfile(true));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error).toContain('Network error');
    });

    it('should cache profile data', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfileData,
      });

      const { result, rerender } = renderHook(() => useProfile(true));

      await waitFor(() => {
        expect(result.current.user).toEqual(mockProfileData.user);
      });

      vi.clearAllMocks();

      // Rerender should not refetch
      rerender();

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Profile Update Operations', () => {
    it('should update profile successfully', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProfileData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockProfileData,
            user: { ...mockProfileData.user, name: 'Updated Name' },
          }),
        });

      const { result } = renderHook(() => useProfile(true));

      await waitFor(() => {
        expect(result.current.user).toBeDefined();
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateUserInfo({ name: 'Updated Name' });
      });

      expect(result.current.user?.name).toBe('Updated Name');
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/profile',
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });

    it('should update addresses', async () => {
      const newAddresses = [
        ...mockProfileData.profile.addresses,
        {
          id: 'addr-2',
          name: 'Office',
          phone: '9123456789',
          line1: '456 Avenue',
          line2: '',
          city: 'Delhi',
          state: 'Delhi',
          postalCode: '110001',
          country: 'India',
          isDefault: false,
        },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProfileData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockProfileData,
            profile: { ...mockProfileData.profile, addresses: newAddresses },
          }),
        });

      const { result } = renderHook(() => useProfile(true));

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateAddresses(newAddresses);
      });

      expect(result.current.profile?.addresses).toHaveLength(2);
    });

    it('should set saving state during update', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProfileData,
        })
        .mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    ok: true,
                    json: async () => mockProfileData,
                  }),
                100
              )
            )
        );

      const { result } = renderHook(() => useProfile(true));

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.saving).toBe(false);

      act(() => {
        result.current.updateProfile({ mobile: '9999999999' });
      });

      expect(result.current.saving).toBe(true);

      await waitFor(() => {
        expect(result.current.saving).toBe(false);
      });
    });

    it('should handle update failure', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProfileData,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Invalid data' }),
        });

      const { result } = renderHook(() => useProfile(true));

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.updateProfile({ mobile: 'invalid' });
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toContain('Invalid data');
    });

    it('should handle 401 during update', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProfileData,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

      const { result } = renderHook(() => useProfile(true));

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.updateProfile({ mobile: '9999999999' });
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toContain('Unauthorized');
    });

    it('should update profile picture', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProfileData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockProfileData,
            profile: {
              ...mockProfileData.profile,
              profilePic: 'https://example.com/new-pic.jpg',
            },
          }),
        });

      const { result } = renderHook(() => useProfile(true));

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateProfilePic('https://example.com/new-pic.jpg');
      });

      expect(result.current.profile?.profilePic).toBe(
        'https://example.com/new-pic.jpg'
      );
    });
  });

  describe('Refetch Functionality', () => {
    it('should refetch profile data', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProfileData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockProfileData,
            user: { ...mockProfileData.user, name: 'Refreshed Name' },
          }),
        });

      const { result } = renderHook(() => useProfile(true));

      await waitFor(() => {
        expect(result.current.user).toBeDefined();
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user?.name).toBe(mockProfileData.user.name);

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.user?.name).toBe('Refreshed Name');
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should throw error when updating without profile data', async () => {
      const { result } = renderHook(() => useProfile(false));

      await expect(
        result.current.updateProfile({ mobile: '9999999999' })
      ).rejects.toThrow('No profile data loaded');
    });

    it('should handle auth status change from false to true', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockProfileData,
      });

      const { result, rerender } = renderHook(
        ({ auth }) => useProfile(auth),
        { initialProps: { auth: false } }
      );

      expect(result.current.user).toBeNull();

      rerender({ auth: true });

      await waitFor(() => {
        expect(result.current.user).toBeDefined();
      });
    });

    it('should clear data when auth status changes to false', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockProfileData,
      });

      const { result, rerender } = renderHook(
        ({ auth }) => useProfile(auth),
        { initialProps: { auth: true } }
      );

      await waitFor(() => {
        expect(result.current.user).toBeDefined();
      });

      rerender({ auth: false });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });
    });

    it('should handle malformed JSON response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      });

      const { result } = renderHook(() => useProfile(true));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });
});

