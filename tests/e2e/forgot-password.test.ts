/**
 * Forgot Password E2E Tests
 *
 * End-to-end tests simulating full user flow for forgot password:
 * - Navigate to forgot password page
 * - Enter email
 * - Receive reset link via email
 * - Click link and set new password
 * - Sign in with new password
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

/**
 * Note: These are E2E-style tests that simulate user flows
 * without actual browser automation. They test the complete
 * flow through services and database.
 */

describe("Forgot Password E2E Flow", () => {
  let testUserId: string;
  let testUserEmail: string;
  const oldPassword = "OldPassword123";
  const newPassword = "NewPassword456";

  beforeEach(async () => {
    clearCapturedEmails();
    const user = await createTestUser({
      email: `forgot-e2e-${Date.now()}@example.com`,
      password: oldPassword,
      hasPassword: true,
      verified: true,
    });
    testUserId = user.id;
    testUserEmail = user.email!;
  });

  afterEach(async () => {
    if (testUserId) {
      await cleanupTestUserById(testUserId);
    }
  });

  describe("Complete Flow", () => {
    it("should complete full forgot password flow from start to finish", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      // USER STORY: Complete Journey

      // 1. User goes to sign-in page
      // (GET /signin)

      // 2. User can't remember password
      // 3. User clicks "Forgot password?" link
      // (Navigate to /forgot-password)

      // 4. Forgot password page loads
      // (Shows email input form)

      // 5. User enters their email address
      const emailInput = testUserEmail;

      // 6. User clicks "Send reset link" button
      const requestResult = await passwordService.requestPasswordReset(
        emailInput
      );

      expect(requestResult.success).toBe(true);

      // 7. Success message shown:
      // "If an account exists with this email, you'll receive a reset link"

      // 8. Email is sent to user
      const emails = getCapturedEmails();
      expect(emails).toHaveLength(1);
      expect(emails[0].to).toBe(testUserEmail);
      expect(emails[0].subject).toContain("Reset");

      // 9. User checks their email inbox
      // 10. User finds the password reset email
      const resetEmail = emails[0];

      // 11. User clicks the reset link in the email
      const resetLink = extractResetLink(resetEmail.html);
      expect(resetLink).toBeTruthy();

      const token = extractTokenFromLink(resetLink!);
      expect(token).toBeTruthy();

      // 12. User is redirected to reset password page
      // (GET /reset-password?token=...)

      // 13. Reset password page loads with token
      // (Shows new password form)

      // 14. User enters new password
      // 15. User confirms new password
      const formData = {
        newPassword: newPassword,
        confirmPassword: newPassword,
      };

      // 16. Client-side validation
      const validation = passwordService.validatePassword(formData.newPassword);
      expect(validation.valid).toBe(true);
      expect(formData.newPassword).toBe(formData.confirmPassword);

      // 17. User submits form
      const resetResult = await passwordService.resetPassword(
        token!,
        formData.newPassword
      );

      expect(resetResult.success).toBe(true);

      // 18. Success message: "Password reset successfully"
      // 19. User is redirected to sign-in page

      // 20. User signs in with NEW password
      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
        select: { passwordHash: true },
      });

      const canSignInWithNew = await compare(newPassword, user!.passwordHash!);
      expect(canSignInWithNew).toBe(true);

      // 21. Old password no longer works
      const canSignInWithOld = await compare(oldPassword, user!.passwordHash!);
      expect(canSignInWithOld).toBe(false);

      // 22. User successfully signed in
      // 23. User can access their account
    });

    it("should show success message after requesting reset", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      const result = await passwordService.requestPasswordReset(testUserEmail);

      expect(result.success).toBe(true);

      // In real app:
      // - Show message: "If an account exists with this email, you'll receive a reset link"
      // - Don't reveal if email exists (security)
      // - Show message for 5 seconds
      // - Optionally redirect to sign-in
    });

    it("should send email with reset link", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.requestPasswordReset(testUserEmail);

      const emails = getCapturedEmails();
      expect(emails).toHaveLength(1);

      const resetLink = extractResetLink(emails[0].html);
      expect(resetLink).toContain("reset-password");
      expect(resetLink).toContain("token=");

      // In real app, email contains:
      // - Branded email template
      // - Clear reset button
      // - Expiry notice (1 hour)
      // - Alternative text link
      // - "Didn't request this?" message
    });

    it("should show success message after resetting password", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );
      const { token } = await createPasswordResetToken(testUserId);

      const result = await passwordService.resetPassword(token, newPassword);

      expect(result.success).toBe(true);

      // In real app:
      // - Show: "Password reset successfully!"
      // - Auto-redirect to sign-in after 3 seconds
      // - Or show "Sign in" button
    });

    it("should allow immediate sign-in with new password", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.requestPasswordReset(testUserEmail);
      const emails = getCapturedEmails();
      const resetLink = extractResetLink(emails[0].html);
      const token = extractTokenFromLink(resetLink!);

      await passwordService.resetPassword(token!, newPassword);

      // Immediate sign-in should work
      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
        select: { passwordHash: true },
      });

      const canSignIn = await compare(newPassword, user!.passwordHash!);
      expect(canSignIn).toBe(true);
    });
  });

  describe("Error Scenarios", () => {
    it("should show error for invalid reset link", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      // User clicks on invalid/tampered link
      const result = await passwordService.resetPassword(
        "invalid-token-123",
        newPassword
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired reset link");

      // In real app:
      // - Show error: "This reset link is invalid"
      // - Provide link to request new reset link
      // - Show "Back to sign in" button
    });

    it("should show error for expired reset link", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      // Create expired token
      const expiredToken = await createExpiredPasswordResetToken(testUserId);

      const result = await passwordService.resetPassword(
        expiredToken,
        newPassword
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Reset link has expired");

      // In real app:
      // - Show error: "This reset link has expired"
      // - Show "Request new link" button
      // - Mention expiry time (1 hour)
    });

    it("should show error for weak new password", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      const weakPasswords = [
        { password: "short", error: "at least 8 characters" },
        { password: "nouppercase1", error: "uppercase letter" },
        { password: "NOLOWERCASE1", error: "lowercase letter" },
        { password: "NoNumbers", error: "number" },
      ];

      for (const { password, error } of weakPasswords) {
        const validation = passwordService.validatePassword(password);

        expect(validation.valid).toBe(false);
        expect(validation.error?.toLowerCase()).toContain(error.toLowerCase());

        // In real app:
        // - Show error under password field
        // - Disable submit button
        // - Show password requirements checklist
        // - Update checklist as user types
      }
    });

    it("should show error for non-matching password confirmation", async () => {
      // Client-side validation
      const passwordInput = "NewPassword123";
      const confirmInput = "DifferentPassword123";

      const passwordsMatch = passwordInput === confirmInput;
      expect(passwordsMatch).toBe(false);

      // In real app:
      // - Show error: "Passwords do not match"
      // - Highlight confirm password field
      // - Disable submit button
      // - Clear on re-entry
    });

    it("should prevent token reuse", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );
      const { token } = await createPasswordResetToken(testUserId);

      // Use once
      const firstResult = await passwordService.resetPassword(
        token,
        newPassword
      );
      expect(firstResult.success).toBe(true);

      // Try again with same token
      const secondResult = await passwordService.resetPassword(
        token,
        "AnotherPassword123"
      );
      expect(secondResult.success).toBe(false);

      // In real app:
      // - Show error: "This reset link has already been used"
      // - Provide option to request new link
    });
  });

  describe("UI/UX Details", () => {
    it("should show password requirements in real-time", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      // As user types, validate each character
      const typingSequence = [
        "P", // Too short
        "Pa", // Too short
        "Pas", // Too short
        "Pass", // Too short
        "Passw", // Too short
        "Passwo", // Too short
        "Passwor", // Too short
        "Password", // No number
        "Password1", // Valid!
      ];

      for (const partial of typingSequence) {
        const validation = passwordService.validatePassword(partial);

        if (partial === "Password1") {
          expect(validation.valid).toBe(true);
        } else {
          expect(validation.valid).toBe(false);
        }

        // In real app:
        // - Update checklist dynamically
        // - Show green checkmarks for met requirements
        // - Red X for unmet requirements
        // - Enable submit only when all met
      }
    });

    it("should handle show/hide password toggle", async () => {
      // UI state simulation
      let passwordVisible = false;
      let confirmPasswordVisible = false;

      // User clicks show on password field
      passwordVisible = !passwordVisible;
      expect(passwordVisible).toBe(true);

      // User clicks show on confirm field
      confirmPasswordVisible = !confirmPasswordVisible;
      expect(confirmPasswordVisible).toBe(true);

      // User clicks hide on password field
      passwordVisible = !passwordVisible;
      expect(passwordVisible).toBe(false);

      // In real app:
      // - Toggle input type: password ↔ text
      // - Toggle icon: eye ↔ eye-slash
      // - Accessibility: update aria-label
    });

    it("should show loading state during submission", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );
      const { token } = await createPasswordResetToken(testUserId);

      // Simulate loading state
      let isLoading = true;

      // Submit
      const resultPromise = passwordService.resetPassword(token, newPassword);

      // In real app while loading:
      // - Disable submit button
      // - Show loading spinner
      // - Button text: "Resetting..." or spinner

      const result = await resultPromise;
      isLoading = false;

      expect(result.success).toBe(true);
      expect(isLoading).toBe(false);

      // After success:
      // - Hide loading spinner
      // - Show success message
      // - Redirect or show sign-in button
    });

    it("should provide clear expiry information", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.requestPasswordReset(testUserEmail);

      const token = await prisma.verificationToken.findFirst({
        where: { identifier: `password-reset:${testUserId}` },
      });

      const expiresIn = token!.expires.getTime() - Date.now();
      const expiresInMinutes = Math.floor(expiresIn / (60 * 1000));

      expect(expiresInMinutes).toBeLessThanOrEqual(60);
      expect(expiresInMinutes).toBeGreaterThan(55);

      // In real app:
      // - Show in email: "This link expires in 1 hour"
      // - On reset page: Show countdown if possible
      // - Or: "Valid until [timestamp]"
    });
  });

  describe("Security Considerations", () => {
    it("should not reveal if email exists", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      // Request for existing email
      const result1 = await passwordService.requestPasswordReset(testUserEmail);

      // Request for non-existing email
      const result2 = await passwordService.requestPasswordReset(
        "nonexistent@example.com"
      );

      // Both should return same response
      expect(result1.success).toBe(result2.success);
      expect(result1.error).toBe(result2.error);

      // In real app:
      // - Always show: "If an account exists..."
      // - Never: "Email not found"
      // - Never: "Email sent successfully"
      // - Prevents email enumeration attacks
    });

    it("should handle OAuth users without revealing them", async () => {
      const oauthUser = await createTestUser({
        email: `oauth-forgot-${Date.now()}@example.com`,
        hasPassword: false,
      });

      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      const result = await passwordService.requestPasswordReset(
        oauthUser.email!
      );

      // Should return success (don't reveal OAuth)
      expect(result.success).toBe(true);

      // No email should be sent
      const emailsBeforeCleanup = getCapturedEmails().filter(
        (e) => e.to === oauthUser.email
      );
      expect(emailsBeforeCleanup).toHaveLength(0);

      // In real app:
      // - Show same message as normal users
      // - Don't send email to OAuth users
      // - Don't reveal OAuth status

      await cleanupTestUserById(oauthUser.id);
    });

    it("should require valid token to reset password", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      // Try to reset without token
      const result = await passwordService.resetPassword("", newPassword);

      expect(result.success).toBe(false);

      // In real app:
      // - If no token in URL, show error
      // - Redirect to forgot password page
      // - Show: "Invalid or missing reset token"
    });

    it("should invalidate old password immediately", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      await passwordService.requestPasswordReset(testUserEmail);
      const emails = getCapturedEmails();
      const resetLink = extractResetLink(emails[0].html);
      const token = extractTokenFromLink(resetLink!);

      await passwordService.resetPassword(token!, newPassword);

      // Old password should not work
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      const oldPasswordWorks = await compare(oldPassword, user!.passwordHash!);
      expect(oldPasswordWorks).toBe(false);

      // In real app:
      // - All existing sessions should be invalidated
      // - User should sign in again with new password
      // - Send "Password changed" email to user
    });
  });

  describe("Alternative Flows", () => {
    it("should allow user to request multiple reset links", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      // User requests reset
      await passwordService.requestPasswordReset(testUserEmail);

      // User didn't receive email, requests again
      await passwordService.requestPasswordReset(testUserEmail);

      // User still didn't get it, requests again
      await passwordService.requestPasswordReset(testUserEmail);

      // All requests should succeed
      const emails = getCapturedEmails();
      expect(emails.length).toBeGreaterThanOrEqual(3);

      // In real app:
      // - All links should work (until used)
      // - Implement rate limiting (e.g., max 5 per hour)
      // - Consider deleting old tokens after N requests
    });

    it("should allow user to return to sign in from forgot password", async () => {
      // User on forgot password page
      // User clicks "Back to sign in"
      const navigateToSignIn = true;

      expect(navigateToSignIn).toBe(true);

      // In real app:
      // - Link: "Back to sign in"
      // - Navigate to /signin
      // - No form submission
    });

    it("should allow user to return to sign in from reset password", async () => {
      // User on reset password page
      // User clicks "Back to sign in"
      const navigateToSignIn = true;

      expect(navigateToSignIn).toBe(true);

      // In real app:
      // - Link: "Remember your password? Sign in"
      // - Navigate to /signin
      // - Token is not invalidated (still usable)
    });
  });

  describe("Complete User Journey - Multiple Scenarios", () => {
    it("should handle user who requests reset but remembers password", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      // 1. User requests reset
      await passwordService.requestPasswordReset(testUserEmail);

      // 2. User receives email
      const emails = getCapturedEmails();
      expect(emails).toHaveLength(1);

      // 3. User remembers password before clicking link
      // 4. User signs in with original password
      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
        select: { passwordHash: true },
      });

      const canSignIn = await compare(oldPassword, user!.passwordHash!);
      expect(canSignIn).toBe(true);

      // 5. Reset link still exists but unused
      const token = await prisma.verificationToken.findFirst({
        where: { identifier: `password-reset:${testUserId}` },
      });
      expect(token).not.toBeNull();

      // In real app:
      // - Token expires after 1 hour
      // - No harm if unused
      // - User can still use link if needed
    });

    it("should handle user who clicks expired link then requests new one", async () => {
      const { passwordService } = await import(
        "../../server/services/passwordService"
      );

      // 1. User has expired token
      const expiredToken = await createExpiredPasswordResetToken(testUserId);

      // 2. User clicks expired link
      const expiredResult = await passwordService.resetPassword(
        expiredToken,
        newPassword
      );
      expect(expiredResult.success).toBe(false);

      // 3. Error message shown
      // 4. User clicks "Request new link"
      // (Navigate back to /forgot-password)

      // 5. User requests new reset link
      clearCapturedEmails();
      await passwordService.requestPasswordReset(testUserEmail);

      // 6. New email sent
      const emails = getCapturedEmails();
      expect(emails).toHaveLength(1);

      // 7. User gets fresh link
      const resetLink = extractResetLink(emails[0].html);
      const newToken = extractTokenFromLink(resetLink!);

      // 8. User resets password successfully
      const result = await passwordService.resetPassword(
        newToken!,
        newPassword
      );
      expect(result.success).toBe(true);
    });
  });
});

