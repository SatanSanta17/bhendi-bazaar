/**
 * Server-side domain types for Profile
 * 
 * These types are used exclusively on the server-side (services, repositories).
 * They mirror the database schema and contain server-specific logic.
 */
export interface Address {
  id: string;
  label?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface ServerUserProfile {
  id: string;
  userId: string;
  profilePic: string | null;
  addresses: Address[];
}

export interface ServerUser {
  id: string;
  name: string | null;
  email: string | null;
  mobile: string | null;
  isEmailVerified: boolean;
  emailVerifiedAt: Date | null;
}

export interface ServerProfileData {
  user: ServerUser;
  profile: ServerUserProfile;
}

export interface UpdateProfileInput {
  // User fields
  name?: string;
  email?: string;
  mobile?: string;
  // Profile fields
  addresses?: Address[];
  profilePic?: string | null;
}

