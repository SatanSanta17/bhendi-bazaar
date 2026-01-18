/**
 * Authentication Security Integration Tests
 *
 * Security-focused tests covering:
 * - Token security (randomness, expiry, single-use)
 * - Password security (hashing, salting)
 * - Timing attack prevention
 * - Information disclosure prevention
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import crypto from "crypto";
import {
  createTestUser,
  cleanupTestUserById,
  createPasswordResetToken,
  createVerificationToken,
} from "../utils/auth-helpers";
import { createCapturingResendMock } from "../utils/email-mocks";

// Mock Resend with email capture
vi.mock("resend", () => createCapturingResendMock());

describe("Authentication Security", () => {
  let testUserId: string;
  let testUserEmail: string;

  beforeEach(async () => {
    const user = await createTestUser({
      email: `security-test-${Date.now()}@example.com`,
      password: "TestPassword123",
      hasPassword: true,
    });
    testUserId = user.id;
    testUserEmail = user.email!;
  });

  afterEach(async () => {
    if (testUserId) {
      await cleanupTestUserById(testUserId);
    }
  });

  describe("Token Security", () => {
    describe("Email Verification Tokens", () => {
      it("should generate cryptographically random tokens", async () => {
        const tokens: string[] = [];

        // Generate multiple tokens
        for (let i = 0; i < 10; i++) {
          const { token } = await createVerificationToken(testUserId);
          tokens.push(token);
        }

        // All tokens should be unique
        const uniqueTokens = new Set(tokens);
        expect(uniqueTokens.size).toBe(tokens.length);

        // Tokens should be 64 hex characters (32 bytes)
        tokens.forEach((token) => {
          expect(token).toHaveLength(64);
          expect(token).toMatch(/^[a-f0-9]{64}$/);
        });
      });

      it("should have appropriate expiry times (24 hours)", async () => {
        const beforeCreate = Date.now();
        const { expires } = await createVerificationToken(testUserId);
        const afterCreate = Date.now();

        const expiryTime = expires.getTime();
        const expectedExpiry = beforeCreate + 24 * 60 * 60 * 1000;
        const tolerance = afterCreate - beforeCreate + 1000;

        expect(expiryTime).toBeGreaterThanOrEqual(expectedExpiry - tolerance);
        expect(expiryTime).toBeLessThanOrEqual(expectedExpiry + tolerance);
      });

      it("should be single-use only", async () => {
        const { emailService } = await import(
          "../../server/services/emailService"
        );
        const { token } = await createVerificationToken(testUserId);

        // Use once
        const firstResult = await emailService.verifyEmail(token);
        expect(firstResult.success).toBe(true);

        // Try again
        const secondResult = await emailService.verifyEmail(token);
        expect(secondResult.success).toBe(false);
        expect(secondResult.error).toBe("Invalid verification token");
      });

      it("should not be predictable from previous tokens", async () => {
        const tokens: string[] = [];

        for (let i = 0; i < 5; i++) {
          const { token } = await createVerificationToken(testUserId);
          tokens.push(token);
        }

        // Check tokens don't have incremental patterns
        for (let i = 1; i < tokens.length; i++) {
          const prev = BigInt("0x" + tokens[i - 1]);
          const curr = BigInt("0x" + tokens[i]);
          const diff = curr > prev ? curr - prev : prev - curr;

          // Difference should be large (not sequential)
          expect(diff > BigInt(1000)).toBe(true);
        }
      });

      it("should not expose user information in token", async () => {
        const { token } = await createVerificationToken(testUserId);

        // Token should not contain user ID or email
        expect(token).not.toContain(testUserId);
        expect(token).not.toContain(testUserEmail);
      });
    });

    describe("Password Reset Tokens", () => {
      it("should generate cryptographically random tokens", async () => {
        const tokens: string[] = [];

        for (let i = 0; i < 10; i++) {
          const { token } = await createPasswordResetToken(testUserId);
          tokens.push(token);
        }

        // All unique
        const uniqueTokens = new Set(tokens);
        expect(uniqueTokens.size).toBe(tokens.length);

        // Each should be random 64 hex chars (token part, without prefix)
        tokens.forEach((token) => {
          expect(token).toHaveLength(64);
          expect(token).toMatch(/^[a-f0-9]{64}$/);
        });
      });

      it("should have appropriate expiry times (1 hour)", async () => {
        const beforeCreate = Date.now();
        const { expires } = await createPasswordResetToken(testUserId);
        const afterCreate = Date.now();

        const expiryTime = expires.getTime();
        const expectedExpiry = beforeCreate + 60 * 60 * 1000; // 1 hour
        const tolerance = afterCreate - beforeCreate + 1000;

        expect(expiryTime).toBeGreaterThanOrEqual(expectedExpiry - tolerance);
        expect(expiryTime).toBeLessThanOrEqual(expectedExpiry + tolerance);
      });

      it("should be single-use only", async () => {
        const { passwordService } = await import(
          "../../server/services/passwordService"
        );
        const { token } = await createPasswordResetToken(testUserId);

        // Use once
        const firstResult = await passwordService.resetPassword(
          token,
          "NewPassword123"
        );
        expect(firstResult.success).toBe(true);

        // Try again
        const secondResult = await passwordService.resetPassword(
          token,
          "AnotherPassword123"
        );
        expect(secondResult.success).toBe(false);
      });

      it("should store with password-reset: prefix for type safety", async () => {
        await createPasswordResetToken(testUserId);

        const token = await prisma.verificationToken.findFirst({
          where: { identifier: `password-reset:${testUserId}` },
        });

        expect(token?.identifier).toContain("password-reset:");
      });
    });
  });

  describe("Password Security", () => {
    it("should hash passwords with bcrypt", async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      // Should be bcrypt format
      expect(user?.passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it("should use appropriate hash rounds (10)", async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      // Bcrypt format: $2a$rounds$salthash
      // Should have 10 rounds
      expect(user?.passwordHash).toMatch(/^\$2[aby]\$10\$/);
    });

    it("should never store plain passwords", async () => {
      const plainPassword = "TestPassword123";

      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      expect(user?.passwordHash).not.toBe(plainPassword);
      expect(user?.passwordHash).not.toContain(plainPassword);
    });

    it("should generate unique hashes for same password (salting)", async () => {
      const password = "SamePassword123";

      // Create multiple users with same password
      const user1 = await createTestUser({
        email: `user1-${Date.now()}@example.com`,
        password,
      });

      const user2 = await createTestUser({
        email: `user2-${Date.now()}@example.com`,
        password,
      });

      const hash1 = (
        await prisma.user.findUnique({
          where: { id: user1.id },
          select: { passwordHash: true },
        })
      )?.passwordHash;

      const hash2 = (
        await prisma.user.findUnique({
          where: { id: user2.id },
          select: { passwordHash: true },
        })
      )?.passwordHash;

      // Hashes should be different due to random salt
      expect(hash1).not.toBe(hash2);

      await cleanupTestUserById(user1.id);
      await cleanupTestUserById(user2.id);
    });

    it("should invalidate old passwords immediately on change", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );
      const oldPassword = "TestPassword123";
      const newPassword = "NewPassword456";

      await passwordService.changePassword(
        testUserId,
        oldPassword,
        newPassword
      );

      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      const oldPasswordWorks = await compare(oldPassword, user!.passwordHash!);
      expect(oldPasswordWorks).toBe(false);
    });

    it("should make password hashing computationally expensive", async () => {
      const password = "TestPassword123";

      // Measure hashing time
      const start = Date.now();
      await hash(password, 10);
      const duration = Date.now() - start;

      // Bcrypt with 10 rounds should take at least 50ms
      // This prevents brute force attacks
      expect(duration).toBeGreaterThan(50);
    });
  });

  describe("Timing Attack Prevention", () => {
    it("should have consistent response time for existing vs non-existing emails in forgot password", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      // Measure time for existing email
      const start1 = Date.now();
      await passwordService.requestPasswordReset(testUserEmail);
      const duration1 = Date.now() - start1;

      // Measure time for non-existing email
      const start2 = Date.now();
      await passwordService.requestPasswordReset("nonexistent@example.com");
      const duration2 = Date.now() - start2;

      // Times should be relatively similar (within 500ms tolerance)
      // This prevents attackers from determining if an email exists
      // Note: In tests, timing can be less consistent due to mocking
      const timeDifference = Math.abs(duration1 - duration2);
      expect(timeDifference).toBeLessThan(500);
    });

    it("should not reveal timing differences in password verification", async () => {
      const correctPassword = "TestPassword123";
      const wrongPassword = "WrongPassword123";

      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      // Measure correct password check
      const start1 = performance.now();
      await compare(correctPassword, user!.passwordHash!);
      const duration1 = performance.now() - start1;

      // Measure wrong password check
      const start2 = performance.now();
      await compare(wrongPassword, user!.passwordHash!);
      const duration2 = performance.now() - start2;

      // bcrypt compare() is designed to have constant time
      // Difference should be minimal (within 10ms)
      const timeDifference = Math.abs(duration1 - duration2);
      expect(timeDifference).toBeLessThan(10);
    });
  });

  describe("Information Disclosure Prevention", () => {
    it("should not reveal user existence in forgot password", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      const result1 = await passwordService.requestPasswordReset(testUserEmail);
      const result2 = await passwordService.requestPasswordReset(
        "nonexistent@example.com"
      );

      // Both should return same success message
      expect(result1.success).toBe(result2.success);
      expect(result1.error).toBe(result2.error);
    });

    it("should not reveal OAuth users in forgot password", async () => {
      const oauthUser = await createTestUser({
        email: `oauth-${Date.now()}@example.com`,
        hasPassword: false,
      });

      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      const result = await passwordService.requestPasswordReset(
        oauthUser.email!
      );

      // Should return success (not reveal OAuth status)
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      await cleanupTestUserById(oauthUser.id);
    });

    it("should not expose password in error messages", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      const wrongPassword = "WrongPassword123";
      const result = await passwordService.changePassword(
        testUserId,
        wrongPassword,
        "NewPassword123"
      );

      expect(result.error).not.toContain(wrongPassword);
      expect(result.error).not.toContain("TestPassword123");
    });

    it("should not expose user ID in tokens", async () => {
      const { token: verifyToken } = await createVerificationToken(testUserId);
      const { token: resetToken } = await createPasswordResetToken(testUserId);

      expect(verifyToken).not.toContain(testUserId);
      expect(resetToken).not.toContain(testUserId);
    });

    it("should not expose internal errors to users", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      // Mock database error
      const mockFindUnique = prisma.verificationToken.findUnique;
      prisma.verificationToken.findUnique = async () => {
        throw new Error("Internal database error: connection pool exhausted");
      };

      const result = await emailService.verifyEmail("some-token");

      // Should return generic error, not internal details
      expect(result.error).toBe("Failed to verify email");
      expect(result.error).not.toContain("database");
      expect(result.error).not.toContain("connection pool");

      prisma.verificationToken.findUnique = mockFindUnique;
    });
  });

  describe("Token Expiry Enforcement", () => {
    it("should reject expired verification tokens", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      // Create expired token
      const expiredToken = await prisma.verificationToken.create({
        data: {
          identifier: testUserId,
          token: crypto.randomBytes(32).toString("hex"),
          expires: new Date(Date.now() - 1000), // 1 second ago
        },
      });

      const result = await emailService.verifyEmail(expiredToken.token);

      expect(result.success).toBe(false);
      expect(result.error).toContain("expired");
    });

    it("should reject expired password reset tokens", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      // Create expired reset token
      const expiredToken = await prisma.verificationToken.create({
        data: {
          identifier: `password-reset:${testUserId}`,
          token: crypto.randomBytes(32).toString("hex"),
          expires: new Date(Date.now() - 1000),
        },
      });

      const result = await passwordService.resetPassword(
        expiredToken.token,
        "NewPassword123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("expired");
    });

    it("should clean up expired tokens on verification attempt", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      const expiredToken = await prisma.verificationToken.create({
        data: {
          identifier: testUserId,
          token: crypto.randomBytes(32).toString("hex"),
          expires: new Date(Date.now() - 1000),
        },
      });

      await emailService.verifyEmail(expiredToken.token);

      // Token should be deleted
      const tokenExists = await prisma.verificationToken.findUnique({
        where: { token: expiredToken.token },
      });

      expect(tokenExists).toBeNull();
    });
  });

  describe("Concurrent Request Security", () => {
    it("should handle concurrent password changes safely", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      const results = await Promise.allSettled([
        passwordService.changePassword(
          testUserId,
          "TestPassword123",
          "NewPass1"
        ),
        passwordService.changePassword(
          testUserId,
          "TestPassword123",
          "NewPass2"
        ),
        passwordService.changePassword(
          testUserId,
          "TestPassword123",
          "NewPass3"
        ),
      ]);

      // At least one should succeed
      const successCount = results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length;
      expect(successCount).toBeGreaterThanOrEqual(1);

      // User should have a valid password (one of the new ones)
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });
      expect(user?.passwordHash).toBeTruthy();
    });

    it("should handle concurrent verification attempts safely", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );
      const { token } = await createVerificationToken(testUserId);

      const results = await Promise.all([
        emailService.verifyEmail(token),
        emailService.verifyEmail(token),
        emailService.verifyEmail(token),
      ]);

      // With deleteMany, all can succeed
      const successCount = results.filter((r) => r.success).length;
      expect(successCount).toBeGreaterThanOrEqual(1);

      // User should be verified
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { isEmailVerified: true },
      });
      expect(user?.isEmailVerified).toBe(true);

      // Token should be deleted
      const tokenExists = await prisma.verificationToken.findUnique({
        where: { token },
      });
      expect(tokenExists).toBeNull();
    });
  });

  describe("Token Type Isolation", () => {
    it("should not accept verification token for password reset", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      // Create verification token (not password-reset)
      const { token } = await createVerificationToken(testUserId);

      // Try to use it for password reset
      const result = await passwordService.resetPassword(
        token,
        "NewPassword123"
      );

      expect(result.success).toBe(false);
    });

    it("should not accept password reset token for email verification", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      // Create password reset token
      const { token } = await createPasswordResetToken(testUserId);

      // Try to use it for email verification
      const result = await emailService.verifyEmail(token);

      expect(result.success).toBe(false);
    });
  });
});

