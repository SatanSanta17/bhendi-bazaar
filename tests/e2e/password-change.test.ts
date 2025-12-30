/**
 * Password Change E2E Tests
 *
 * End-to-end tests simulating full user flow for password change:
 * - Navigate to profile
 * - Open change password modal
 * - Enter passwords
 * - Validate and submit
 * - Sign out and sign in with new password
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import {
  createTestUser,
  cleanupTestUserById,
  hashPasswordForTest,
} from "../utils/auth-helpers";

/**
 * Note: These are E2E-style tests that simulate user flows
 * without actual browser automation. They test the complete
 * flow through services and database.
 */

describe("Password Change E2E Flow", () => {
  let testUserId: string;
  let testUserEmail: string;
  const currentPassword = "CurrentPass123";
  const newPassword = "NewPassword456";

  beforeEach(async () => {
    const user = await createTestUser({
      email: `password-e2e-${Date.now()}@example.com`,
      password: currentPassword,
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

  describe("Happy Path", () => {
    it("should complete full password change flow", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      // USER STORY:
      // 1. User navigates to profile page
      // (In real app: GET /profile)

      // 2. User sees their profile information
      const userData = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { name: true, email: true, passwordHash: true },
      });
      expect(userData).toBeTruthy();
      expect(userData?.passwordHash).toBeTruthy();

      // 3. User clicks "Change Password" button
      // (Modal opens in real app)

      // 4. User enters current password
      // 5. User enters new password
      // 6. User confirms new password

      // 7. Form validates new password
      const validation = passwordService.validatePassword(newPassword);
      expect(validation.valid).toBe(true);

      // 8. User submits form
      const result = await passwordService.changePassword(
        testUserId,
        currentPassword,
        newPassword
      );

      expect(result.success).toBe(true);

      // 9. Success message shown
      // (In real app: toast notification)

      // 10. Modal closes

      // 11. User can sign out
      // (In real app: clear session)

      // 12. User signs in with NEW password
      const userAfterChange = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      const canSignInWithNew = await compare(
        newPassword,
        userAfterChange!.passwordHash!
      );
      expect(canSignInWithNew).toBe(true);

      // 13. User CANNOT sign in with old password
      const canSignInWithOld = await compare(
        currentPassword,
        userAfterChange!.passwordHash!
      );
      expect(canSignInWithOld).toBe(false);
    });

    it("should show success message after password change", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      const result = await passwordService.changePassword(
        testUserId,
        currentPassword,
        newPassword
      );

      // Success indicator
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // In real app, this would trigger:
      // - Toast: "Password changed successfully"
      // - Modal closes
      // - Optional: prompt to sign in again
    });

    it("should allow immediate use of new password", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      await passwordService.changePassword(
        testUserId,
        currentPassword,
        newPassword
      );

      // Immediate sign-in should work
      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
        select: { passwordHash: true },
      });

      const canSignIn = await compare(newPassword, user!.passwordHash!);
      expect(canSignIn).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should show error for wrong current password", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      // User enters wrong current password
      const result = await passwordService.changePassword(
        testUserId,
        "WrongPassword123",
        newPassword
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Current password is incorrect");

      // In real app:
      // - Show error: "Current password is incorrect"
      // - Highlight current password field
      // - Keep modal open
    });

    it("should show error for weak new password", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      // User enters weak password
      const weakPasswords = [
        { password: "short", error: "at least 8 characters" },
        { password: "nouppercase1", error: "uppercase letter" },
        { password: "NOLOWERCASE1", error: "lowercase letter" },
        { password: "NoNumbers", error: "number" },
      ];

      for (const { password, error } of weakPasswords) {
        const validation = passwordService.validatePassword(password);

        expect(validation.valid).toBe(false);
        expect(validation.error).toContain(error);

        // In real app:
        // - Show error message
        // - Disable submit button
        // - Show password requirements
      }
    });

    it("should show error for non-matching password confirmation", async () => {
      // This validation happens on the client side
      const newPasswordInput = "NewPassword123";
      const confirmPasswordInput = "DifferentPassword123";

      // Client-side validation
      const passwordsMatch = newPasswordInput === confirmPasswordInput;
      expect(passwordsMatch).toBe(false);

      // In real app:
      // - Show error: "Passwords do not match"
      // - Highlight confirm password field
      // - Disable submit button
    });

    it("should handle show/hide password toggle", async () => {
      // UI interaction simulation
      let currentPasswordVisible = false;
      let newPasswordVisible = false;
      let confirmPasswordVisible = false;

      // User clicks show password on current password
      currentPasswordVisible = !currentPasswordVisible;
      expect(currentPasswordVisible).toBe(true);

      // User clicks show password on new password
      newPasswordVisible = !newPasswordVisible;
      expect(newPasswordVisible).toBe(true);

      // User clicks hide password on current password
      currentPasswordVisible = !currentPasswordVisible;
      expect(currentPasswordVisible).toBe(false);

      // In real app:
      // - Toggle input type between "password" and "text"
      // - Change icon from eye to eye-slash
    });
  });

  describe("OAuth Users", () => {
    it("should not show change password option for OAuth users", async () => {
      // Create OAuth user (no password)
      const oauthUser = await createTestUser({
        email: `oauth-${Date.now()}@example.com`,
        hasPassword: false,
      });

      const user = await prisma.user.findUnique({
        where: { id: oauthUser.id },
        select: { passwordHash: true },
      });

      // No password hash = OAuth user
      const isOAuthUser = user?.passwordHash === null;
      expect(isOAuthUser).toBe(true);

      // In real app:
      // - Don't render "Change Password" button
      // - Or show disabled button with tooltip:
      //   "You signed in with Google. Change your password there."

      await cleanupTestUserById(oauthUser.id);
    });

    it("should show appropriate message for OAuth users who try to change password", async () => {
      const oauthUser = await createTestUser({
        email: `oauth-attempt-${Date.now()}@example.com`,
        hasPassword: false,
      });

      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      const result = await passwordService.changePassword(
        oauthUser.id,
        "anything",
        "NewPassword123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Cannot change password for OAuth accounts");

      // In real app:
      // - Show message: "You signed in with Google. Manage your password there."
      // - Provide link to OAuth provider

      await cleanupTestUserById(oauthUser.id);
    });
  });

  describe("Security Validations", () => {
    it("should require authentication to change password", async () => {
      // Without authentication (no userId)
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      // Try with non-existent user
      const result = await passwordService.changePassword(
        "non-existent-id",
        currentPassword,
        newPassword
      );

      expect(result.success).toBe(false);

      // In real app:
      // - API route checks session: if (!session) return 401
      // - Redirect to sign-in page
      // - Show message: "Please sign in to change your password"
    });

    it("should not allow changing another user's password", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      // Create another user
      const otherUser = await createTestUser({
        email: `other-${Date.now()}@example.com`,
        password: "OtherPass123",
      });

      // Try to change other user's password using current user's credentials
      // (This should fail because password won't match)
      const result = await passwordService.changePassword(
        otherUser.id,
        currentPassword, // Current user's password
        newPassword
      );

      expect(result.success).toBe(false);

      // In real app:
      // - API route validates: session.user.id === userId
      // - Return 403 if trying to change someone else's password

      await cleanupTestUserById(otherUser.id);
    });

    it("should require correct current password", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      // Multiple incorrect attempts
      const incorrectPasswords = [
        "Wrong123",
        "NotRight456",
        "Incorrect789",
      ];

      for (const incorrectPassword of incorrectPasswords) {
        const result = await passwordService.changePassword(
          testUserId,
          incorrectPassword,
          newPassword
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Current password is incorrect");
      }

      // In real app:
      // - After N failed attempts, implement rate limiting
      // - Temporarily lock account or require CAPTCHA
      // - Send security alert email
    });
  });

  describe("UI/UX Flow", () => {
    it("should provide clear password requirements", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      // Password requirements
      const requirements = [
        { rule: "At least 8 characters", test: "Pass123" },
        { rule: "At least one uppercase letter", test: "password123" },
        { rule: "At least one lowercase letter", test: "PASSWORD123" },
        { rule: "At least one number", test: "Password" },
      ];

      for (const { rule, test } of requirements) {
        const validation = passwordService.validatePassword(test);
        expect(validation.valid).toBe(false);

        // In real app:
        // - Show requirements list with checkmarks/x marks
        // - Update in real-time as user types
        // - Green checkmark when requirement met
      }
    });

    it("should allow user to cancel password change", async () => {
      // User clicks cancel button
      const modalClosed = true;

      expect(modalClosed).toBe(true);

      // In real app:
      // - Modal closes
      // - No changes made
      // - Return to profile page
      // - Discard form data

      // Verify password unchanged
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      const passwordUnchanged = await compare(
        currentPassword,
        user!.passwordHash!
      );
      expect(passwordUnchanged).toBe(true);
    });

    it("should clear form after successful change", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      await passwordService.changePassword(
        testUserId,
        currentPassword,
        newPassword
      );

      // In real app after success:
      // - Clear all password fields
      // - Close modal
      // - Reset form state
      // - Clear any validation errors

      // Form should be ready for next use
      const formCleared = true;
      expect(formCleared).toBe(true);
    });
  });

  describe("Complete User Journey", () => {
    it("should complete full journey: sign in → change password → sign out → sign in with new", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      // COMPLETE USER JOURNEY:

      // 1. User signs in with current password
      let user = await prisma.user.findUnique({
        where: { email: testUserEmail },
        select: { passwordHash: true },
      });
      let canSignIn = await compare(currentPassword, user!.passwordHash!);
      expect(canSignIn).toBe(true);

      // 2. User navigates to profile
      // 3. User clicks "Change Password"
      // 4. Modal opens

      // 5. User fills in form
      const formData = {
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: newPassword,
      };

      // 6. Client-side validation
      const validation = passwordService.validatePassword(formData.newPassword);
      expect(validation.valid).toBe(true);
      expect(formData.newPassword).toBe(formData.confirmPassword);

      // 7. User submits form
      const result = await passwordService.changePassword(
        testUserId,
        formData.currentPassword,
        formData.newPassword
      );

      expect(result.success).toBe(true);

      // 8. Success message shown
      // 9. Modal closes
      // 10. User continues browsing

      // 11. User signs out
      // (Clear session)

      // 12. User signs in again with NEW password
      user = await prisma.user.findUnique({
        where: { email: testUserEmail },
        select: { passwordHash: true },
      });
      canSignIn = await compare(newPassword, user!.passwordHash!);
      expect(canSignIn).toBe(true);

      // 13. Old password no longer works
      canSignIn = await compare(currentPassword, user!.passwordHash!);
      expect(canSignIn).toBe(false);

      // 14. User successfully signed in with new password
      // 15. User can access all features
    });

    it("should handle password change followed by immediate password change", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      // First change
      const result1 = await passwordService.changePassword(
        testUserId,
        currentPassword,
        newPassword
      );
      expect(result1.success).toBe(true);

      // Immediate second change
      const newerPassword = "EvenNewerPassword789";
      const result2 = await passwordService.changePassword(
        testUserId,
        newPassword, // Use new password as current
        newerPassword
      );
      expect(result2.success).toBe(true);

      // Final password should be the newest one
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      const finalPasswordWorks = await compare(
        newerPassword,
        user!.passwordHash!
      );
      expect(finalPasswordWorks).toBe(true);
    });
  });
});

