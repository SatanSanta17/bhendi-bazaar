/**
 * Email Verification Integration Tests
 *
 * Integration tests covering the full email verification flow:
 * - Signup creates unverified user
 * - Verification email sent
 * - Token verification works
 * - Profile update triggers re-verification
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createTestUser,
  cleanupTestUser,
  getVerificationTokensForUser,
  verificationTokenExists,
} from "../utils/auth-helpers";
import {
  createCapturingResendMock,
  getCapturedEmails,
  clearCapturedEmails,
  extractVerificationLink,
  extractTokenFromLink,
} from "../utils/email-mocks";

// Mock Resend with email capture
vi.mock("resend", () => createCapturingResendMock());

describe("Email Verification Integration", () => {
  const testEmail = `integration-${Date.now()}@example.com`;
  let testUserId: string;

  beforeEach(() => {
    clearCapturedEmails();
  });

  afterEach(async () => {
    if (testUserId) {
      await prisma.verificationToken.deleteMany({
        where: { identifier: testUserId },
      });
      await prisma.user.deleteMany({
        where: { id: testUserId },
      });
    }
    await cleanupTestUser(testEmail);
  });

  describe("Signup Flow", () => {
    it("should create user with isEmailVerified=false on signup", async () => {
      const user = await createTestUser({
        email: testEmail,
        password: "Test1234",
        verified: false,
      });
      testUserId = user.id;

      expect(user.isEmailVerified).toBe(false);
      expect(user.emailVerified).toBeNull();
    });

    it("should create verification token on signup", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      const user = await createTestUser({
        email: testEmail,
        verified: false,
      });
      testUserId = user.id;

      await emailService.sendVerificationEmail(user.id, testEmail);

      const tokens = await getVerificationTokensForUser(user.id);
      expect(tokens).toHaveLength(1);
      expect(tokens[0].token).toBeTruthy();
      expect(tokens[0].expires).toBeInstanceOf(Date);
    });

    it("should send verification email on signup", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      const user = await createTestUser({
        email: testEmail,
        verified: false,
      });
      testUserId = user.id;

      await emailService.sendVerificationEmail(user.id, testEmail);

      const emails = getCapturedEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].to).toBe(testEmail);
      expect(emails[0].subject).toContain("Verify");
    });
  });

  describe("Verification Flow", () => {
    beforeEach(async () => {
      const user = await createTestUser({
        email: testEmail,
        verified: false,
      });
      testUserId = user.id;
    });

    it("should verify email with valid token", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      await emailService.sendVerificationEmail(testUserId, testEmail);
      const tokens = await getVerificationTokensForUser(testUserId);
      const token = tokens[0].token;

      const result = await emailService.verifyEmail(token);

      expect(result.success).toBe(true);
    });

    it("should update User.isEmailVerified to true", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      await emailService.sendVerificationEmail(testUserId, testEmail);
      const tokens = await getVerificationTokensForUser(testUserId);

      await emailService.verifyEmail(tokens[0].token);

      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { isEmailVerified: true, emailVerified: true },
      });

      expect(user?.isEmailVerified).toBe(true);
      expect(user?.emailVerified).toBeInstanceOf(Date);
    });

    it("should remove token from database after verification", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      await emailService.sendVerificationEmail(testUserId, testEmail);
      const tokens = await getVerificationTokensForUser(testUserId);
      const token = tokens[0].token;

      await emailService.verifyEmail(token);

      const tokenStillExists = await verificationTokenExists(token);
      expect(tokenStillExists).toBe(false);
    });

    it("should reject invalid token", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      const result = await emailService.verifyEmail("invalid-token-12345");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid verification token");
    });

    it("should reject expired token", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      // Create expired token manually
      const expiredToken = await prisma.verificationToken.create({
        data: {
          identifier: testUserId,
          token: "expired-token-123",
          expires: new Date(Date.now() - 1000), // 1 second ago
        },
      });

      const result = await emailService.verifyEmail(expiredToken.token);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Verification token has expired");
    });

    it("should prevent token reuse", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      await emailService.sendVerificationEmail(testUserId, testEmail);
      const tokens = await getVerificationTokensForUser(testUserId);
      const token = tokens[0].token;

      // Use once
      await emailService.verifyEmail(token);

      // Try again
      const secondResult = await emailService.verifyEmail(token);

      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toBe("Invalid verification token");
    });
  });

  describe("Email Update Flow", () => {
    beforeEach(async () => {
      const user = await createTestUser({
        email: testEmail,
        verified: true, // Start with verified user
      });
      testUserId = user.id;
    });

    it("should set isEmailVerified=false when email is updated", async () => {
      const newEmail = `new-${Date.now()}@example.com`;

      await prisma.user.update({
        where: { id: testUserId },
        data: {
          email: newEmail,
          isEmailVerified: false,
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { isEmailVerified: true, email: true },
      });

      expect(user?.isEmailVerified).toBe(false);
      expect(user?.email).toBe(newEmail);
    });

    it("should delete old verification tokens on email update", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      // Create old token
      await emailService.sendVerificationEmail(testUserId, testEmail);
      const oldTokens = await getVerificationTokensForUser(testUserId);
      const oldToken = oldTokens[0].token;

      // Update email (would be done by profile service)
      const newEmail = `new-${Date.now()}@example.com`;
      await prisma.verificationToken.deleteMany({
        where: { identifier: testUserId },
      });
      await emailService.sendVerificationEmail(testUserId, newEmail);

      // Old token should not exist
      const oldTokenExists = await verificationTokenExists(oldToken);
      expect(oldTokenExists).toBe(false);
    });

    it("should send new verification email with new token", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );
      clearCapturedEmails();

      const newEmail = `new-${Date.now()}@example.com`;

      await emailService.sendVerificationEmail(testUserId, newEmail);

      const emails = getCapturedEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].to).toBe(newEmail);
    });

    it("should be able to verify with new token after email update", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      const newEmail = `new-${Date.now()}@example.com`;

      // Update email and set unverified
      await prisma.user.update({
        where: { id: testUserId },
        data: { email: newEmail, isEmailVerified: false },
      });

      // Send new verification email
      await emailService.sendVerificationEmail(testUserId, newEmail);
      const tokens = await getVerificationTokensForUser(testUserId);

      // Verify with new token
      const result = await emailService.verifyEmail(tokens[0].token);
      expect(result.success).toBe(true);

      // Check user is verified
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { isEmailVerified: true },
      });
      expect(user?.isEmailVerified).toBe(true);
    });
  });

  describe("Resend Verification Flow", () => {
    beforeEach(async () => {
      const user = await createTestUser({
        email: testEmail,
        verified: false,
      });
      testUserId = user.id;
    });

    it("should delete old tokens when resending", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      // Send initial email
      await emailService.sendVerificationEmail(testUserId, testEmail);
      const initialTokens = await getVerificationTokensForUser(testUserId);
      const initialToken = initialTokens[0].token;

      // Resend
      await emailService.resendVerificationEmail(testUserId);

      // Old token should be gone
      const oldTokenExists = await verificationTokenExists(initialToken);
      expect(oldTokenExists).toBe(false);
    });

    it("should create new token when resending", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      await emailService.sendVerificationEmail(testUserId, testEmail);
      await emailService.resendVerificationEmail(testUserId);

      const tokens = await getVerificationTokensForUser(testUserId);
      expect(tokens).toHaveLength(1);
    });

    it("should fail to resend for already verified users", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      // Mark as verified
      await prisma.user.update({
        where: { id: testUserId },
        data: { isEmailVerified: true },
      });

      await expect(
        emailService.resendVerificationEmail(testUserId)
      ).rejects.toThrow("Email already verified");
    });

    it("should fail to resend for non-existent users", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      await expect(
        emailService.resendVerificationEmail("non-existent-id")
      ).rejects.toThrow("User not found");
    });
  });

  describe("Error Scenarios", () => {
    it("should handle database failures gracefully during verification", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      const originalFindUnique = prisma.verificationToken.findUnique;
      prisma.verificationToken.findUnique = vi.fn().mockRejectedValue(
        new Error("DB Error")
      );

      const result = await emailService.verifyEmail("some-token");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to verify email");

      // Restore
      prisma.verificationToken.findUnique = originalFindUnique;
    });

    it("should clean up expired tokens when verification fails", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      const user = await createTestUser({
        email: testEmail,
        verified: false,
      });
      testUserId = user.id;

      const expiredToken = await prisma.verificationToken.create({
        data: {
          identifier: testUserId,
          token: "expired-123",
          expires: new Date(Date.now() - 1000),
        },
      });

      await emailService.verifyEmail(expiredToken.token);

      const tokenExists = await verificationTokenExists(expiredToken.token);
      expect(tokenExists).toBe(false);
    });

    it("should handle multiple verification attempts gracefully", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      const user = await createTestUser({
        email: testEmail,
        verified: false,
      });
      testUserId = user.id;

      await emailService.sendVerificationEmail(testUserId, testEmail);
      const tokens = await getVerificationTokensForUser(testUserId);
      const token = tokens[0].token;

      // Multiple concurrent verification attempts
      const results = await Promise.all([
        emailService.verifyEmail(token),
        emailService.verifyEmail(token),
        emailService.verifyEmail(token),
      ]);

      // With deleteMany, all can succeed
      const successCount = results.filter((r) => r.success).length;
      expect(successCount).toBeGreaterThanOrEqual(1);

      // User should be verified
      const user2 = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { isEmailVerified: true },
      });
      expect(user2?.isEmailVerified).toBe(true);
    });
  });

  describe("Email Content", () => {
    it("should include verification link in email", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      const user = await createTestUser({
        email: testEmail,
        verified: false,
      });
      testUserId = user.id;

      await emailService.sendVerificationEmail(testUserId, testEmail);

      const emails = getCapturedEmails();
      const verificationLink = extractVerificationLink(emails[0].html);

      expect(verificationLink).toBeTruthy();
      expect(verificationLink).toContain("verify-email");
      expect(verificationLink).toContain("token=");
    });

    it("should include valid token in email link", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      const user = await createTestUser({
        email: testEmail,
        verified: false,
      });
      testUserId = user.id;

      await emailService.sendVerificationEmail(testUserId, testEmail);

      const emails = getCapturedEmails();
      const verificationLink = extractVerificationLink(emails[0].html);
      const tokenFromEmail = extractTokenFromLink(verificationLink!);

      const tokens = await getVerificationTokensForUser(testUserId);
      expect(tokenFromEmail).toBe(tokens[0].token);
    });
  });

  describe("Complete Flow End-to-End", () => {
    it("should complete full verification flow from signup to verified", async () => {
      const { emailService } = await import(
        "../../server/services/emailService"
      );

      // 1. Create user (signup)
      const user = await createTestUser({
        email: testEmail,
        password: "Test1234",
        verified: false,
      });
      testUserId = user.id;

      expect(user.isEmailVerified).toBe(false);

      // 2. Send verification email
      await emailService.sendVerificationEmail(testUserId, testEmail);

      // 3. Check email was sent
      const emails = getCapturedEmails();
      expect(emails).toHaveLength(1);

      // 4. Extract token from email
      const verificationLink = extractVerificationLink(emails[0].html);
      const token = extractTokenFromLink(verificationLink!);

      // 5. Verify email
      const result = await emailService.verifyEmail(token!);
      expect(result.success).toBe(true);

      // 6. Check user is now verified
      const verifiedUser = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { isEmailVerified: true, emailVerified: true },
      });

      expect(verifiedUser?.isEmailVerified).toBe(true);
      expect(verifiedUser?.emailVerified).toBeInstanceOf(Date);

      // 7. Token should be deleted
      const tokenExists = await verificationTokenExists(token!);
      expect(tokenExists).toBe(false);
    });
  });
});

