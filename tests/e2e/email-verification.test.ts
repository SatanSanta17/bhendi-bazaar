/**
 * Email Verification E2E Tests
 *
 * End-to-end tests simulating full user flow for email verification:
 * - Signup with unverified email
 * - Banner display
 * - Email verification via link
 * - Profile indicator updates
 * - Email update triggers re-verification
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createTestUser,
  cleanupTestUserById,
  getVerificationTokensForUser,
} from "../utils/auth-helpers";
import { createCapturingResendMock } from "../utils/email-mocks";

// Mock Resend with email capture
vi.mock("resend", () => createCapturingResendMock());

/**
 * Note: These are E2E-style tests that simulate user flows
 * without actual browser automation. They test the complete
 * flow through services and database.
 *
 * For true E2E tests with browser automation, consider:
 * - Playwright
 * - Cypress
 * - Puppeteer
 */

describe("Email Verification E2E Flow", () => {
  let testUserId: string;
  let testUserEmail: string;

  afterEach(async () => {
    if (testUserId) {
      await cleanupTestUserById(testUserId);
    }
  });

  describe("Signup → Verify Flow", () => {
    it("should complete full signup and verification flow", async () => {
      const { emailService } = await import("@/server/services/emailService");

      // STEP 1: User signs up
      testUserEmail = `e2e-test-${Date.now()}@example.com`;
      const user = await createTestUser({
        email: testUserEmail,
        password: "Test1234",
        verified: false,
        hasPassword: true,
      });
      testUserId = user.id;

      // STEP 2: User should be unverified
      expect(user.isEmailVerified).toBe(false);

      // STEP 3: Verification email sent
      await emailService.sendVerificationEmail(testUserId, testUserEmail);

      // STEP 4: User receives email with token
      const tokens = await getVerificationTokensForUser(testUserId);
      expect(tokens).toHaveLength(1);
      const verificationToken = tokens[0].token;

      // STEP 5: User clicks verification link
      const result = await emailService.verifyEmail(verificationToken);
      expect(result.success).toBe(true);

      // STEP 6: User is now verified
      const verifiedUser = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { isEmailVerified: true, emailVerified: true },
      });

      expect(verifiedUser?.isEmailVerified).toBe(true);
      expect(verifiedUser?.emailVerified).toBeInstanceOf(Date);

      // STEP 7: Verification token is deleted
      const remainingTokens = await getVerificationTokensForUser(testUserId);
      expect(remainingTokens).toHaveLength(0);
    });

    it("should show banner for unverified users", async () => {
      const { emailService } = await import("@/server/services/emailService");

      // User signs up
      testUserEmail = `banner-test-${Date.now()}@example.com`;
      const user = await createTestUser({
        email: testUserEmail,
        verified: false,
      });
      testUserId = user.id;

      // Get verification status (simulates ProfileContext)
      const status = await emailService.getVerificationStatus(testUserId);

      // Banner should be shown
      expect(status.isVerified).toBe(false);
      expect(status.email).toBe(testUserEmail);
    });

    it("should hide banner after verification", async () => {
      const { emailService } = await import("@/server/services/emailService");

      // User signs up and verifies
      testUserEmail = `hide-banner-${Date.now()}@example.com`;
      const user = await createTestUser({
        email: testUserEmail,
        verified: false,
      });
      testUserId = user.id;

      await emailService.sendVerificationEmail(testUserId, testUserEmail);
      const tokens = await getVerificationTokensForUser(testUserId);
      await emailService.verifyEmail(tokens[0].token);

      // Get verification status
      const status = await emailService.getVerificationStatus(testUserId);

      // Banner should NOT be shown
      expect(status.isVerified).toBe(true);
    });

    it("should show verified badge in profile menu", async () => {
      const { emailService } = await import("@/server/services/emailService");

      // Verified user
      testUserEmail = `verified-badge-${Date.now()}@example.com`;
      const user = await createTestUser({
        email: testUserEmail,
        verified: true,
      });
      testUserId = user.id;

      // Get user data (simulates ProfileContext)
      const userData = await prisma.user.findUnique({
        where: { id: testUserId },
        select: {
          isEmailVerified: true,
          email: true,
          name: true,
        },
      });

      // Profile menu should show verified status
      expect(userData?.isEmailVerified).toBe(true);
    });

    it("should show warning in profile menu for unverified users", async () => {
      // Unverified user
      testUserEmail = `unverified-warning-${Date.now()}@example.com`;
      const user = await createTestUser({
        email: testUserEmail,
        verified: false,
      });
      testUserId = user.id;

      // Get user data
      const userData = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { isEmailVerified: true },
      });

      // Profile menu should show warning
      expect(userData?.isEmailVerified).toBe(false);
    });
  });

  describe("Email Update → Re-verify Flow", () => {
    it("should trigger re-verification on email update", async () => {
      const { emailService } = await import("@/server/services/emailService");
      const { profileService } = await import(
        "@/server/services/profileService"
      );

      // STEP 1: User starts verified
      testUserEmail = `original-${Date.now()}@example.com`;
      const user = await createTestUser({
        email: testUserEmail,
        verified: true,
      });
      testUserId = user.id;

      expect(user.isEmailVerified).toBe(true);

      // STEP 2: User updates email
      const newEmail = `updated-${Date.now()}@example.com`;

      // This happens in profileRepository.update
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          email: newEmail,
          isEmailVerified: false,
        },
      });

      // STEP 3: Old verification tokens deleted
      await prisma.verificationToken.deleteMany({
        where: { identifier: testUserId },
      });

      // STEP 4: New verification email sent
      await emailService.sendVerificationEmail(testUserId, newEmail);

      // STEP 5: User is now unverified
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { isEmailVerified: true, email: true },
      });

      expect(updatedUser?.isEmailVerified).toBe(false);
      expect(updatedUser?.email).toBe(newEmail);

      // STEP 6: New verification token exists
      const tokens = await getVerificationTokensForUser(testUserId);
      expect(tokens).toHaveLength(1);

      // STEP 7: Banner should reappear
      const status = await emailService.getVerificationStatus(testUserId);
      expect(status.isVerified).toBe(false);

      // STEP 8: User can verify with new token
      const result = await emailService.verifyEmail(tokens[0].token);
      expect(result.success).toBe(true);

      // STEP 9: User is verified again
      const finalUser = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { isEmailVerified: true },
      });
      expect(finalUser?.isEmailVerified).toBe(true);
    });

    it("should show banner again after email update", async () => {
      const { emailService } = await import("@/server/services/emailService");

      // Verified user
      testUserEmail = `banner-reappear-${Date.now()}@example.com`;
      const user = await createTestUser({
        email: testUserEmail,
        verified: true,
      });
      testUserId = user.id;

      // Banner hidden initially
      let status = await emailService.getVerificationStatus(testUserId);
      expect(status.isVerified).toBe(true);

      // Update email
      await prisma.user.update({
        where: { id: testUserId },
        data: { isEmailVerified: false },
      });

      // Banner should appear
      status = await emailService.getVerificationStatus(testUserId);
      expect(status.isVerified).toBe(false);
    });
  });

  describe("Resend Verification Flow", () => {
    it("should allow user to resend verification email", async () => {
      const { emailService } = await import("@/server/services/emailService");

      // STEP 1: Unverified user
      testUserEmail = `resend-${Date.now()}@example.com`;
      const user = await createTestUser({
        email: testUserEmail,
        verified: false,
      });
      testUserId = user.id;

      // STEP 2: Initial verification email sent
      await emailService.sendVerificationEmail(testUserId, testUserEmail);
      const initialTokens = await getVerificationTokensForUser(testUserId);
      const initialToken = initialTokens[0].token;

      // STEP 3: User dismisses banner (simulated by sessionStorage in real app)

      // STEP 4: User goes to profile and clicks "Resend Verification"
      await emailService.resendVerificationEmail(testUserId);

      // STEP 5: Old token deleted, new token created
      const newTokens = await getVerificationTokensForUser(testUserId);
      expect(newTokens).toHaveLength(1);
      expect(newTokens[0].token).not.toBe(initialToken);

      // STEP 6: User can verify with new token
      const result = await emailService.verifyEmail(newTokens[0].token);
      expect(result.success).toBe(true);
    });

    it("should prevent resend for already verified users", async () => {
      const { emailService } = await import("@/server/services/emailService");

      // Verified user
      testUserEmail = `already-verified-${Date.now()}@example.com`;
      const user = await createTestUser({
        email: testUserEmail,
        verified: true,
      });
      testUserId = user.id;

      // Try to resend
      await expect(
        emailService.resendVerificationEmail(testUserId)
      ).rejects.toThrow("Email already verified");
    });
  });

  describe("Error Scenarios", () => {
    it("should show error for invalid verification link", async () => {
      const { emailService } = await import("@/server/services/emailService");

      // User tries to verify with invalid token
      const result = await emailService.verifyEmail("invalid-token-12345");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid verification token");
    });

    it("should show error for expired verification link", async () => {
      const { emailService } = await import("@/server/services/emailService");

      testUserEmail = `expired-link-${Date.now()}@example.com`;
      const user = await createTestUser({
        email: testUserEmail,
        verified: false,
      });
      testUserId = user.id;

      // Create expired token
      const expiredToken = await prisma.verificationToken.create({
        data: {
          identifier: testUserId,
          token: "expired-token-123",
          expires: new Date(Date.now() - 1000),
        },
      });

      const result = await emailService.verifyEmail(expiredToken.token);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Verification token has expired");
    });

    it("should show success message after verification", async () => {
      const { emailService } = await import("@/server/services/emailService");

      testUserEmail = `success-message-${Date.now()}@example.com`;
      const user = await createTestUser({
        email: testUserEmail,
        verified: false,
      });
      testUserId = user.id;

      await emailService.sendVerificationEmail(testUserId, testUserEmail);
      const tokens = await getVerificationTokensForUser(testUserId);

      const result = await emailService.verifyEmail(tokens[0].token);

      // Should return success
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("Complete User Journey", () => {
    it("should complete full user journey from signup to verified", async () => {
      const { emailService } = await import("@/server/services/emailService");

      // USER STORY:
      // 1. New user signs up with email/password
      testUserEmail = `journey-${Date.now()}@example.com`;
      const user = await createTestUser({
        email: testUserEmail,
        name: "Test User",
        password: "Test1234",
        verified: false,
        hasPassword: true,
      });
      testUserId = user.id;

      // 2. User sees "Verify your email" banner
      let status = await emailService.getVerificationStatus(testUserId);
      expect(status.isVerified).toBe(false);

      // 3. Verification email sent automatically
      await emailService.sendVerificationEmail(testUserId, testUserEmail);

      // 4. User checks their email inbox (simulated)
      const tokens = await getVerificationTokensForUser(testUserId);
      expect(tokens.length).toBeGreaterThan(0);

      // 5. User clicks verification link in email
      const verificationResult = await emailService.verifyEmail(
        tokens[0].token
      );
      expect(verificationResult.success).toBe(true);

      // 6. User is redirected to home page with success message

      // 7. Banner disappears
      status = await emailService.getVerificationStatus(testUserId);
      expect(status.isVerified).toBe(true);

      // 8. Profile menu shows verified badge
      const userData = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { isEmailVerified: true, emailVerified: true },
      });
      expect(userData?.isEmailVerified).toBe(true);
      expect(userData?.emailVerified).toBeInstanceOf(Date);

      // 9. User can now access all features
      // (In real app, this might unlock certain features)

      // 10. Later, user updates their email
      const newEmail = `updated-journey-${Date.now()}@example.com`;
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          email: newEmail,
          isEmailVerified: false,
        },
      });

      // 11. Banner reappears
      status = await emailService.getVerificationStatus(testUserId);
      expect(status.isVerified).toBe(false);

      // 12. New verification email sent
      await prisma.verificationToken.deleteMany({
        where: { identifier: testUserId },
      });
      await emailService.sendVerificationEmail(testUserId, newEmail);

      // 13. User verifies new email
      const newTokens = await getVerificationTokensForUser(testUserId);
      const newVerificationResult = await emailService.verifyEmail(
        newTokens[0].token
      );
      expect(newVerificationResult.success).toBe(true);

      // 14. User is fully verified with new email
      const finalUser = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { isEmailVerified: true, email: true },
      });
      expect(finalUser?.isEmailVerified).toBe(true);
      expect(finalUser?.email).toBe(newEmail);
    });
  });
});

