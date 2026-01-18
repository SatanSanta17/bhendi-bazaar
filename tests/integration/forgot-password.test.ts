/**
 * Forgot Password Integration Tests
 *
 * Integration tests covering the forgot/reset password flow:
 * - Password reset request
 * - Token generation and storage
 * - Email sending
 * - Password reset with token
 * - Security considerations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import {
  createTestUser,
  cleanupTestUserById,
  createPasswordResetToken,
  createExpiredPasswordResetToken,
} from "../utils/auth-helpers";
import {
  createCapturingResendMock,
  getCapturedEmails,
  clearCapturedEmails,
  extractResetLink,
  extractTokenFromLink,
} from "../utils/email-mocks";

// Mock Resend with email capture
vi.mock("resend", () => createCapturingResendMock());

describe("Forgot Password Integration", () => {
  let testUserId: string;
  let testUserEmail: string;
  const testPassword = "OldPassword123";
  const newPassword = "NewPassword456";

  beforeEach(async () => {
    clearCapturedEmails();
    const user = await createTestUser({
      email: `forgot-test-${Date.now()}@example.com`,
      password: testPassword,
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

  describe("Request Password Reset Flow", () => {
    it("should create reset token for valid email", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.requestPasswordReset(testUserEmail);

      const token = await prisma.verificationToken.findFirst({
        where: { identifier: `password-reset:${testUserId}` },
      });

      expect(token).not.toBeNull();
      expect(token?.token).toBeTruthy();
    });

    it("should create token with password-reset: prefix in identifier", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.requestPasswordReset(testUserEmail);

      const token = await prisma.verificationToken.findFirst({
        where: {
          identifier: `password-reset:${testUserId}`,
        },
      });

      expect(token?.identifier).toBe(`password-reset:${testUserId}`);
    });

    it("should send reset email to user", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.requestPasswordReset(testUserEmail);

      const emails = getCapturedEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].to).toBe(testUserEmail);
      expect(emails[0].subject).toContain("Reset");
    });

    it("should return success even for non-existent email (security)", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      const result = await passwordService.requestPasswordReset(
        "nonexistent@example.com"
      );

      expect(result.success).toBe(true);
    });

    it("should not send email for non-existent user", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.requestPasswordReset("nonexistent@example.com");

      const emails = getCapturedEmails();
      expect(emails).toHaveLength(0);
    });

    it("should handle OAuth users gracefully", async () => {
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

      // Should return success (don't reveal OAuth users)
      expect(result.success).toBe(true);

      // No token should be created
      const token = await prisma.verificationToken.findFirst({
        where: { identifier: `password-reset:${oauthUser.id}` },
      });
      expect(token).toBeNull();

      // No email should be sent
      const emails = getCapturedEmails();
      expect(emails).toHaveLength(0);

      await cleanupTestUserById(oauthUser.id);
    });

    it("should create token with 1-hour expiry", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      const beforeRequest = Date.now();
      await passwordService.requestPasswordReset(testUserEmail);
      const afterRequest = Date.now();

      const token = await prisma.verificationToken.findFirst({
        where: { identifier: `password-reset:${testUserId}` },
      });

      const expiryTime = token!.expires.getTime();
      const expectedExpiry = beforeRequest + 60 * 60 * 1000; // 1 hour
      const tolerance = afterRequest - beforeRequest + 1000;

      expect(expiryTime).toBeGreaterThanOrEqual(expectedExpiry - tolerance);
      expect(expiryTime).toBeLessThanOrEqual(expectedExpiry + tolerance);
    });

    it("should allow multiple reset requests", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.requestPasswordReset(testUserEmail);
      await passwordService.requestPasswordReset(testUserEmail);
      await passwordService.requestPasswordReset(testUserEmail);

      const tokens = await prisma.verificationToken.findMany({
        where: { identifier: `password-reset:${testUserId}` },
      });

      // Multiple tokens can exist
      expect(tokens.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Reset Password Flow", () => {
    it("should reset password with valid token", async () => {
      const { token } = await createPasswordResetToken(testUserId);
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      const result = await passwordService.resetPassword(token, newPassword);

      expect(result.success).toBe(true);
    });

    it("should update password in database", async () => {
      const { token } = await createPasswordResetToken(testUserId);
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.resetPassword(token, newPassword);

      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      const isNewPassword = await compare(newPassword, user!.passwordHash!);
      expect(isNewPassword).toBe(true);
    });

    it("should delete token after successful reset", async () => {
      const { token } = await createPasswordResetToken(testUserId);
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.resetPassword(token, newPassword);

      const tokenExists = await prisma.verificationToken.findFirst({
        where: { token },
      });

      expect(tokenExists).toBeNull();
    });

    it("should allow sign in with new password", async () => {
      const { token } = await createPasswordResetToken(testUserId);
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.resetPassword(token, newPassword);

      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      const canSignIn = await compare(newPassword, user!.passwordHash!);
      expect(canSignIn).toBe(true);
    });

    it("should invalidate old password", async () => {
      const { token } = await createPasswordResetToken(testUserId);
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.resetPassword(token, newPassword);

      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      const canSignInWithOld = await compare(testPassword, user!.passwordHash!);
      expect(canSignInWithOld).toBe(false);
    });

    it("should reject invalid token", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      const result = await passwordService.resetPassword(
        "invalid-token-123",
        newPassword
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired reset link");
    });

    it("should reject expired token", async () => {
      const expiredToken = await createExpiredPasswordResetToken(testUserId);
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      const result = await passwordService.resetPassword(
        expiredToken,
        newPassword
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Reset link has expired");
    });

    it("should clean up expired token", async () => {
      const expiredToken = await createExpiredPasswordResetToken(testUserId);
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.resetPassword(expiredToken, newPassword);

      const tokenExists = await prisma.verificationToken.findFirst({
        where: { token: expiredToken },
      });

      expect(tokenExists).toBeNull();
    });

    it("should not allow token reuse", async () => {
      const { token } = await createPasswordResetToken(testUserId);
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      // Use once
      await passwordService.resetPassword(token, newPassword);

      // Try again
      const result = await passwordService.resetPassword(
        token,
        "AnotherPassword123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired reset link");
    });

    it("should only accept tokens with password-reset: prefix", async () => {
      // Create regular verification token (not password-reset)
      const regularToken = await prisma.verificationToken.create({
        data: {
          identifier: testUserId, // No prefix
          token: "regular-token-123",
          expires: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

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

  describe("Security", () => {
    it("should not reveal if email exists", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      const result1 = await passwordService.requestPasswordReset(testUserEmail);
      const result2 = await passwordService.requestPasswordReset(
        "nonexistent@example.com"
      );

      // Both should return same response
      expect(result1.success).toBe(result2.success);
      expect(result1.error).toBe(result2.error);
    });

    it("should generate cryptographically random tokens", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      // Generate multiple tokens
      for (let i = 0; i < 5; i++) {
        await passwordService.requestPasswordReset(testUserEmail);
      }

      const tokens = await prisma.verificationToken.findMany({
        where: { identifier: `password-reset:${testUserId}` },
      });

      const tokenStrings = tokens.map((t) => t.token);

      // All should be unique
      const uniqueTokens = new Set(tokenStrings);
      expect(uniqueTokens.size).toBe(tokenStrings.length);
    });

    it("should hash password before storage", async () => {
      const { token } = await createPasswordResetToken(testUserId);
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.resetPassword(token, newPassword);

      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      expect(user?.passwordHash).not.toBe(newPassword);
      expect(user?.passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it("should expire tokens after 1 hour", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.requestPasswordReset(testUserEmail);

      const token = await prisma.verificationToken.findFirst({
        where: { identifier: `password-reset:${testUserId}` },
      });

      const now = Date.now();
      const expiryTime = token!.expires.getTime();

      // Should expire in approximately 1 hour
      const hourInMs = 60 * 60 * 1000;
      expect(expiryTime - now).toBeLessThanOrEqual(hourInMs + 1000);
      expect(expiryTime - now).toBeGreaterThanOrEqual(hourInMs - 1000);
    });

    it("should not expose user information in tokens", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.requestPasswordReset(testUserEmail);

      const token = await prisma.verificationToken.findFirst({
        where: { identifier: `password-reset:${testUserId}` },
      });

      // Token should not contain email or user ID
      expect(token?.token).not.toContain(testUserEmail);
      expect(token?.token).not.toContain(testUserId);
    });
  });

  describe("Email Content", () => {
    it("should include reset link in email", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.requestPasswordReset(testUserEmail);

      const emails = getCapturedEmails();
      const resetLink = extractResetLink(emails[0].html);

      expect(resetLink).toBeTruthy();
      expect(resetLink).toContain("reset-password");
      expect(resetLink).toContain("token=");
    });

    it("should include valid token in email link", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.requestPasswordReset(testUserEmail);

      const emails = getCapturedEmails();
      const resetLink = extractResetLink(emails[0].html);
      const tokenFromEmail = extractTokenFromLink(resetLink!);

      const token = await prisma.verificationToken.findFirst({
        where: { identifier: `password-reset:${testUserId}` },
      });

      expect(tokenFromEmail).toBe(token?.token);
    });

    it("should personalize email with user name", async () => {
      const userName = "Test User";
      const userWithName = await createTestUser({
        email: `named-${Date.now()}@example.com`,
        name: userName,
        password: testPassword,
      });

      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.requestPasswordReset(userWithName.email!);

      const emails = getCapturedEmails();
      expect(emails[emails.length - 1].html).toContain(userName);

      await cleanupTestUserById(userWithName.id);
    });
  });

  describe("Error Handling", () => {
    it("should handle email sending failures", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      vi.spyOn(emailService, "sendPasswordResetEmail").mockRejectedValueOnce(
        new Error("Email send failed")
      );

      const result = await passwordService.requestPasswordReset(testUserEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to send reset email");
    });

    it("should handle database errors gracefully", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      const mockFindUnique = prisma.user.findUnique;
      prisma.user.findUnique = async () => {
        throw new Error("Database error");
      };

      const result = await passwordService.requestPasswordReset(testUserEmail);

      expect(result.success).toBe(false);

      prisma.user.findUnique = mockFindUnique;
    });

    it("should handle missing user gracefully", async () => {
      const { token } = await createPasswordResetToken("non-existent-user-id");
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      // This should fail when trying to update non-existent user
      const result = await passwordService.resetPassword(token, newPassword);

      expect(result.success).toBe(false);

      // Cleanup
      await prisma.verificationToken.deleteMany({
        where: { identifier: "password-reset:non-existent-user-id" },
      });
    });
  });

  describe("Complete Forgot Password Flow", () => {
    it("should complete full forgot password flow", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );
      clearCapturedEmails();

      // 1. User requests password reset
      const requestResult = await passwordService.requestPasswordReset(
        testUserEmail
      );
      expect(requestResult.success).toBe(true);

      // 2. Email is sent
      const emails = getCapturedEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].to).toBe(testUserEmail);

      // 3. Extract token from email
      const resetLink = extractResetLink(emails[0].html);
      const token = extractTokenFromLink(resetLink!);
      expect(token).toBeTruthy();

      // 4. Verify old password still works (before reset)
      let user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });
      let canSignInWithOld = await compare(testPassword, user!.passwordHash!);
      expect(canSignInWithOld).toBe(true);

      // 5. Reset password with token
      const resetResult = await passwordService.resetPassword(
        token!,
        newPassword
      );
      expect(resetResult.success).toBe(true);

      // 6. Old password no longer works
      user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });
      canSignInWithOld = await compare(testPassword, user!.passwordHash!);
      expect(canSignInWithOld).toBe(false);

      // 7. New password works
      const canSignInWithNew = await compare(newPassword, user!.passwordHash!);
      expect(canSignInWithNew).toBe(true);

      // 8. Token is deleted
      const tokenExists = await prisma.verificationToken.findFirst({
        where: { token: token! },
      });
      expect(tokenExists).toBeNull();
    });
  });
});

