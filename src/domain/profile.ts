export interface ProfileAddress {
  id: string;
  label: string;
  name: string; // name of the recipient for this address.
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  phone: string; // contact number for this address.
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
}

// Aggregate root - combines user + profile for this context
export interface ProfileData {
  user: User;
  profile: UserProfile;
}

// Update inputs
export interface UpdateProfileInput {
  // User fields
  name?: string;
  email?: string;
  mobile?: string;
  // Profile fields
  addresses?: ProfileAddress[];
  profilePic?: string | null;
}

// Repository interface for profile management
export interface ProfileRepository {
  getProfile(): Promise<ProfileData>;
  updateProfile(input: UpdateProfileInput): Promise<ProfileData>;
}