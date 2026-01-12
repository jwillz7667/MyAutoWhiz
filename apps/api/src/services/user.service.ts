import type { UserProfile, UserUsage, UserPreferences } from '@myautowhiz/shared';
import { SubscriptionFeatures } from '@myautowhiz/shared';

import { prisma, Prisma } from '../lib/prisma';
import { UserNotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { comparePassword, hashPassword } from '../utils/password';

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  preferences?: Partial<UserPreferences>;
}

class UserService {
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            vehicles: { where: { isActive: true } },
            chatSessions: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw UserNotFoundError();
    }

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndsAt: user.subscriptionEndsAt,
      trialEndsAt: user.trialEndsAt,
      preferences: (user.preferences as unknown) as UserPreferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      vehicleCount: user._count.vehicles,
      chatSessionCount: user._count.chatSessions,
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.deletedAt) {
      throw UserNotFoundError();
    }

    // Merge preferences
    let preferences = (user.preferences as unknown) as Record<string, unknown>;
    if (input.preferences) {
      preferences = { ...preferences, ...input.preferences };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: input.fullName,
        phone: input.phone,
        avatarUrl: input.avatarUrl,
        preferences: preferences as Prisma.JsonObject,
      },
      include: {
        _count: {
          select: {
            vehicles: { where: { isActive: true } },
            chatSessions: true,
          },
        },
      },
    });

    logger.info('Profile updated', { userId });

    return {
      id: updated.id,
      email: updated.email,
      emailVerified: updated.emailVerified,
      fullName: updated.fullName,
      avatarUrl: updated.avatarUrl,
      phone: updated.phone,
      subscriptionTier: updated.subscriptionTier,
      subscriptionStatus: updated.subscriptionStatus,
      subscriptionEndsAt: updated.subscriptionEndsAt,
      trialEndsAt: updated.trialEndsAt,
      preferences: (updated.preferences as unknown) as UserPreferences,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      vehicleCount: updated._count.vehicles,
      chatSessionCount: updated._count.chatSessions,
    };
  }

  async getUsage(userId: string): Promise<UserUsage> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        monthlyVinLookups: true,
        dailyChatMessages: true,
        monthlyImageAnalyses: true,
        lastUsageReset: true,
        lastDailyReset: true,
      },
    });

    if (!user) {
      throw UserNotFoundError();
    }

    const features = SubscriptionFeatures[user.subscriptionTier];
    const now = new Date();

    // Calculate reset dates
    const monthlyResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const dailyResetDate = new Date(now);
    dailyResetDate.setDate(dailyResetDate.getDate() + 1);
    dailyResetDate.setHours(0, 0, 0, 0);

    // Check if counters need reset
    const lastReset = new Date(user.lastUsageReset);
    const lastDailyReset = new Date(user.lastDailyReset);

    let monthlyVinLookups = user.monthlyVinLookups;
    let monthlyImageAnalyses = user.monthlyImageAnalyses;
    let dailyChatMessages = user.dailyChatMessages;

    // Reset monthly counters if new month
    if (
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    ) {
      monthlyVinLookups = 0;
      monthlyImageAnalyses = 0;
    }

    // Reset daily counter if new day
    if (now.toDateString() !== lastDailyReset.toDateString()) {
      dailyChatMessages = 0;
    }

    return {
      period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      vinLookups: {
        used: monthlyVinLookups,
        limit: features.vinLookups,
        unlimited: features.vinLookups === -1,
      },
      chatMessages: {
        used: dailyChatMessages,
        limit: features.chatMessages,
        unlimited: features.chatMessages === -1,
      },
      imageAnalyses: {
        used: monthlyImageAnalyses,
        limit: features.imageAnalyses,
        unlimited: features.imageAnalyses === -1,
      },
      resetsAt: monthlyResetDate,
    };
  }

  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.deletedAt) {
      throw UserNotFoundError();
    }

    // Verify password if set
    if (user.passwordHash) {
      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        throw ValidationError('Incorrect password');
      }
    }

    // Soft delete - actual deletion happens after 30 days via background job
    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    // Revoke all sessions
    await prisma.refreshToken.deleteMany({ where: { userId } });

    logger.info('Account scheduled for deletion', { userId });
  }

  async restoreAccount(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw UserNotFoundError();
    }

    if (!user.deletedAt) {
      return; // Account not deleted
    }

    // Check if within grace period (30 days)
    const gracePeriodEnd = new Date(user.deletedAt);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30);

    if (new Date() > gracePeriodEnd) {
      throw ValidationError('Account cannot be restored after 30 days');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
    });

    logger.info('Account restored', { userId });
  }

  async updatePreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!user) {
      throw UserNotFoundError();
    }

    const currentPreferences = user.preferences as Record<string, unknown>;
    const updatedPreferences = { ...currentPreferences, ...preferences };

    await prisma.user.update({
      where: { id: userId },
      data: { preferences: updatedPreferences },
    });

    return updatedPreferences as UserPreferences;
  }
}

export const userService = new UserService();
