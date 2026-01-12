import { SubscriptionTier, SubscriptionFeatures } from './subscription';

export const RateLimits = {
  // API rate limits per minute by tier
  apiRequestsPerMinute: {
    [SubscriptionTier.FREE]: 100,
    [SubscriptionTier.PRO]: 500,
    [SubscriptionTier.FAMILY]: 500,
    [SubscriptionTier.DEALER]: 1000,
  },

  // Shop search per day
  shopSearchPerDay: {
    [SubscriptionTier.FREE]: 10,
    [SubscriptionTier.PRO]: 100,
    [SubscriptionTier.FAMILY]: 100,
    [SubscriptionTier.DEALER]: -1, // Unlimited
  },
} as const;

export const UsageLimits = {
  // VIN lookups per month
  vinLookupsPerMonth: {
    [SubscriptionTier.FREE]: 5,
    [SubscriptionTier.PRO]: -1, // Unlimited
    [SubscriptionTier.FAMILY]: -1,
    [SubscriptionTier.DEALER]: -1,
  },

  // Chat messages per day
  chatMessagesPerDay: {
    [SubscriptionTier.FREE]: 20,
    [SubscriptionTier.PRO]: 200,
    [SubscriptionTier.FAMILY]: 500,
    [SubscriptionTier.DEALER]: -1,
  },

  // Image analyses per month
  imageAnalysesPerMonth: {
    [SubscriptionTier.FREE]: 3,
    [SubscriptionTier.PRO]: 30,
    [SubscriptionTier.FAMILY]: 100,
    [SubscriptionTier.DEALER]: -1,
  },

  // Vehicles in garage
  vehiclesInGarage: {
    [SubscriptionTier.FREE]: 1,
    [SubscriptionTier.PRO]: 3,
    [SubscriptionTier.FAMILY]: 10,
    [SubscriptionTier.DEALER]: -1,
  },
} as const;

export const ContentLimits = {
  // Maximum message length
  maxChatMessageLength: 4000,

  // Maximum image size in bytes (10MB)
  maxImageSize: 10 * 1024 * 1024,

  // Supported image types
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],

  // Maximum images per message
  maxImagesPerMessage: 5,

  // Maximum symptoms per diagnostic session
  maxSymptomsPerSession: 10,

  // Maximum OBD codes per diagnostic session
  maxObdCodesPerSession: 20,

  // VIN length
  vinLength: 17,

  // Password requirements
  minPasswordLength: 8,
  maxPasswordLength: 128,
} as const;

export const CacheTTL = {
  // VIN decode cache (24 hours)
  vinDecode: 24 * 60 * 60,

  // Safety ratings cache (7 days)
  safetyRatings: 7 * 24 * 60 * 60,

  // Recalls cache (1 hour - important to keep fresh)
  recalls: 60 * 60,

  // Shop search cache (1 hour)
  shopSearch: 60 * 60,

  // User session cache (15 minutes)
  userSession: 15 * 60,

  // Rate limit window (1 minute)
  rateLimitWindow: 60,
} as const;

export const DataRetention = {
  // Chat history retention in days by tier
  chatHistoryDays: {
    [SubscriptionTier.FREE]: 30,
    [SubscriptionTier.PRO]: 90,
    [SubscriptionTier.FAMILY]: 365,
    [SubscriptionTier.DEALER]: -1, // Forever
  },

  // Diagnostic session retention (1 year for all)
  diagnosticSessionDays: 365,

  // API logs retention (30 days)
  apiLogDays: 30,

  // Subscription events retention (7 years for compliance)
  subscriptionEventYears: 7,

  // Soft delete grace period (30 days)
  softDeleteGraceDays: 30,
} as const;

export function getUsageLimit(
  tier: keyof typeof SubscriptionTier,
  limitType: keyof typeof UsageLimits
): number {
  return UsageLimits[limitType][tier as keyof (typeof UsageLimits)[typeof limitType]];
}

export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

export function hasFeature(
  tier: keyof typeof SubscriptionTier,
  feature: keyof (typeof SubscriptionFeatures)[typeof SubscriptionTier.FREE]
): boolean {
  const features = SubscriptionFeatures[tier];
  const value = features[feature as keyof typeof features];
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return false;
}
