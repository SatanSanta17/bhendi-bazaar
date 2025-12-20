import type {
    ProfileData,
    ProfileRepository,
    UpdateProfileInput,
  } from "@/domain/profile";
  
  const USE_MOCK = false; // Profile always uses real API (authenticated)
  
  /**
   * API-based profile repository
   * Fetches from /api/profile which requires authentication
   */
  class ApiProfileRepository implements ProfileRepository {
    async getProfile(): Promise<ProfileData> {
      const res = await fetch("/api/profile", {
        credentials: "include", // Include session cookies
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Unauthorized - please sign in");
        }
        throw new Error(`Failed to load profile: ${res.statusText}`);
      }
      
      return res.json();
    }
  
    async updateProfile(input: UpdateProfileInput): Promise<ProfileData> {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: "include", // Include session cookies
        body: JSON.stringify(input),
      });
  
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Unauthorized - please sign in");
        }
        throw new Error(`Failed to update profile: ${res.statusText}`);
      }
  
      return res.json();
    }
  }
  
  /**
   * Mock profile repository for testing/development
   * Uses localStorage to simulate API behavior
   */
  class MockProfileRepository implements ProfileRepository {
    private STORAGE_KEY = "bhendi-bazaar-profile";
  
    async getProfile(): Promise<ProfileData> {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));
  
      if (typeof window === "undefined") {
        throw new Error("Mock repository only works in browser");
      }
  
      const stored = window.localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as ProfileData;
        } catch {
          // Fall through to default
        }
      }
  
      // Default mock data
      const defaultData: ProfileData = {
        user: {
          id: "mock-user-1",
          name: "Test User",
          email: "test@example.com",
          mobile: "9876543210",
        },
        profile: {
          id: "mock-profile-1",
          userId: "mock-user-1",
          profilePic: null,
          addresses: [
            {
              id: "addr-1",
              label: "Home",
              name: "Test User",
              line1: "123 Mock Street",
              line2: "Bhendi Bazaar",
              city: "Mumbai",
              state: "Maharashtra",
              country: "India",
              postalCode: "400003",
              phone: "9876543210",
              isDefault: true,
            },
          ],
        },
      };
  
      return defaultData;
    }
  
    async updateProfile(input: UpdateProfileInput): Promise<ProfileData> {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
  
      const current = await this.getProfile();
  
      // Merge updates
      const updated: ProfileData = {
        user: {
          ...current.user,
          ...(input.name !== undefined && { name: input.name }),
          ...(input.email !== undefined && { email: input.email }),
          ...(input.mobile !== undefined && { mobile: input.mobile }),
        },
        profile: {
          ...current.profile,
          ...(input.addresses !== undefined && { addresses: input.addresses }),
          ...(input.profilePic !== undefined && { profilePic: input.profilePic }),
        },
      };
  
      // Persist to localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      }
  
      return updated;
    }
  }
  
  export const profileRepository: ProfileRepository = USE_MOCK
    ? new MockProfileRepository()
    : new ApiProfileRepository();