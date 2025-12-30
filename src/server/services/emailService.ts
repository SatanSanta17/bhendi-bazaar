/**
 * Server-side Email Service
 *
 * Handles all email-related operations including:
 * - Sending verification emails
 * - Verifying email tokens
 * - Managing verification tokens in database
 */

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Resend } from "resend";
interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private resend: Resend | null = null;

  constructor() {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    } else {
      console.warn(
        "⚠️  RESEND_API_KEY not configured. Email sending will fail in production."
      );
    }
  }

  /**
   * Send email using configured email provider
   * In production, use Resend, SendGrid, or AWS SES
   */
  private async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.resend) {
      throw new Error("Resend not initialized");
    }
    // Send via Resend
    try {
      const { data, error } = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || "Bhendi Bazaar <onboarding@resend.dev>",
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        console.error("❌ Resend API error:", error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.log(
        `✅ Email sent successfully to ${options.to} (ID: ${data?.id})`
      );
    } catch (error) {
      console.error("❌ Failed to send email:", error);
      throw error;
    }
  }

  /**
   * Send verification email to user
   */
  async sendVerificationEmail(userId: string, email: string): Promise<void> {
    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in database
    await prisma.verificationToken.create({
      data: {
        identifier: userId,
        token,
        expires,
      },
    });

    // Create verification URL
    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;

    // Send email
    await this.sendEmail({
      to: email,
      subject: "Verify your email - Bhendi Bazaar",
      html: this.getVerificationEmailTemplate(verificationUrl),
    });
  }

  /**
   * Verify email using token
   */
  async verifyEmail(
    token: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find the verification token
      const verificationToken = await prisma.verificationToken.findUnique({
        where: { token },
      });

      if (!verificationToken) {
        return { success: false, error: "Invalid verification token" };
      }

      // Check if token has expired
      if (verificationToken.expires < new Date()) {
        // Delete expired token (use deleteMany to handle concurrent requests)
        await prisma.verificationToken.deleteMany({
          where: { token },
        });
        return { success: false, error: "Verification token has expired" };
      }

      // Update user's email verification status
      await prisma.user.update({
        where: { id: verificationToken.identifier },
        data: {
          isEmailVerified: true,
          emailVerified: new Date(), // For NextAuth compatibility
        },
      });

      // Delete the used token (use deleteMany to handle concurrent requests)
      await prisma.verificationToken.deleteMany({
        where: { token },
      });

      return { success: true };
    } catch (error) {
      console.error("Email verification error:", error);
      return { success: false, error: "Failed to verify email" };
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(userId: string): Promise<void> {
    // Get user's email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, isEmailVerified: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.isEmailVerified) {
      throw new Error("Email already verified");
    }

    if (!user.email) {
      throw new Error("No email associated with this account");
    }

    // Delete any existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: userId },
    });

    // Send new verification email
    await this.sendVerificationEmail(userId, user.email);
  }

  /**
   * Get verification status for a user
   */
  async getVerificationStatus(userId: string): Promise<{
    isVerified: boolean;
    email: string | null;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isEmailVerified: true, email: true },
    });

    return {
      isVerified: user?.isEmailVerified ?? false,
      email: user?.email ?? null,
    };
  }

  /**
   * Email template for verification
   */
  private getVerificationEmailTemplate(verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - Bhendi Bazaar</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              background: #f8f8f8;
              padding: 20px;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            }
            .header {
              background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
              padding: 40px 30px;
              text-align: center;
              border-bottom: 4px solid #d4af37;
            }
            .logo {
              margin: 0;
              font-size: 32px;
              font-weight: 700;
              color: #ffffff;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .tagline {
              color: #d4af37;
              font-size: 13px;
              margin-top: 8px;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 24px;
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              color: #4a4a4a;
              margin-bottom: 15px;
              line-height: 1.7;
            }
            .cta-container {
              text-align: center;
              margin: 35px 0;
            }
            .button { 
              display: inline-block;
              padding: 16px 40px;
              background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              letter-spacing: 0.5px;
              transition: transform 0.2s;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              border: 2px solid #d4af37;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
            }
            .divider {
              margin: 30px 0;
              border: 0;
              border-top: 1px solid #e5e5e5;
            }
            .alternate-link {
              background: #f8f8f8;
              padding: 20px;
              border-radius: 8px;
              border: 1px dashed #d4af37;
              margin: 25px 0;
            }
            .alternate-link p {
              font-size: 13px;
              color: #666;
              margin-bottom: 8px;
            }
            .link-text {
              word-break: break-all;
              color: #1a1a1a;
              font-size: 12px;
              font-family: monospace;
              background: #ffffff;
              padding: 10px;
              border-radius: 4px;
              border: 1px solid #e5e5e5;
            }
            .expiry-notice {
              background: #fff9e6;
              border-left: 4px solid #d4af37;
              padding: 15px;
              margin: 25px 0;
              border-radius: 4px;
            }
            .expiry-notice p {
              font-size: 14px;
              color: #8b7123;
              margin: 0;
            }
            .expiry-icon {
              display: inline-block;
              margin-right: 8px;
            }
            .footer {
              background: #f8f8f8;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e5e5e5;
            }
            .footer p {
              color: #666;
              font-size: 13px;
              margin-bottom: 8px;
            }
            .social-links {
              margin: 20px 0;
            }
            .social-link {
              display: inline-block;
              margin: 0 8px;
              color: #666;
              text-decoration: none;
              font-size: 12px;
            }
            .copyright {
              color: #999;
              font-size: 12px;
              margin-top: 15px;
            }
            .accent-bar {
              height: 4px;
              background: linear-gradient(90deg, #d4af37 0%, #f4d775 50%, #d4af37 100%);
            }
            @media only screen and (max-width: 600px) {
              .email-wrapper {
                border-radius: 0;
              }
              .header, .content, .footer {
                padding: 25px 20px;
              }
              .logo {
                font-size: 26px;
              }
              .greeting {
                font-size: 20px;
              }
              .button {
                padding: 14px 30px;
                font-size: 15px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="accent-bar"></div>
            
            <div class="header">
              <h1 class="logo">Bhendi Bazaar</h1>
              <p class="tagline">Royal Curation of Islamic Clothing</p>
            </div>
            
            <div class="content">
              <h2 class="greeting">Welcome to Bhendi Bazaar! 👋</h2>
              
              <p class="message">
                Thank you for joining our community. We're excited to have you here!
              </p>
              
              <p class="message">
                To complete your registration and start shopping our exclusive collection of Islamic clothing and boutique wear, please verify your email address.
              </p>
              
              <div class="cta-container">
                <a href="${verificationUrl}" class="button">
                  ✓ Verify My Email
                </a>
              </div>
              
              <div class="expiry-notice">
                <p>
                  <span class="expiry-icon">⏰</span>
                  <strong>Important:</strong> This verification link will expire in 24 hours for security reasons.
                </p>
              </div>
              
              <hr class="divider">
              
              <div class="alternate-link">
                <p><strong>Can't click the button?</strong> Copy and paste this link into your browser:</p>
                <div class="link-text">${verificationUrl}</div>
              </div>
              
              <p class="message" style="margin-top: 30px; font-size: 14px; color: #666;">
                If you didn't create an account with Bhendi Bazaar, you can safely ignore this email.
              </p>
            </div>
            
            <div class="footer">
              <p style="font-weight: 600; color: #1a1a1a;">Need Help?</p>
              <p>Our support team is here to assist you.</p>
              
              <div class="social-links">
                <a href="#" class="social-link">Contact Us</a> •
                <a href="#" class="social-link">Privacy Policy</a> •
                <a href="#" class="social-link">Terms of Service</a>
              </div>
              
              <p class="copyright">
                &copy; ${new Date().getFullYear()} Bhendi Bazaar. All rights reserved.
              </p>
            </div>
            
            <div class="accent-bar"></div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName: string
  ): Promise<void> {
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

    await this.sendEmail({
      to: email,
      subject: "Reset your password - Bhendi Bazaar",
      html: this.getPasswordResetEmailTemplate(resetUrl, userName),
    });
  }

  /**
   * Password reset email template
   */
  private getPasswordResetEmailTemplate(
    resetUrl: string,
    userName: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - Bhendi Bazaar</title>
          <!-- Use same styles as verification email -->
        </head>
        <body>
          <div class="email-wrapper">
            <div class="accent-bar"></div>
            
            <div class="header">
              <h1 class="logo">Bhendi Bazaar</h1>
              <p class="tagline">Password Reset Request</p>
            </div>
            
            <div class="content">
              <h2 class="greeting">Hello ${userName}! 🔐</h2>
              
              <p class="message">
                We received a request to reset your password for your Bhendi Bazaar account.
              </p>
              
              <p class="message">
                Click the button below to create a new password:
              </p>
              
              <div class="cta-container">
                <a href="${resetUrl}" class="button">
                  Reset My Password
                </a>
              </div>
              
              <div class="expiry-notice">
                <p>
                  <span class="expiry-icon">⏰</span>
                  <strong>Important:</strong> This link will expire in 1 hour for security reasons.
                </p>
              </div>
              
              <hr class="divider">
              
              <div class="alternate-link">
                <p><strong>Can't click the button?</strong> Copy and paste this link into your browser:</p>
                <div class="link-text">${resetUrl}</div>
              </div>
              
              <p class="message" style="margin-top: 30px; font-size: 14px; color: #666;">
                <strong>Didn't request this?</strong> You can safely ignore this email. Your password will not be changed.
              </p>
            </div>
            
            <div class="footer">
              <p style="font-weight: 600; color: #1a1a1a;">Need Help?</p>
              <p>Contact our support team if you didn't request this reset.</p>
              
              <p class="copyright">
                &copy; ${new Date().getFullYear()} Bhendi Bazaar. All rights reserved.
              </p>
            </div>
            
            <div class="accent-bar"></div>
          </div>
        </body>
      </html>
    `;
  }
}
export const emailService = new EmailService();
