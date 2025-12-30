/**
 * Password Change Integration Tests
 *
 * Integration tests covering authenticated password change functionality:
 * - API authentication requirements
 * - Password validation
 * - Successful password changes
 * - Security considerations
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import {
  createTestUser,
  cleanupTestUserById,
  createMockSession,
} from "../utils/auth-helpers";

describe("Password Change Integration", () => {
  let testUserId: string;
  let testUserEmail: string;
  const testPassword = "OldPassword123";
  const newPassword = "NewPassword123";

  beforeEach(async () => {
    const user = await createTestUser({
      email: `test-${Date.now()}@example.com`,
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

  describe("Success Flow", () => {
    it("should change password with valid credentials", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      const result = await passwordService.changePassword(
        testUserId,
        testPassword,
        newPassword
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should allow sign in with new password after change", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      await passwordService.changePassword(
        testUserId,
        testPassword,
        newPassword
      );

      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      const canSignInWithNew = await compare(newPassword, user!.passwordHash!);
      expect(canSignInWithNew).toBe(true);
    });

    it("should NOT allow sign in with old password after change", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      await passwordService.changePassword(
        testUserId,
        testPassword,
        newPassword
      );

      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      const canSignInWithOld = await compare(testPassword, user!.passwordHash!);
      expect(canSignInWithOld).toBe(false);
    });

    it("should hash password before storage", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      await passwordService.changePassword(
        testUserId,
        testPassword,
        newPassword
      );

      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      // Should not store plain password
      expect(user?.passwordHash).not.toBe(newPassword);
      // Should be bcrypt hash
      expect(user?.passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it("should allow multiple consecutive password changes", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      // First change
      const result1 = await passwordService.changePassword(
        testUserId,
        testPassword,
        newPassword
      );
      expect(result1.success).toBe(true);

      // Second change
      const result2 = await passwordService.changePassword(
        testUserId,
        newPassword,
        "ThirdPassword123"
      );
      expect(result2.success).toBe(true);

      // Third change
      const result3 = await passwordService.changePassword(
        testUserId,
        "ThirdPassword123",
        "FourthPassword123"
      );
      expect(result3.success).toBe(true);
    });
  });

  describe("Validation", () => {
    it("should validate current password", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      const result = await passwordService.changePassword(
        testUserId,
        "WrongPassword123",
        newPassword
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Current password is incorrect");
    });

    it("should enforce password strength requirements", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      // Test weak passwords
      const weakPasswords = [
        "short", // Too short
        "nouppercase123", // No uppercase
        "NOLOWERCASE123", // No lowercase
        "NoNumbers", // No numbers
      ];

      for (const weakPassword of weakPasswords) {
        const validation = passwordService.validatePassword(weakPassword);
        expect(validation.valid).toBe(false);
        expect(validation.error).toBeTruthy();
      }
    });

    it("should accept strong passwords", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      const strongPasswords = [
        "StrongPass123",
        "MyP@ssw0rd",
        "SecurePassword1",
        "Valid123Password",
      ];

      for (const strongPassword of strongPasswords) {
        const validation = passwordService.validatePassword(strongPassword);
        expect(validation.valid).toBe(true);
      }
    });

    it("should return clear error messages", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      // Wrong current password
      const result1 = await passwordService.changePassword(
        testUserId,
        "WrongPass123",
        newPassword
      );
      expect(result1.error).toBe("Current password is incorrect");

      // Non-existent user
      const result2 = await passwordService.changePassword(
        "fake-id",
        testPassword,
        newPassword
      );
      expect(result2.error).toBe("User not found");
    });
  });

  describe("OAuth Users", () => {
    it("should prevent password change for OAuth users", async () => {
      const oauthUser = await createTestUser({
        email: `oauth-${Date.now()}@example.com`,
        hasPassword: false, // OAuth user has no password
      });

      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      const result = await passwordService.changePassword(
        oauthUser.id,
        "anything",
        newPassword
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Cannot change password for OAuth accounts");

      await cleanupTestUserById(oauthUser.id);
    });

    it("should identify OAuth users correctly", async () => {
      const oauthUser = await createTestUser({
        email: `oauth-${Date.now()}@example.com`,
        hasPassword: false,
      });

      const user = await prisma.user.findUnique({
        where: { id: oauthUser.id },
        select: { passwordHash: true },
      });

      expect(user?.passwordHash).toBeNull();

      await cleanupTestUserById(oauthUser.id);
    });
  });

  describe("Security", () => {
    it("should use bcrypt with 10 rounds", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      await passwordService.changePassword(
        testUserId,
        testPassword,
        newPassword
      );

      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      // Bcrypt format: $2a$rounds$salt$hash
      // Check for 10 rounds
      expect(user?.passwordHash).toMatch(/^\$2[aby]\$10\$/);
    });

    it("should not reveal old password in error messages", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      const result = await passwordService.changePassword(
        testUserId,
        "WrongPassword123",
        newPassword
      );

      expect(result.error).not.toContain(testPassword);
      expect(result.error).not.toContain("WrongPassword123");
    });

    it("should not store password in plain text", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      await passwordService.changePassword(
        testUserId,
        testPassword,
        newPassword
      );

      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });

      expect(user?.passwordHash).not.toBe(newPassword);
      expect(user?.passwordHash?.length).toBeGreaterThan(newPassword.length);
    });

    it("should generate different hashes for same password", async () => {
      // Create two users with the same password
      const user1 = await createTestUser({
        email: `user1-${Date.now()}@example.com`,
        password: testPassword,
      });

      const user2 = await createTestUser({
        email: `user2-${Date.now()}@example.com`,
        password: testPassword,
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

      // Hashes should be different (bcrypt uses random salt)
      expect(hash1).not.toBe(hash2);

      await cleanupTestUserById(user1.id);
      await cleanupTestUserById(user2.id);
    });

    it("should invalidate old password immediately", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      await passwordService.changePassword(
        testUserId,
        testPassword,
        newPassword
      );

      // Try to change password again with old password
      const result = await passwordService.changePassword(
        testUserId,
        testPassword,
        "AnotherNew123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Current password is incorrect");
    });
  });

  describe("Error Handling", () => {
    it("should handle non-existent user", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      const result = await passwordService.changePassword(
        "non-existent-id",
        testPassword,
        newPassword
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
    });

    it("should handle database errors gracefully", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      // Mock database error
      const mockFindUnique = prisma.user.findUnique;
      prisma.user.findUnique = async () => {
        throw new Error("Database connection failed");
      };

      const result = await passwordService.changePassword(
        testUserId,
        testPassword,
        newPassword
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to change password");

      // Restore
      prisma.user.findUnique = mockFindUnique;
    });

    it("should handle concurrent password changes", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

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
  });

  describe("Password Validation Edge Cases", () => {
    it("should accept passwords with special characters", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      const result = passwordService.validatePassword("P@ssw0rd!");
      expect(result.valid).toBe(true);
    });

    it("should accept passwords with spaces", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      const result = passwordService.validatePassword("My Pass Word 123");
      expect(result.valid).toBe(true);
    });

    it("should reject very short passwords", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      const result = passwordService.validatePassword("Aa1");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("at least 8 characters");
    });

    it("should accept exactly 8 character passwords if they meet requirements", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      const result = passwordService.validatePassword("Pass1234");
      expect(result.valid).toBe(true);
    });

    it("should accept very long passwords", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      const longPassword = "A".repeat(50) + "a1";
      const result = passwordService.validatePassword(longPassword);
      expect(result.valid).toBe(true);
    });
  });

  describe("Complete Flow", () => {
    it("should complete full password change flow", async () => {
      const { passwordService } = await import(
        "@/server/services/passwordService"
      );

      // 1. Verify current password works
      let user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });
      let canSignIn = await compare(testPassword, user!.passwordHash!);
      expect(canSignIn).toBe(true);

      // 2. Validate new password
      const validation = passwordService.validatePassword(newPassword);
      expect(validation.valid).toBe(true);

      // 3. Change password
      const result = await passwordService.changePassword(
        testUserId,
        testPassword,
        newPassword
      );
      expect(result.success).toBe(true);

      // 4. Verify old password no longer works
      user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: { passwordHash: true },
      });
      canSignIn = await compare(testPassword, user!.passwordHash!);
      expect(canSignIn).toBe(false);

      // 5. Verify new password works
      canSignIn = await compare(newPassword, user!.passwordHash!);
      expect(canSignIn).toBe(true);
    });
  });
});

