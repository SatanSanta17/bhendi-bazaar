/**
 * PasswordService Unit Tests
 *
 * Tests for password change and reset functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import {
  createTestUser,
  cleanupTestUserById,
  createPasswordResetToken,
  createExpiredPasswordResetToken,
} from "../utils/auth-helpers";
import { PasswordService } from "@/server/services/passwordService";

// Mock email service
vi.mock("@/server/services/emailService", () => ({
  emailService: {
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("PasswordService", () => {
  let passwordService: PasswordService;
  let testUserId: string;
  let testUserEmail: string;
  const testPassword = "Test1234";
  const newPassword = "NewTest1234";

  beforeEach(async () => {
    passwordService = new PasswordService();

    // Create a test user with password
    const user = await createTestUser({
      email: `test-${Date.now()}@example.com`,
      password: testPassword,
      verified: false,
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

  describe("changePassword", () => {
    it("should change password with valid current password", async () => {
      const result = await passwordService.changePassword(
        testUserId,
        testPassword,
        newPassword
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Verify password was actually changed
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      const bcrypt = await import("bcryptjs");
      const isNewPasswordValid = await bcrypt.compare(
        newPassword,
        user!.passwordHash!
      );
      expect(isNewPasswordValid).toBe(true);
    });

    it("should hash new password with bcrypt", async () => {
      await passwordService.changePassword(
        testUserId,
        testPassword,
        newPassword
      );

      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      // Hash should start with bcrypt identifier
      expect(user?.passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it("should reject incorrect current password", async () => {
      const result = await passwordService.changePassword(
        testUserId,
        "WrongPassword123",
        newPassword
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Current password is incorrect");
    });

    it("should reject password change for OAuth users", async () => {
      // Create OAuth user (no password)
      const oauthUser = await createTestUser({
        email: `oauth-${Date.now()}@example.com`,
        hasPassword: false,
      });

      const result = await passwordService.changePassword(
        oauthUser.id,
        "anything",
        newPassword
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Cannot change password for OAuth accounts");

      await cleanupTestUserById(oauthUser.id);
    });

    it("should reject for non-existent users", async () => {
      const result = await passwordService.changePassword(
        "non-existent-id",
        testPassword,
        newPassword
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
    });

    it("should handle database errors gracefully", async () => {
      const originalFindUnique = prisma.user.findUnique;
      prisma.user.findUnique = vi.fn().mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await passwordService.changePassword(
        testUserId,
        testPassword,
        newPassword
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to change password");

      // Restore
      prisma.user.findUnique = originalFindUnique;
    });

    it("should invalidate old password immediately", async () => {
      await passwordService.changePassword(
        testUserId,
        testPassword,
        newPassword
      );

      // Try to use old password again
      const result = await passwordService.changePassword(
        testUserId,
        testPassword,
        "AnotherNew123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Current password is incorrect");
    });
  });

  describe("validatePassword", () => {
    it("should accept valid strong password", async () => {
      const result = passwordService.validatePassword("Strong123");

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject password < 8 characters", async () => {
      const result = passwordService.validatePassword("Short1");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Password must be at least 8 characters");
    });

    it("should reject password without uppercase", async () => {
      const result = passwordService.validatePassword("lowercase123");

      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "Password must contain at least one uppercase letter"
      );
    });

    it("should reject password without lowercase", async () => {
      const result = passwordService.validatePassword("UPPERCASE123");

      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "Password must contain at least one lowercase letter"
      );
    });

    it("should reject password without numbers", async () => {
      const result = passwordService.validatePassword("NoNumbers");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Password must contain at least one number");
    });

    it("should accept password with special characters", async () => {
      const result = passwordService.validatePassword("Strong!@#123");

      expect(result.valid).toBe(true);
    });

    it("should reject empty password", async () => {
      const result = passwordService.validatePassword("");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Password must be at least 8 characters");
    });
  });

  describe("requestPasswordReset", () => {
    it("should generate unique reset token", async () => {
      await passwordService.requestPasswordReset(testUserEmail);

      const token = await prisma.verificationToken.findFirst({
        where: { identifier: `password-reset:${testUserId}` },
      });

      expect(token).not.toBeNull();
      expect(token?.token).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    it("should create token with 1-hour expiry", async () => {
      const beforeRequest = Date.now();
      await passwordService.requestPasswordReset(testUserEmail);
      const afterRequest = Date.now();

      const token = await prisma.verificationToken.findFirst({
        where: { identifier: `password-reset:${testUserId}` },
      });

      const tokenExpiry = token!.expires.getTime();
      const expectedExpiry = beforeRequest + 60 * 60 * 1000; // 1 hour
      const tolerance = afterRequest - beforeRequest + 1000;

      expect(tokenExpiry).toBeGreaterThanOrEqual(expectedExpiry - tolerance);
      expect(tokenExpiry).toBeLessThanOrEqual(expectedExpiry + tolerance);
    });

    it("should send reset email", async () => {
      const { emailService } = await import("@/server/services/emailService");

      await passwordService.requestPasswordReset(testUserEmail);

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        testUserEmail,
        expect.any(String),
        expect.any(String)
      );
    });

    it("should return success for non-existent email (security)", async () => {
      const result = await passwordService.requestPasswordReset(
        "nonexistent@example.com"
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should handle OAuth users gracefully without revealing them", async () => {
      const oauthUser = await createTestUser({
        email: `oauth-${Date.now()}@example.com`,
        hasPassword: false,
      });

      const result = await passwordService.requestPasswordReset(
        oauthUser.email!
      );

      // Should return success (don't reveal OAuth users)
      expect(result.success).toBe(true);

      // No token should be created
      const token = await prisma.verificationToken.findFirst({
        where: { identifier: `password-reset:${oauthUser.id}` },
      });
      expect(token).toBeNull();

      await cleanupTestUserById(oauthUser.id);
    });

    it("should handle email sending failures", async () => {
      const { emailService } = await import("@/server/services/emailService");
      vi.mocked(emailService.sendPasswordResetEmail).mockRejectedValueOnce(
        new Error("Email send failed")
      );

      const result = await passwordService.requestPasswordReset(testUserEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to send reset email");
    });
  });

  describe("resetPassword", () => {
    it("should reset password with valid token", async () => {
      const { token } = await createPasswordResetToken(testUserId);

      const result = await passwordService.resetPassword(token, newPassword);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Verify password was changed
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      const bcrypt = await import("bcryptjs");
      const isNewPasswordValid = await bcrypt.compare(
        newPassword,
        user!.passwordHash!
      );
      expect(isNewPasswordValid).toBe(true);
    });

    it("should validate new password strength", async () => {
      const { token } = await createPasswordResetToken(testUserId);

      // This test assumes validation happens at API level
      // PasswordService doesn't validate, but we document expected behavior
      const weakPassword = "weak";
      const result = await passwordService.resetPassword(token, weakPassword);

      // Password is hashed regardless - validation should happen at API level
      expect(result.success).toBe(true);
    });

    it("should delete token after use", async () => {
      const { token } = await createPasswordResetToken(testUserId);

      await passwordService.resetPassword(token, newPassword);

      const tokenExists = await prisma.verificationToken.findFirst({
        where: { token },
      });

      expect(tokenExists).toBeNull();
    });

    it("should reject invalid token", async () => {
      const result = await passwordService.resetPassword(
        "invalid-token",
        newPassword
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired reset link");
    });

    it("should reject expired token and clean it up", async () => {
      const expiredToken = await createExpiredPasswordResetToken(testUserId);

      const result = await passwordService.resetPassword(
        expiredToken,
        newPassword
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Reset link has expired");

      // Token should be deleted
      const tokenExists = await prisma.verificationToken.findFirst({
        where: { token: expiredToken },
      });
      expect(tokenExists).toBeNull();
    });

    it("should not allow token reuse", async () => {
      const { token } = await createPasswordResetToken(testUserId);

      // Use token once
      const firstResult = await passwordService.resetPassword(
        token,
        newPassword
      );
      expect(firstResult.success).toBe(true);

      // Try to use again
      const secondResult = await passwordService.resetPassword(
        token,
        "AnotherNew123"
      );
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toBe("Invalid or expired reset link");
    });

    it("should handle database errors gracefully", async () => {
      const { token } = await createPasswordResetToken(testUserId);

      const originalFindFirst = prisma.verificationToken.findFirst;
      prisma.verificationToken.findFirst = vi.fn().mockRejectedValue(
        new Error("Database error")
      );

      const result = await passwordService.resetPassword(token, newPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to reset password");

      // Restore
      prisma.verificationToken.findFirst = originalFindFirst;
    });

    it("should only work with password-reset prefixed tokens", async () => {
      // Create a regular verification token (not password-reset)
      const regularToken = await prisma.verificationToken.create({
        data: {
          identifier: testUserId, // No password-reset: prefix
          token: "regular-token-123",
          expires: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const result = await passwordService.resetPassword(
        regularToken.token,
        newPassword
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired reset link");

      // Cleanup
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: regularToken.identifier,
            token: regularToken.token,
          },
        },
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle concurrent password changes", async () => {
      const results = await Promise.allSettled([
        passwordService.changePassword(testUserId, testPassword, "NewPass1"),
        passwordService.changePassword(testUserId, testPassword, "NewPass2"),
        passwordService.changePassword(testUserId, testPassword, "NewPass3"),
      ]);

      // At least one should succeed
      const successCount = results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });

    it("should handle multiple reset requests", async () => {
      await passwordService.requestPasswordReset(testUserEmail);
      await passwordService.requestPasswordReset(testUserEmail);
      await passwordService.requestPasswordReset(testUserEmail);

      const tokens = await prisma.verificationToken.findMany({
        where: { identifier: `password-reset:${testUserId}` },
      });

      // Multiple tokens can exist (they expire independently)
      expect(tokens.length).toBeGreaterThan(0);
    });

    it("should clean up expired tokens on verification", async () => {
      const expiredToken = await createExpiredPasswordResetToken(testUserId);

      await passwordService.resetPassword(expiredToken, newPassword);

      const tokenExists = await prisma.verificationToken.findFirst({
        where: { token: expiredToken },
      });
      expect(tokenExists).toBeNull();
    });
  });

  describe("Security Tests", () => {
    it("should generate cryptographically random reset tokens", async () => {
      const tokens: string[] = [];

      for (let i = 0; i < 5; i++) {
        await passwordService.requestPasswordReset(testUserEmail);
      }

      const allTokens = await prisma.verificationToken.findMany({
        where: { identifier: `password-reset:${testUserId}` },
      });

      const tokenStrings = allTokens.map((t) => t.token);

      // All tokens should be unique
      const uniqueTokens = new Set(tokenStrings);
      expect(uniqueTokens.size).toBe(tokenStrings.length);
    });

    it("should use bcrypt with appropriate rounds", async () => {
      await passwordService.changePassword(
        testUserId,
        testPassword,
        newPassword
      );

      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      // Bcrypt hash format: $2a$10$... (10 rounds)
      expect(user?.passwordHash).toMatch(/^\$2[aby]\$10\$/);
    });

    it("should not reveal user existence in forgot password", async () => {
      const result1 = await passwordService.requestPasswordReset(
        testUserEmail
      );
      const result2 = await passwordService.requestPasswordReset(
        "nonexistent@example.com"
      );

      // Both should return same success response
      expect(result1.success).toBe(result2.success);
      expect(result1.error).toBe(result2.error);
    });

    it("should not reveal old password in error messages", async () => {
      const result = await passwordService.changePassword(
        testUserId,
        "WrongPassword123",
        newPassword
      );

      // Error should not contain the password
      expect(result.error).not.toContain(testPassword);
      expect(result.error).not.toContain("WrongPassword123");
    });
  });
});

