/**
 * Server-side Profile Service
 * 
 * This service encapsulates all business logic related to user profiles.
 * It acts as an intermediary between API routes and the repository layer.
 */

import { profileRepository } from "@/server/repositories/profileRepository";
import type {
  ServerProfileData,
  UpdateProfileInput,
} from "@/server/domain/profile";

export class ProfileService {
  /**
   * Get profile for a user
   */
  async getProfile(userId: string): Promise<ServerProfileData> {
    const profile = await profileRepository.getByUserId(userId);
    
    if (!profile) {
      throw new Error("User not found");
    }
    
    return profile;
  }

  /**
   * Update user profile with validation
   */
  async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<ServerProfileData> {
    // Validate input
    this.validateUpdateInput(input);
    
    // Update profile
    const updated = await profileRepository.update(userId, input);
    
    return updated;
  }

  /**
   * Delete user profile
   */
  async deleteProfile(userId: string): Promise<void> {
    await profileRepository.delete(userId);
  }

  /**
   * Validate update input
   */
  private validateUpdateInput(input: UpdateProfileInput): void {
    // Validate email format if provided
    if (input.email !== undefined && input.email !== null) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        throw new Error("Invalid email format");
      }
    }

    // Validate mobile format if provided (basic validation)
    if (input.mobile !== undefined && input.mobile !== null) {
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(input.mobile)) {
        throw new Error("Mobile number must be 10 digits");
      }
    }

    // Validate addresses if provided
    if (input.addresses !== undefined && input.addresses !== null) {
      if (!Array.isArray(input.addresses)) {
        throw new Error("Addresses must be an array");
      }

      for (const address of input.addresses) {
        if (!address.name || !address.line1 || !address.city || !address.country || !address.postalCode || !address.phone) {
          throw new Error("Address is missing required fields");
        }
      }
    }

    // Validate profile picture URL if provided
    if (input.profilePic !== undefined && input.profilePic !== null) {
      try {
        new URL(input.profilePic);
      } catch {
        throw new Error("Profile picture must be a valid URL");
      }
    }
  }
}

export const profileService = new ProfileService();

