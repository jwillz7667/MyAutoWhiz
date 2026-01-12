import { Resend } from 'resend';

import { logger } from '../utils/logger';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'MyAutoWhiz <noreply@myautowhiz.com>';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

class EmailService {
  async sendVerificationEmail(
    email: string,
    token: string,
    name?: string
  ): Promise<void> {
    const verifyUrl = `${WEB_URL}/verify-email?token=${token}`;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Verify your MyAutoWhiz account',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">MyAutoWhiz</h1>
            </div>

            <h2>Welcome${name ? `, ${name}` : ''}!</h2>

            <p>Thanks for signing up for MyAutoWhiz. Please verify your email address to get started.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Verify Email Address
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">
              This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              MyAutoWhiz - AI-Powered Vehicle Intelligence<br>
              <a href="${WEB_URL}" style="color: #2563eb;">myautowhiz.com</a>
            </p>
          </body>
          </html>
        `,
      });

      logger.info('Verification email sent', { email });
    } catch (error) {
      logger.error('Failed to send verification email', { email, error });
      // Don't throw - email failure shouldn't block registration
    }
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    name?: string
  ): Promise<void> {
    const resetUrl = `${WEB_URL}/reset-password?token=${token}`;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Reset your MyAutoWhiz password',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">MyAutoWhiz</h1>
            </div>

            <h2>Password Reset Request</h2>

            <p>Hi${name ? ` ${name}` : ''},</p>

            <p>We received a request to reset your password. Click the button below to create a new password.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Reset Password
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              MyAutoWhiz - AI-Powered Vehicle Intelligence<br>
              <a href="${WEB_URL}" style="color: #2563eb;">myautowhiz.com</a>
            </p>
          </body>
          </html>
        `,
      });

      logger.info('Password reset email sent', { email });
    } catch (error) {
      logger.error('Failed to send password reset email', { email, error });
    }
  }

  async sendPasswordChangedEmail(email: string, name?: string): Promise<void> {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Your MyAutoWhiz password was changed',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">MyAutoWhiz</h1>
            </div>

            <h2>Password Changed</h2>

            <p>Hi${name ? ` ${name}` : ''},</p>

            <p>Your MyAutoWhiz password was successfully changed.</p>

            <p style="color: #666;">If you didn't make this change, please contact us immediately at support@myautowhiz.com.</p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              MyAutoWhiz - AI-Powered Vehicle Intelligence<br>
              <a href="${WEB_URL}" style="color: #2563eb;">myautowhiz.com</a>
            </p>
          </body>
          </html>
        `,
      });

      logger.info('Password changed email sent', { email });
    } catch (error) {
      logger.error('Failed to send password changed email', { email, error });
    }
  }

  async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Welcome to MyAutoWhiz!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">MyAutoWhiz</h1>
            </div>

            <h2>Welcome to MyAutoWhiz${name ? `, ${name}` : ''}!</h2>

            <p>Thanks for joining MyAutoWhiz! Here's what you can do:</p>

            <ul style="padding-left: 20px;">
              <li><strong>Decode VINs</strong> - Get detailed vehicle information instantly</li>
              <li><strong>AI Diagnostics</strong> - Describe problems and get expert guidance</li>
              <li><strong>Find Shops</strong> - Locate trusted repair shops near you</li>
              <li><strong>Track Maintenance</strong> - Keep your vehicle history organized</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${WEB_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Go to Dashboard
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              MyAutoWhiz - AI-Powered Vehicle Intelligence<br>
              <a href="${WEB_URL}" style="color: #2563eb;">myautowhiz.com</a>
            </p>
          </body>
          </html>
        `,
      });

      logger.info('Welcome email sent', { email });
    } catch (error) {
      logger.error('Failed to send welcome email', { email, error });
    }
  }

  async sendRecallAlert(
    email: string,
    vehicleInfo: string,
    recallCount: number,
    name?: string
  ): Promise<void> {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `Safety Recall Alert: ${vehicleInfo}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">MyAutoWhiz</h1>
            </div>

            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <h2 style="color: #dc2626; margin: 0 0 10px 0;">⚠️ Safety Recall Alert</h2>
              <p style="margin: 0;">We found <strong>${recallCount} active recall${recallCount > 1 ? 's' : ''}</strong> for your ${vehicleInfo}.</p>
            </div>

            <p>Hi${name ? ` ${name}` : ''},</p>

            <p>Your safety is important. Please review the recall information and contact your dealer to schedule repairs.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${WEB_URL}/garage" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                View Recall Details
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              MyAutoWhiz - AI-Powered Vehicle Intelligence<br>
              <a href="${WEB_URL}" style="color: #2563eb;">myautowhiz.com</a>
            </p>
          </body>
          </html>
        `,
      });

      logger.info('Recall alert email sent', { email, vehicleInfo, recallCount });
    } catch (error) {
      logger.error('Failed to send recall alert email', { email, error });
    }
  }
}

export const emailService = new EmailService();
