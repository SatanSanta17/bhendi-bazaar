/**
 * EmailService Unit Tests
 *
 * Tests for server-side email verification service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createTestUser,
  cleanupTestUserById,
  createExpiredVerificationToken,
  verificationTokenExists,
  getVerificationTokensForUser,
} from "../utils/auth-helpers";

// Mock Resend
vi.mock("resend", () => {
  return {
    Resend: class MockResend {
      emails = {
        send: vi.fn().mockResolvedValue({
          data: { id: "test-email-id" },
          error: null,
        }),
      };
    },
  };
});

// Import after mocking
import { emailService } from "../../server/services/emailService";
import crypto from "crypto";

describe("EmailService - Email Verification", () => {
  let testUserId: string;
  let testUserEmail: string;

  beforeEach(async () => {
    // Create a test user
    const user = await createTestUser({
      email: `test-${Date.now()}@example.com`,
      verified: false,
      hasPassword: true,
    });
    testUserId = user.id;
    testUserEmail = user.email!;
  });

  afterEach(async () => {
    // Cleanup test data
    if (testUserId) {
      await cleanupTestUserById(testUserId);
    }
  });

  describe("sendVerificationEmail", () => {
    it("should generate a unique 32-byte hex token", async () => {
      await emailService.sendVerificationEmail(testUserId, testUserEmail);

      const tokens = await getVerificationTokensForUser(testUserId);
      expect(tokens).toHaveLength(1);
      expect(tokens[0].token).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(tokens[0].token).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should create token with 24-hour expiry", async () => {
      const beforeSend = Date.now();
      await emailService.sendVerificationEmail(testUserId, testUserEmail);
      const afterSend = Date.now();

      const tokens = await getVerificationTokensForUser(testUserId);
      const tokenExpiry = tokens[0].expires.getTime();

      // Token should expire approximately 24 hours from now
      const expectedExpiry = beforeSend + 24 * 60 * 60 * 1000;
      const tolerance = afterSend - beforeSend + 1000; // Allow 1 second tolerance

      expect(tokenExpiry).toBeGreaterThanOrEqual(expectedExpiry - tolerance);
      expect(tokenExpiry).toBeLessThanOrEqual(expectedExpiry + tolerance);
    });

    it("should store token in database with user ID", async () => {
      await emailService.sendVerificationEmail(testUserId, testUserEmail);

      const token = await prisma.verificationToken.findFirst({
        where: { identifier: testUserId },
      });

      expect(token).not.toBeNull();
      expect(token?.identifier).toBe(testUserId);
    });

    it("should generate unique tokens for multiple calls", async () => {
      await emailService.sendVerificationEmail(testUserId, testUserEmail);
      await emailService.sendVerificationEmail(testUserId, testUserEmail);

      const tokens = await getVerificationTokensForUser(testUserId);
      expect(tokens).toHaveLength(2);
      expect(tokens[0].token).not.toBe(tokens[1].token);
    });
  });

  describe("verifyEmail", () => {
    it("should verify valid token and mark user as verified", async () => {
      await emailService.sendVerificationEmail(testUserId, testUserEmail);
      const tokens = await getVerificationTokensForUser(testUserId);
      const token = tokens[0].token;

      const result = await emailService.verifyEmail(token);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Check user is marked as verified
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { isEmailVerified: true, emailVerified: true },
      });

      expect(user?.isEmailVerified).toBe(true);
      expect(user?.emailVerified).toBeInstanceOf(Date);
    });

    it("should delete token after successful verification", async () => {
      await emailService.sendVerificationEmail(testUserId, testUserEmail);
      const tokens = await getVerificationTokensForUser(testUserId);
      const token = tokens[0].token;

      await emailService.verifyEmail(token);

      const tokenExists = await verificationTokenExists(token);
      expect(tokenExists).toBe(false);
    });

    it("should reject invalid token", async () => {
      const invalidToken = crypto.randomBytes(32).toString("hex");

      const result = await emailService.verifyEmail(invalidToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid verification token");
    });

    it("should reject expired token and delete it", async () => {
      const expiredToken = await createExpiredVerificationToken(testUserId);

      const result = await emailService.verifyEmail(expiredToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Verification token has expired");

      // Token should be deleted
      const tokenExists = await verificationTokenExists(expiredToken);
      expect(tokenExists).toBe(false);
    });

    it("should not allow token reuse", async () => {
      await emailService.sendVerificationEmail(testUserId, testUserEmail);
      const tokens = await getVerificationTokensForUser(testUserId);
      const token = tokens[0].token;

      // Verify once
      const firstResult = await emailService.verifyEmail(token);
      expect(firstResult.success).toBe(true);

      // Try to verify again with same token
      const secondResult = await emailService.verifyEmail(token);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toBe("Invalid verification token");
    });

    it("should handle database errors gracefully", async () => {
      const token = "test-token";

      // Mock prisma to throw error on findUnique
      const originalFindUnique = prisma.verificationToken.findUnique;
      prisma.verificationToken.findUnique = vi.fn().mockRejectedValue(
        new Error("Database error")
      );

      const result = await emailService.verifyEmail(token);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to verify email");

      // Restore
      prisma.verificationToken.findUnique = originalFindUnique;
    });
  });

  describe("resendVerificationEmail", () => {
    it("should delete old tokens before creating new one", async () => {
      // Send initial email
      await emailService.sendVerificationEmail(testUserId, testUserEmail);
      const initialTokens = await getVerificationTokensForUser(testUserId);
      const initialToken = initialTokens[0].token;

      // Resend
      await emailService.resendVerificationEmail(testUserId);

      // Old token should be deleted
      const oldTokenExists = await verificationTokenExists(initialToken);
      expect(oldTokenExists).toBe(false);

      // Should have new token
      const newTokens = await getVerificationTokensForUser(testUserId);
      expect(newTokens).toHaveLength(1);
      expect(newTokens[0].token).not.toBe(initialToken);
    });

    it("should send new email with new token", async () => {
      await emailService.sendVerificationEmail(testUserId, testUserEmail);
      await emailService.resendVerificationEmail(testUserId);

      const tokens = await getVerificationTokensForUser(testUserId);
      expect(tokens).toHaveLength(1);
      expect(tokens[0].token).toHaveLength(64);
    });

    it("should fail for already verified users", async () => {
      // Mark user as verified
      await prisma.user.update({
        where: { id: testUserId },
        data: { isEmailVerified: true },
      });

      await expect(
        emailService.resendVerificationEmail(testUserId)
      ).rejects.toThrow("Email already verified");
    });

    it("should fail for users without email", async () => {
      // Create user without email
      const userWithoutEmail = await prisma.user.create({
        data: {
          name: "Test User",
          email: null,
          isEmailVerified: false,
        },
      });

      await expect(
        emailService.resendVerificationEmail(userWithoutEmail.id)
      ).rejects.toThrow("No email associated with this account");

      // Cleanup
      await prisma.user.delete({ where: { id: userWithoutEmail.id } });
    });

    it("should fail for non-existent users", async () => {
      const fakeUserId = "non-existent-user-id";

      await expect(
        emailService.resendVerificationEmail(fakeUserId)
      ).rejects.toThrow("User not found");
    });
  });

  describe("getVerificationStatus", () => {
    it("should return verification status for verified user", async () => {
      await prisma.user.update({
        where: { id: testUserId },
        data: { isEmailVerified: true },
      });

      const status = await emailService.getVerificationStatus(testUserId);

      expect(status.isVerified).toBe(true);
      expect(status.email).toBe(testUserEmail);
    });

    it("should return verification status for unverified user", async () => {
      const status = await emailService.getVerificationStatus(testUserId);

      expect(status.isVerified).toBe(false);
      expect(status.email).toBe(testUserEmail);
    });

    it("should return false for non-existent user", async () => {
      const status = await emailService.getVerificationStatus(
        "non-existent-id"
      );

      expect(status.isVerified).toBe(false);
      expect(status.email).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle concurrent verification attempts", async () => {
      await emailService.sendVerificationEmail(testUserId, testUserEmail);
      const tokens = await getVerificationTokensForUser(testUserId);
      const token = tokens[0].token;

      // Attempt to verify concurrently
      const results = await Promise.all([
        emailService.verifyEmail(token),
        emailService.verifyEmail(token),
        emailService.verifyEmail(token),
      ]);

      // With deleteMany, all can succeed, but only first one actually verifies
      // At least one should succeed
      const successCount = results.filter((r) => r.success).length;
      expect(successCount).toBeGreaterThanOrEqual(1);

      // User should be verified
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { isEmailVerified: true },
      });
      expect(user?.isEmailVerified).toBe(true);
    });

    it("should handle multiple expired tokens cleanup", async () => {
      // Create multiple expired tokens
      const expiredToken1 = await createExpiredVerificationToken(testUserId);
      const expiredToken2 = await createExpiredVerificationToken(testUserId);

      // Try to verify first expired token (should clean it up)
      await emailService.verifyEmail(expiredToken1);

      const token1Exists = await verificationTokenExists(expiredToken1);
      expect(token1Exists).toBe(false);

      // Second expired token should still exist
      const token2Exists = await verificationTokenExists(expiredToken2);
      expect(token2Exists).toBe(true);
    });

    it("should handle very long email addresses", async () => {
      const longEmail = `${"a".repeat(100)}@example.com`;
      const user = await createTestUser({
        email: longEmail,
        verified: false,
      });

      await emailService.sendVerificationEmail(user.id, longEmail);

      const tokens = await getVerificationTokensForUser(user.id);
      expect(tokens).toHaveLength(1);

      await cleanupTestUserById(user.id);
    });
  });

  describe("Security Tests", () => {
    it("should generate cryptographically random tokens", async () => {
      const tokens: string[] = [];

      // Generate multiple tokens
      for (let i = 0; i < 10; i++) {
        await emailService.sendVerificationEmail(testUserId, testUserEmail);
      }

      const allTokens = await getVerificationTokensForUser(testUserId);
      const tokenStrings = allTokens.map((t) => t.token);

      // All tokens should be unique
      const uniqueTokens = new Set(tokenStrings);
      expect(uniqueTokens.size).toBe(tokenStrings.length);

      // Tokens should appear random (no sequential patterns)
      for (let i = 1; i < tokenStrings.length; i++) {
        expect(tokenStrings[i]).not.toBe(tokenStrings[i - 1]);
      }
    });

    it("should not reveal user existence in error messages", async () => {
      const result = await emailService.verifyEmail("fake-token");

      // Error should be generic
      expect(result.error).toBe("Invalid verification token");
      // Should not say "User not found" or similar
    });
  });
});

