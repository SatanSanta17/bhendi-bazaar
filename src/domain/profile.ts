/**
 * Client-side domain types for Profile
 *
 * These types are used on the client-side (components, hooks).
 * They mirror the API response structure and are used for type safety.
 */

import { DeliveryAddress } from "@/components/checkoutContainer/types";

export interface ProfileAddress extends DeliveryAddress {
  id: string;
  label?: string;
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  userId: string;
  profilePic: string | null;
  addresses: ProfileAddress[];
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
  addresses?: ProfileAddress[];
  profilePic?: string | null;
}