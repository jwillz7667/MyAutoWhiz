import type { Request, Response, NextFunction } from 'express';

import {
  SubscriptionTier,
  RateLimits,
  UsageLimits,
  type SubscriptionTierType,
} from '@myautowhiz/shared';

import { prisma } from '../lib/prisma';
import { incrementRateLimit } from '../lib/redis';
import { RateLimitedError, UsageLimitExceededError } from '../utils/errors';
import { logger } from '../utils/logger';
import { setRateLimitHeaders } from '../utils/response';

// Get rate limit for tier
function getApiRateLimit(tier: SubscriptionTierType): number {
  return RateLimits.apiRequestsPerMinute[tier] || 100;
}

// Global rate limiting middleware - for all API requests
export const globalRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const limit = 1000; // 1000 requests per minute globally
  const windowSeconds = 60;
  const identifier = req.ip || 'unknown';
  const key = `ratelimit:global:${identifier}`;

  incrementRateLimit(key, windowSeconds)
    .then(({ count, ttl }) => {
      if (count > limit) {
        throw RateLimitedError(ttl);
      }
      next();
    })
    .catch(next);
};

// API rate limiting middleware
export function apiRateLimit(req: Request, res: Response, next: NextFunction): void {
  const tier = req.user?.subscriptionTier || SubscriptionTier.FREE;
  const limit = getApiRateLimit(tier);
  const windowSeconds = 60; // 1 minute

  // Use user ID or IP for rate limiting
  const identifier = req.user?.id || req.ip || 'unknown';
  const key = `ratelimit:api:${identifier}`;

  incrementRateLimit(key, windowSeconds)
    .then(({ count, ttl }) => {
      const remaining = Math.max(0, limit - count);
      const resetTime = new Date(Date.now() + ttl * 1000);

      setRateLimitHeaders(res, limit, remaining, resetTime);

      if (count > limit) {
        throw RateLimitedError(ttl);
      }

      next();
    })
    .catch(next);
}

// VIN lookup rate limiting
export async function checkVinLookupLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next();
    }

    const tier = req.user.subscriptionTier;
    const limit = UsageLimits.vinLookupsPerMonth[tier];

    // Unlimited
    if (limit === -1) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { monthlyVinLookups: true, lastUsageReset: true },
    });

    if (!user) {
      return next();
    }

    // Check if we need to reset monthly counter
    const now = new Date();
    const lastReset = new Date(user.lastUsageReset);
    const shouldReset =
      now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();

    if (shouldReset) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { monthlyVinLookups: 0, lastUsageReset: now },
      });
      return next();
    }

    if (user.monthlyVinLookups >= limit) {
      throw UsageLimitExceededError('VIN lookup', limit, user.monthlyVinLookups);
    }

    next();
  } catch (error) {
    next(error);
  }
}

// Increment VIN lookup counter
export async function incrementVinLookupCount(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { monthlyVinLookups: { increment: 1 } },
    });
  } catch (error) {
    logger.error('Failed to increment VIN lookup count', { userId, error });
  }
}

// Chat message rate limiting
export async function checkChatMessageLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next();
    }

    const tier = req.user.subscriptionTier;
    const limit = UsageLimits.chatMessagesPerDay[tier];

    // Unlimited
    if (limit === -1) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { dailyChatMessages: true, lastDailyReset: true },
    });

    if (!user) {
      return next();
    }

    // Check if we need to reset daily counter
    const now = new Date();
    const lastReset = new Date(user.lastDailyReset);
    const shouldReset = now.toDateString() !== lastReset.toDateString();

    if (shouldReset) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { dailyChatMessages: 0, lastDailyReset: now },
      });
      return next();
    }

    if (user.dailyChatMessages >= limit) {
      throw UsageLimitExceededError('chat message', limit, user.dailyChatMessages);
    }

    next();
  } catch (error) {
    next(error);
  }
}

// Increment chat message counter
export async function incrementChatMessageCount(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { dailyChatMessages: { increment: 1 } },
    });
  } catch (error) {
    logger.error('Failed to increment chat message count', { userId, error });
  }
}

// Image analysis rate limiting
export async function checkImageAnalysisLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next();
    }

    const tier = req.user.subscriptionTier;
    const limit = UsageLimits.imageAnalysesPerMonth[tier];

    // Unlimited
    if (limit === -1) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { monthlyImageAnalyses: true, lastUsageReset: true },
    });

    if (!user) {
      return next();
    }

    // Check if we need to reset monthly counter
    const now = new Date();
    const lastReset = new Date(user.lastUsageReset);
    const shouldReset =
      now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();

    if (shouldReset) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { monthlyImageAnalyses: 0, lastUsageReset: now },
      });
      return next();
    }

    if (user.monthlyImageAnalyses >= limit) {
      throw UsageLimitExceededError('image analysis', limit, user.monthlyImageAnalyses);
    }

    next();
  } catch (error) {
    next(error);
  }
}

// Increment image analysis counter
export async function incrementImageAnalysisCount(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { monthlyImageAnalyses: { increment: 1 } },
    });
  } catch (error) {
    logger.error('Failed to increment image analysis count', { userId, error });
  }
}
