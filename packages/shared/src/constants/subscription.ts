export const SubscriptionTier = {
  FREE: 'FREE',
  PRO: 'PRO',
  FAMILY: 'FAMILY',
  DEALER: 'DEALER',
} as const;

export type SubscriptionTierType = (typeof SubscriptionTier)[keyof typeof SubscriptionTier];

export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  CANCELED: 'CANCELED',
  TRIALING: 'TRIALING',
} as const;

export type SubscriptionStatusType = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const SubscriptionPricing = {
  [SubscriptionTier.FREE]: {
    monthlyPrice: 0,
    yearlyPrice: 0,
    name: 'Free',
    description: 'Get started with basic vehicle research',
  },
  [SubscriptionTier.PRO]: {
    monthlyPrice: 999, // $9.99 in cents
    yearlyPrice: 9990, // $99.90 in cents (2 months free)
    name: 'Pro',
    description: 'Unlimited access for individual users',
  },
  [SubscriptionTier.FAMILY]: {
    monthlyPrice: 1999, // $19.99 in cents
    yearlyPrice: 19990, // $199.90 in cents
    name: 'Family',
    description: 'Share with up to 5 family members',
  },
  [SubscriptionTier.DEALER]: {
    monthlyPrice: 9999, // $99.99 in cents
    yearlyPrice: 99990, // $999.90 in cents
    name: 'Dealer',
    description: 'Unlimited everything for businesses',
  },
} as const;

export const SubscriptionFeatures = {
  [SubscriptionTier.FREE]: {
    vinLookups: 5,
    chatMessages: 20,
    imageAnalyses: 3,
    vehicleSlots: 1,
    shopSearchResults: 10,
    chatHistoryDays: 30,
    hasAds: true,
    hasRepairGuides: false,
    hasMaintenanceReminders: false,
    hasPrioritySupport: false,
    hasApiAccess: false,
    hasBulkVinDecode: false,
    hasWhiteLabelReports: false,
    familyMembers: 0,
  },
  [SubscriptionTier.PRO]: {
    vinLookups: -1, // Unlimited
    chatMessages: 200,
    imageAnalyses: 30,
    vehicleSlots: 3,
    shopSearchResults: -1, // Unlimited
    chatHistoryDays: 90,
    hasAds: false,
    hasRepairGuides: true,
    hasMaintenanceReminders: true,
    hasPrioritySupport: false,
    hasApiAccess: false,
    hasBulkVinDecode: false,
    hasWhiteLabelReports: false,
    familyMembers: 0,
  },
  [SubscriptionTier.FAMILY]: {
    vinLookups: -1,
    chatMessages: 500,
    imageAnalyses: 100,
    vehicleSlots: 10,
    shopSearchResults: -1,
    chatHistoryDays: 365,
    hasAds: false,
    hasRepairGuides: true,
    hasMaintenanceReminders: true,
    hasPrioritySupport: true,
    hasApiAccess: false,
    hasBulkVinDecode: false,
    hasWhiteLabelReports: false,
    familyMembers: 5,
  },
  [SubscriptionTier.DEALER]: {
    vinLookups: -1,
    chatMessages: -1,
    imageAnalyses: -1,
    vehicleSlots: -1,
    shopSearchResults: -1,
    chatHistoryDays: -1, // Forever
    hasAds: false,
    hasRepairGuides: true,
    hasMaintenanceReminders: true,
    hasPrioritySupport: true,
    hasApiAccess: true,
    hasBulkVinDecode: true,
    hasWhiteLabelReports: true,
    familyMembers: -1,
  },
} as const;
