import type { Request, Response, NextFunction } from 'express';

import { SubscriptionTier, type SubscriptionTierType } from '@myautowhiz/shared';

import { prisma } from '../lib/prisma';
import {
  UnauthorizedError,
  ForbiddenError,
  EmailNotVerifiedError,
  TierLimitError,
} from '../utils/errors';
import { verifyAccessToken, type AccessTokenPayload } from '../utils/jwt';
import { logger } from '../utils/logger';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  subscriptionTier: SubscriptionTierType;
  emailVerified: boolean;
}

// Extract token from Authorization header
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Main authentication middleware
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);
    if (!token) {
      throw UnauthorizedError('No authentication token provided');
    }

    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      email: payload.email,
      subscriptionTier: payload.subscriptionTier,
      emailVerified: payload.emailVerified,
    };

    next();
  } catch (error) {
    next(error);
  }
}

// Optional authentication - doesn't fail if no token
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);
    if (token) {
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.userId,
        email: payload.email,
        subscriptionTier: payload.subscriptionTier,
        emailVerified: payload.emailVerified,
      };
    }
    next();
  } catch (error) {
    // Silently continue without user on token errors
    logger.debug('Optional auth failed', { error });
    next();
  }
}

// Require email verification
export function requireEmailVerified(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(UnauthorizedError());
  }

  if (!req.user.emailVerified) {
    return next(EmailNotVerifiedError());
  }

  next();
}

// Require minimum subscription tier
export function requireTier(...allowedTiers: SubscriptionTierType[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(UnauthorizedError());
    }

    if (!allowedTiers.includes(req.user.subscriptionTier)) {
      const minimumTier = allowedTiers[0];
      return next(TierLimitError(minimumTier));
    }

    next();
  };
}

// Require at least Pro subscription
export const requirePro = requireTier(
  SubscriptionTier.PRO,
  SubscriptionTier.FAMILY,
  SubscriptionTier.DEALER
);

// Require at least Family subscription
export const requireFamily = requireTier(SubscriptionTier.FAMILY, SubscriptionTier.DEALER);

// Require Dealer subscription
export const requireDealer = requireTier(SubscriptionTier.DEALER);

// Refresh user data from database (for sensitive operations)
export async function refreshUserFromDb(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next(UnauthorizedError());
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        emailVerified: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      return next(UnauthorizedError('Account not found or deleted'));
    }

    if (user.subscriptionStatus === 'CANCELED') {
      return next(ForbiddenError('Subscription has been canceled'));
    }

    req.user = {
      id: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      emailVerified: user.emailVerified,
    };

    next();
  } catch (error) {
    next(error);
  }
}

// Check if user owns a resource
export function requireOwnership(
  getResourceUserId: (req: Request) => Promise<string | null>
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(UnauthorizedError());
      }

      const resourceUserId = await getResourceUserId(req);
      if (!resourceUserId) {
        return next(ForbiddenError('Resource not found'));
      }

      if (resourceUserId !== req.user.id) {
        // Check if user is a family member
        const familyMember = await prisma.familyMember.findFirst({
          where: {
            OR: [
              { memberId: req.user.id, ownerId: resourceUserId },
              { ownerId: req.user.id, memberId: resourceUserId },
            ],
            acceptedAt: { not: null },
          },
        });

        if (!familyMember) {
          return next(ForbiddenError('You do not have access to this resource'));
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
