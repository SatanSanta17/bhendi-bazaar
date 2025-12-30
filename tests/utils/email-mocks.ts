/**
 * Email Mock Utilities
 * 
 * Mock utilities for testing email-related functionality
 */

import { vi } from 'vitest';

interface CapturedEmail {
  to: string;
  subject: string;
  html: string;
  timestamp: Date;
}

let capturedEmails: CapturedEmail[] = [];

/**
 * Mock the Resend email service
 */
export function mockEmailService() {
  // Reset captured emails
  capturedEmails = [];

  // Mock Resend constructor and methods
  const mockResend = {
    emails: {
      send: vi.fn(async (options: any) => {
        capturedEmails.push({
          to: options.to,
          subject: options.subject,
          html: options.html,
          timestamp: new Date(),
        });

        return {
          data: { id: `email-${Date.now()}-${Math.random()}` },
          error: null,
        };
      }),
    },
  };

  return mockResend;
}

/**
 * Create a capturing Resend mock for use with vi.mock()
 * This is specifically for integration and E2E tests
 */
export function createCapturingResendMock() {
  return {
    Resend: class MockResend {
      emails = {
        send: vi.fn().mockImplementation(async (options: any) => {
          capturedEmails.push({
            to: options.to,
            subject: options.subject,
            html: options.html,
            timestamp: new Date(),
          });
          
          return {
            data: { id: `email-${Date.now()}-${Math.random()}` },
            error: null,
          };
        }),
      };
    },
  };
}

/**
 * Get all captured emails
 */
export function getCapturedEmails(): CapturedEmail[] {
  return [...capturedEmails];
}

/**
 * Get the last captured email
 */
export function getLastCapturedEmail(): CapturedEmail | undefined {
  return capturedEmails[capturedEmails.length - 1];
}

/**
 * Clear captured emails
 */
export function clearCapturedEmails(): void {
  capturedEmails = [];
}

/**
 * Extract verification link from email HTML
 */
export function extractVerificationLink(emailHtml: string): string | null {
  // Match the verification link pattern
  const match = emailHtml.match(
    /href=["']([^"']*verify-email[^"']*)["']/i
  );
  return match ? match[1] : null;
}

/**
 * Extract password reset link from email HTML
 */
export function extractResetLink(emailHtml: string): string | null {
  // Match the reset password link pattern
  const match = emailHtml.match(
    /href=["']([^"']*reset-password[^"']*)["']/i
  );
  return match ? match[1] : null;
}

/**
 * Extract token from verification link
 */
export function extractTokenFromLink(link: string): string | null {
  const url = new URL(link);
  return url.searchParams.get('token');
}

/**
 * Check if email was sent to specific address
 */
export function wasEmailSentTo(email: string): boolean {
  return capturedEmails.some((captured) => captured.to === email);
}

/**
 * Get emails sent to specific address
 */
export function getEmailsSentTo(email: string): CapturedEmail[] {
  return capturedEmails.filter((captured) => captured.to === email);
}

/**
 * Check if email with subject was sent
 */
export function wasEmailSentWithSubject(subject: string): boolean {
  return capturedEmails.some((captured) =>
    captured.subject.toLowerCase().includes(subject.toLowerCase())
  );
}

/**
 * Get email count
 */
export function getEmailCount(): number {
  return capturedEmails.length;
}

/**
 * Mock email service to fail
 */
export function mockEmailServiceFailure(errorMessage: string = 'Email sending failed') {
  return {
    emails: {
      send: vi.fn(async () => {
        return {
          data: null,
          error: { message: errorMessage, statusCode: 500, name: 'api_error' },
        };
      }),
    },
  };
}

/**
 * Create a mock verification email HTML for testing extraction
 */
export function createMockVerificationEmailHtml(token: string, baseUrl: string = 'http://localhost:3000'): string {
  return `
    <html>
      <body>
        <h1>Verify Your Email</h1>
        <p>Click the link below to verify your email:</p>
        <a href="${baseUrl}/api/auth/verify-email?token=${token}">Verify Email</a>
      </body>
    </html>
  `;
}

/**
 * Create a mock password reset email HTML for testing extraction
 */
export function createMockResetPasswordEmailHtml(token: string, baseUrl: string = 'http://localhost:3000'): string {
  return `
    <html>
      <body>
        <h1>Reset Your Password</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${baseUrl}/reset-password?token=${token}">Reset Password</a>
      </body>
    </html>
  `;
}

