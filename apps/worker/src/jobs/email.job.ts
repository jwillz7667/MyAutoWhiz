import { Job, Worker } from 'bullmq';
import { Resend } from 'resend';

import { QUEUE_NAMES } from '../queues';
import { createRedisConnection } from '../lib/redis';
import logger from '../lib/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email job data types
export interface WelcomeEmailData {
  type: 'welcome';
  email: string;
  name: string;
}

export interface PasswordResetEmailData {
  type: 'password-reset';
  email: string;
  name: string;
  resetToken: string;
}

export interface EmailVerificationData {
  type: 'email-verification';
  email: string;
  name: string;
  verificationToken: string;
}

export interface RecallAlertEmailData {
  type: 'recall-alert';
  email: string;
  name: string;
  vehicleInfo: string;
  recallCount: number;
  recallSummaries: string[];
}

export interface SubscriptionEmailData {
  type: 'subscription-created' | 'subscription-cancelled' | 'subscription-renewed';
  email: string;
  name: string;
  tier: string;
  expiresAt?: string;
}

export type EmailJobData =
  | WelcomeEmailData
  | PasswordResetEmailData
  | EmailVerificationData
  | RecallAlertEmailData
  | SubscriptionEmailData;

const fromEmail = process.env.EMAIL_FROM || 'MyAutoWhiz <noreply@myautowhiz.com>';
const appUrl = process.env.APP_URL || 'http://localhost:3000';

async function processEmailJob(job: Job<EmailJobData>): Promise<{ success: boolean; messageId?: string }> {
  const { data } = job;

  logger.info(`Processing email job`, { jobId: job.id, type: data.type, email: data.email });

  let subject: string;
  let html: string;

  switch (data.type) {
    case 'welcome':
      subject = 'Welcome to MyAutoWhiz!';
      html = `
        <h1>Welcome to MyAutoWhiz, ${data.name}!</h1>
        <p>Thank you for joining MyAutoWhiz, your AI-powered vehicle intelligence platform.</p>
        <p>With MyAutoWhiz, you can:</p>
        <ul>
          <li>Decode VINs and get detailed vehicle information</li>
          <li>Check for recalls and safety ratings</li>
          <li>Get AI-powered diagnostic assistance</li>
          <li>Find trusted repair shops near you</li>
        </ul>
        <p><a href="${appUrl}/dashboard">Get started now</a></p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The MyAutoWhiz Team</p>
      `;
      break;

    case 'password-reset':
      const resetUrl = `${appUrl}/reset-password?token=${data.resetToken}`;
      subject = 'Reset Your MyAutoWhiz Password';
      html = `
        <h1>Password Reset Request</h1>
        <p>Hi ${data.name},</p>
        <p>We received a request to reset your MyAutoWhiz password.</p>
        <p>Click the button below to reset your password:</p>
        <p><a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        <p>Best regards,<br>The MyAutoWhiz Team</p>
      `;
      break;

    case 'email-verification':
      const verifyUrl = `${appUrl}/verify-email?token=${data.verificationToken}`;
      subject = 'Verify Your MyAutoWhiz Email';
      html = `
        <h1>Verify Your Email</h1>
        <p>Hi ${data.name},</p>
        <p>Please verify your email address to complete your MyAutoWhiz registration.</p>
        <p><a href="${verifyUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create a MyAutoWhiz account, please ignore this email.</p>
        <p>Best regards,<br>The MyAutoWhiz Team</p>
      `;
      break;

    case 'recall-alert':
      subject = `Recall Alert: ${data.recallCount} new recall(s) for your ${data.vehicleInfo}`;
      html = `
        <h1>Recall Alert</h1>
        <p>Hi ${data.name},</p>
        <p>We found <strong>${data.recallCount} new recall(s)</strong> for your ${data.vehicleInfo}.</p>
        <h2>Recall Summary:</h2>
        <ul>
          ${data.recallSummaries.map(summary => `<li>${summary}</li>`).join('')}
        </ul>
        <p><a href="${appUrl}/dashboard/garage" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Full Details</a></p>
        <p>We recommend contacting an authorized dealer to address these recalls.</p>
        <p>Best regards,<br>The MyAutoWhiz Team</p>
      `;
      break;

    case 'subscription-created':
      subject = 'Welcome to MyAutoWhiz Pro!';
      html = `
        <h1>Your Subscription is Active!</h1>
        <p>Hi ${data.name},</p>
        <p>Thank you for subscribing to MyAutoWhiz <strong>${data.tier}</strong>!</p>
        <p>You now have access to all premium features including:</p>
        <ul>
          <li>Unlimited AI conversations</li>
          <li>Priority support</li>
          <li>Advanced diagnostic tools</li>
          <li>Recall monitoring for all your vehicles</li>
        </ul>
        <p><a href="${appUrl}/dashboard">Go to Dashboard</a></p>
        <p>Best regards,<br>The MyAutoWhiz Team</p>
      `;
      break;

    case 'subscription-cancelled':
      subject = 'Your MyAutoWhiz Subscription Has Been Cancelled';
      html = `
        <h1>Subscription Cancelled</h1>
        <p>Hi ${data.name},</p>
        <p>Your MyAutoWhiz ${data.tier} subscription has been cancelled.</p>
        ${data.expiresAt ? `<p>You will continue to have access until <strong>${data.expiresAt}</strong>.</p>` : ''}
        <p>We're sorry to see you go! If you change your mind, you can resubscribe anytime.</p>
        <p><a href="${appUrl}/subscription">Resubscribe</a></p>
        <p>Best regards,<br>The MyAutoWhiz Team</p>
      `;
      break;

    case 'subscription-renewed':
      subject = 'Your MyAutoWhiz Subscription Has Been Renewed';
      html = `
        <h1>Subscription Renewed!</h1>
        <p>Hi ${data.name},</p>
        <p>Your MyAutoWhiz ${data.tier} subscription has been renewed successfully.</p>
        <p>Thank you for continuing to use MyAutoWhiz!</p>
        <p><a href="${appUrl}/dashboard">Go to Dashboard</a></p>
        <p>Best regards,<br>The MyAutoWhiz Team</p>
      `;
      break;

    default:
      throw new Error(`Unknown email type: ${(data as any).type}`);
  }

  const result = await resend.emails.send({
    from: fromEmail,
    to: data.email,
    subject,
    html,
  });

  if (result.error) {
    logger.error('Failed to send email', { error: result.error, jobId: job.id });
    throw new Error(result.error.message);
  }

  logger.info('Email sent successfully', { jobId: job.id, messageId: result.data?.id });

  return { success: true, messageId: result.data?.id };
}

export function createEmailWorker(): Worker<EmailJobData> {
  const worker = new Worker(QUEUE_NAMES.EMAIL, processEmailJob, {
    connection: createRedisConnection(),
    concurrency: 5,
    limiter: {
      max: 100,
      duration: 60000, // 100 emails per minute
    },
  });

  worker.on('completed', (job) => {
    logger.info(`Email job completed`, { jobId: job.id, type: job.data.type });
  });

  worker.on('failed', (job, err) => {
    logger.error(`Email job failed`, { jobId: job?.id, error: err.message });
  });

  return worker;
}
