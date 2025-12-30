/**
 * Auth Test Helpers
 * 
 * Helper functions for authentication and password testing
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';

/**
 * Create a test user with specified options
 */
export async function createTestUser(options: {
  email?: string;
  name?: string;
  password?: string;
  verified?: boolean;
  hasPassword?: boolean;
  mobile?: string;
}): Promise<User> {
  const {
    email = `test-${Date.now()}-${Math.random()}@example.com`,
    name = 'Test User',
    password = 'Test1234',
    verified = false,
    hasPassword = true,
    mobile = null,
  } = options;

  const passwordHash = hasPassword ? await bcrypt.hash(password, 10) : null;

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      isEmailVerified: verified,
      emailVerified: verified ? new Date() : null,
      mobile,
    },
  });

  return user;
}

/**
 * Create a verification token for a user
 */
export async function createVerificationToken(
  userId: string,
  expiryHours: number = 24
): Promise<{ token: string; expires: Date }> {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      identifier: userId,
      token,
      expires,
    },
  });

  return { token, expires };
}

/**
 * Create a password reset token for a user
 */
export async function createPasswordResetToken(
  userId: string,
  expiryHours: number = 1
): Promise<{ token: string; expires: Date }> {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      identifier: `password-reset:${userId}`,
      token,
      expires,
    },
  });

  return { token, expires };
}

/**
 * Hash a password for test data (same method as production)
 */
export async function hashPasswordForTest(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password with hash (for verification in tests)
 */
export async function comparePasswordForTest(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Clean up test user by email
 */
export async function cleanupTestUser(email: string): Promise<void> {
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: {
        in: await prisma.user
          .findMany({ where: { email }, select: { id: true } })
          .then((users) => users.map((u) => u.id)),
      },
    },
  });

  await prisma.user.deleteMany({
    where: { email },
  });
}

/**
 * Clean up test user by ID
 */
export async function cleanupTestUserById(userId: string): Promise<void> {
  await prisma.verificationToken.deleteMany({
    where: { identifier: userId },
  });

  // Also delete password-reset tokens
  await prisma.verificationToken.deleteMany({
    where: { identifier: `password-reset:${userId}` },
  });

  // Delete user if exists
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
  } catch (error) {
    // User might not exist, ignore
  }
}

/**
 * Get all verification tokens for a user
 */
export async function getVerificationTokensForUser(
  userId: string
): Promise<Array<{ token: string; expires: Date }>> {
  const tokens = await prisma.verificationToken.findMany({
    where: { identifier: userId },
    select: { token: true, expires: true },
  });

  return tokens;
}

/**
 * Check if a verification token exists
 */
export async function verificationTokenExists(token: string): Promise<boolean> {
  const result = await prisma.verificationToken.findUnique({
    where: { token },
  });

  return result !== null;
}

/**
 * Create an expired verification token
 */
export async function createExpiredVerificationToken(
  userId: string
): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() - 1000); // 1 second in the past

  await prisma.verificationToken.create({
    data: {
      identifier: userId,
      token,
      expires,
    },
  });

  return token;
}

/**
 * Create an expired password reset token
 */
export async function createExpiredPasswordResetToken(
  userId: string
): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() - 1000); // 1 second in the past

  await prisma.verificationToken.create({
    data: {
      identifier: `password-reset:${userId}`,
      token,
      expires,
    },
  });

  return token;
}

/**
 * Mock authenticated session for testing
 */
export function createMockSession(user: Partial<User>) {
  return {
    user: {
      id: user.id || 'user-1',
      name: user.name || 'Test User',
      email: user.email || 'test@example.com',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Wait for async operations (useful for testing email sending, etc.)
 */
export function waitForAsync(ms: number = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

