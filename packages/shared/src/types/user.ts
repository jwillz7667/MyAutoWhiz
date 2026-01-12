import type { SubscriptionTierType, SubscriptionStatusType } from '../constants/subscription';

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  subscriptionTier: SubscriptionTierType;
  subscriptionStatus: SubscriptionStatusType;
  subscriptionEndsAt: Date | null;
  trialEndsAt: Date | null;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  notifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  measurementUnit: 'imperial' | 'metric';
  defaultVehicleId: string | null;
}

export interface UserUsage {
  period: string; // YYYY-MM format
  vinLookups: UsageCounter;
  chatMessages: UsageCounter;
  imageAnalyses: UsageCounter;
  resetsAt: Date;
}

export interface UsageCounter {
  used: number;
  limit: number;
  unlimited: boolean;
}

export interface UserProfile extends Omit<User, 'preferences'> {
  preferences: UserPreferences;
  vehicleCount: number;
  chatSessionCount: number;
}

export interface FamilyMember {
  id: string;
  memberId: string;
  memberEmail: string;
  memberName: string | null;
  role: 'owner' | 'member';
  invitedAt: Date;
  acceptedAt: Date | null;
}

export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  deviceInfo: string | null;
  expiresAt: Date;
  createdAt: Date;
}
