import { v4 as uuidv4 } from 'uuid';

import type { AuthTokens, LoginResponse, User } from '@myautowhiz/shared';

import { prisma } from '../lib/prisma';
import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  UnauthorizedError,
  UserNotFoundError,
  ValidationError,
} from '../utils/errors';
import {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenExpiresIn,
  getRefreshTokenExpiresAt,
  verifyRefreshToken,
} from '../utils/jwt';
import { logger } from '../utils/logger';
import { hashPassword, comparePassword, isStrongPassword } from '../utils/password';

import { emailService } from './email.service';

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginInput {
  email: string;
  password: string;
  deviceInfo?: string;
  ipAddress?: string;
}

export interface OAuthInput {
  provider: string;
  providerId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  deviceInfo?: string;
  ipAddress?: string;
}

class AuthService {
  async register(input: RegisterInput): Promise<LoginResponse> {
    const { email, password, fullName } = input;

    // Check password strength
    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      throw ValidationError(passwordCheck.errors.join('. '));
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw EmailAlreadyExistsError();
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate email verification token
    const emailVerificationToken = uuidv4();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        emailVerificationToken,
        emailVerificationExpires,
      },
    });

    // Send verification email
    await emailService.sendVerificationEmail(user.email, emailVerificationToken, fullName);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    logger.info('User registered', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        subscriptionTier: user.subscriptionTier,
        emailVerified: user.emailVerified,
      },
      tokens,
    };
  }

  async login(input: LoginInput): Promise<LoginResponse> {
    const { email, password, deviceInfo, ipAddress } = input;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || user.deletedAt) {
      throw InvalidCredentialsError();
    }

    // Check password
    if (!user.passwordHash) {
      throw InvalidCredentialsError();
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw InvalidCredentialsError();
    }

    // Generate tokens
    const tokens = await this.generateTokens(user, deviceInfo, ipAddress);

    logger.info('User logged in', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        subscriptionTier: user.subscriptionTier,
        emailVerified: user.emailVerified,
      },
      tokens,
    };
  }

  async oauthLogin(input: OAuthInput): Promise<LoginResponse> {
    const { provider, providerId, email, fullName, avatarUrl, deviceInfo, ipAddress } = input;

    // Find existing user by OAuth provider
    let user = await prisma.user.findFirst({
      where: {
        oauthProvider: provider,
        oauthProviderId: providerId,
      },
    });

    if (!user) {
      // Check if email exists
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (user) {
        // Link OAuth to existing account
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            oauthProvider: provider,
            oauthProviderId: providerId,
            avatarUrl: avatarUrl || user.avatarUrl,
            emailVerified: true, // OAuth emails are verified
          },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            fullName,
            avatarUrl,
            oauthProvider: provider,
            oauthProviderId: providerId,
            emailVerified: true,
          },
        });

        logger.info('New OAuth user registered', { userId: user.id, provider });
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user, deviceInfo, ipAddress);

    logger.info('OAuth login', { userId: user.id, provider });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        subscriptionTier: user.subscriptionTier,
        emailVerified: user.emailVerified,
      },
      tokens,
    };
  }

  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string; expiresIn: number }> {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw UnauthorizedError('Invalid or expired refresh token');
    }

    if (storedToken.user.deletedAt) {
      throw UnauthorizedError('Account has been deleted');
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      subscriptionTier: storedToken.user.subscriptionTier,
      emailVerified: storedToken.user.emailVerified,
    });

    return {
      accessToken,
      expiresIn: getAccessTokenExpiresIn(),
    };
  }

  async logout(userId: string, refreshToken?: string, allDevices = false): Promise<void> {
    if (allDevices) {
      // Revoke all refresh tokens
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
      logger.info('All sessions logged out', { userId });
    } else if (refreshToken) {
      // Revoke specific token
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw ValidationError('Invalid or expired verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    logger.info('Email verified', { userId: user.id });
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || user.emailVerified) {
      // Don't reveal if email exists
      return;
    }

    const emailVerificationToken = uuidv4();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpires,
      },
    });

    await emailService.sendVerificationEmail(
      user.email,
      emailVerificationToken,
      user.fullName || undefined
    );
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      // Don't reveal if email exists (could be OAuth user)
      return;
    }

    const passwordResetToken = uuidv4();
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpires,
      },
    });

    await emailService.sendPasswordResetEmail(
      user.email,
      passwordResetToken,
      user.fullName || undefined
    );

    logger.info('Password reset requested', { userId: user.id });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Check password strength
    const passwordCheck = isStrongPassword(newPassword);
    if (!passwordCheck.valid) {
      throw ValidationError(passwordCheck.errors.join('. '));
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw ValidationError('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      }),
      // Revoke all refresh tokens (force re-login)
      prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    await emailService.sendPasswordChangedEmail(user.email, user.fullName || undefined);

    logger.info('Password reset completed', { userId: user.id });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw UserNotFoundError();
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw ValidationError('Current password is incorrect');
    }

    const passwordCheck = isStrongPassword(newPassword);
    if (!passwordCheck.valid) {
      throw ValidationError(passwordCheck.errors.join('. '));
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await emailService.sendPasswordChangedEmail(user.email, user.fullName || undefined);

    logger.info('Password changed', { userId });
  }

  async getOAuthRedirectUrl(provider: string): Promise<string> {
    const state = uuidv4();

    // Store state in Redis or session for CSRF protection
    // For now, just generate the redirect URL

    if (provider === 'google') {
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        redirect_uri: `${process.env.API_URL}/api/v1/auth/oauth/google/callback`,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        access_type: 'offline',
        prompt: 'consent',
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    } else if (provider === 'apple') {
      const params = new URLSearchParams({
        client_id: process.env.APPLE_CLIENT_ID || '',
        redirect_uri: `${process.env.API_URL}/api/v1/auth/oauth/apple/callback`,
        response_type: 'code',
        scope: 'name email',
        state,
        response_mode: 'form_post',
      });
      return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
    }

    throw ValidationError('Unsupported OAuth provider');
  }

  async handleOAuthCallback(
    provider: string,
    code: string,
    _state: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Exchange code for tokens and get user info
    let email: string;
    let fullName: string | undefined;
    let providerId: string;
    let avatarUrl: string | undefined;

    if (provider === 'google') {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: `${process.env.API_URL}/api/v1/auth/oauth/google/callback`,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json() as { access_token: string };

      // Get user info
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const userData = await userResponse.json() as {
        id: string;
        email: string;
        name?: string;
        picture?: string
      };

      email = userData.email;
      fullName = userData.name;
      providerId = userData.id;
      avatarUrl = userData.picture;
    } else if (provider === 'apple') {
      // Apple Sign In implementation
      // Note: Apple returns user info only on first sign in
      throw ValidationError('Apple Sign In callback handling not fully implemented');
    } else {
      throw ValidationError('Unsupported OAuth provider');
    }

    // Use the existing oauthLogin method
    const result = await this.oauthLogin({
      provider,
      providerId,
      email,
      fullName,
      avatarUrl,
    });

    return {
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    };
  }

  async getCurrentUser(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
        emailVerified: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw UserNotFoundError();
    }

    return user as unknown as User;
  }

  private async generateTokens(
    user: { id: string; email: string; subscriptionTier: string; emailVerified: boolean },
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<AuthTokens> {
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier as AuthTokens['accessToken'] extends string
        ? never
        : never,
      emailVerified: user.emailVerified,
    });

    const { token: refreshToken, tokenId } = generateRefreshToken(user.id);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        deviceInfo,
        ipAddress,
        expiresAt: getRefreshTokenExpiresAt(),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: getAccessTokenExpiresIn(),
    };
  }
}

export const authService = new AuthService();
