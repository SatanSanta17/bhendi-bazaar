"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  ProfileAddress,
  ProfileData,
  UpdateProfileInput,
  User,
  UserProfile,
} from "@/domain/profile";
import { profileRepository } from "@/server/repositories/profileRepository";

interface UseProfileReturn {
  // Data
  user: User | null;
  profile: UserProfile | null;
  
  // State
  loading: boolean;
  error: string | null;
  saving: boolean;
  
  // Actions
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  updateAddresses: (addresses: ProfileAddress[]) => Promise<void>;
  updateUserInfo: (input: { name?: string; email?: string; mobile?: string }) => Promise<void>;
  updateProfilePic: (profilePic: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useProfile(isAuthenticated: boolean): UseProfileReturn {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const profileData = await profileRepository.getProfile();
      setData(profileData);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Unable to load your profile right now."
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch profile on mount or when auth status changes
  useEffect(() => {
    let cancelled = false;

    if (isAuthenticated) {
      fetchProfile().catch(() => {
        if (!cancelled) {
          setError("Failed to load profile");
        }
      });
    } else {
      setData(null);
      setError(null);
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, fetchProfile]);

  // Generic update function
  const updateProfile = useCallback(
    async (input: UpdateProfileInput) => {
      if (!data) {
        throw new Error("No profile data loaded");
      }

      try {
        setSaving(true);
        setError(null);
        const updated = await profileRepository.updateProfile(input);
        setData(updated);
      } catch (err) {
        console.error("Failed to update profile:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Unable to save changes. Please try again.";
        setError(errorMessage);
        throw err; // Re-throw so callers can handle
      } finally {
        setSaving(false);
      }
    },
    [data]
  );

  // Convenience method: update addresses only
  const updateAddresses = useCallback(
    async (addresses: ProfileAddress[]) => {
      await updateProfile({ addresses });
    },
    [updateProfile]
  );

  // Convenience method: update user info only
  const updateUserInfo = useCallback(
    async (input: { name?: string; email?: string; mobile?: string }) => {
      await updateProfile(input);
    },
    [updateProfile]
  );

  // Convenience method: update profile pic only
  const updateProfilePic = useCallback(
    async (profilePic: string) => {
      await updateProfile({ profilePic });
    },
    [updateProfile]
  );

  return {
    user: data?.user ?? null,
    profile: data?.profile ?? null,
    loading,
    error,
    saving,
    updateProfile,
    updateAddresses,
    updateUserInfo,
    updateProfilePic,
    refetch: fetchProfile,
  };
}