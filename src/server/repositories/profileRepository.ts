/**
 * Server-side Profile Repository
 *
 * This repository handles all database operations for user profiles.
 * It uses Prisma to interact with the PostgreSQL database.
 */

import { prisma } from "@/lib/prisma";
import type {
  ServerProfileData,
  UpdateProfileInput,
  ProfileAddress,
} from "@/server/domain/profile";

/**
 * Helper to normalize addresses from database JSON
 */
function normalizeAddresses(addresses: unknown): ProfileAddress[] {
  if (!addresses) return [];
  if (Array.isArray(addresses)) {
    return addresses as ProfileAddress[];
  }
  return [];
}

export class ProfileRepository {
  /**
   * Get user profile by user ID
   * Creates a profile if it doesn't exist
   */
  async getByUserId(userId: string): Promise<ServerProfileData | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return null;
    }

    // Create profile if it doesn't exist
    const profile =
      user.profile ??
      (await prisma.profile.create({
        data: {
          userId: user.id,
          addresses: [],
        },
      }));

    return {
      user: {
        id: user.id,
        name: user.name ?? null,
        email: user.email ?? null,
        mobile: user.mobile ?? null,
      },
      profile: {
        id: profile.id,
        userId: profile.userId,
        profilePic: profile.profilePic,
        addresses: normalizeAddresses(profile.addresses),
      },
    };
  }

  /**
   * Update user and profile information
   */
  async update(
    userId: string,
    input: UpdateProfileInput
  ): Promise<ServerProfileData> {
    const { name, email, mobile, profilePic, addresses } = input;

    // Update User table if user fields are provided
    if (name !== undefined || email !== undefined || mobile !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name !== undefined && { name }),
          ...(email !== undefined && { email }),
          ...(mobile !== undefined && { mobile }),
        },
      });
    }

    // Get the user with profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Update or create profile
    const nextProfile = await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        profilePic: profilePic ?? null,
        addresses: (addresses ?? []) as any,
      },
      update: {
        ...(profilePic !== undefined && { profilePic }),
        ...(addresses !== undefined && { addresses: addresses as any }),
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name ?? null,
        email: user.email ?? null,
        mobile: user.mobile ?? null,
      },
      profile: {
        id: nextProfile.id,
        userId: nextProfile.userId,
        profilePic: nextProfile.profilePic,
        addresses: normalizeAddresses(nextProfile.addresses),
      },
    };
  }

  /**
   * Delete user profile
   */
  async delete(userId: string): Promise<void> {
    await prisma.profile.delete({
      where: { userId },
    });
  }
}

export const profileRepository = new ProfileRepository();
