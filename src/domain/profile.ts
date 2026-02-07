/**
 * Client-side domain types for Profile
 *
 * These types are used on the client-side (components, hooks).
 * They mirror the API response structure and are used for type safety.
 */


export interface Address {
  id: string;
  label?: string;
  isDefault: boolean;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  metadata?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  userId: string;
  profilePic: string | null;
  addresses: Address[];
}

// User fields relevant to profile editing
export interface User {
  id: string;
  name: string | null;
  email: string | null;
  mobile: string | null;
  isEmailVerified: boolean;
  emailVerifiedAt: Date | null;
}

// Aggregate root - combines user + profile for this context
export interface ProfileData {
  user: User;
  profile: UserProfile;
}

// Update inputs for client-side forms
export interface UpdateProfileInput {
  // User fields
  name?: string;
  email?: string;
  mobile?: string;
  // Profile fields
  addresses?: Address[];
  profilePic?: string | null;
}