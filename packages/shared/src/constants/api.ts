export const ApiVersion = 'v1';

export const ApiPaths = {
  // Auth
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/auth/reset-password',
  AUTH_VERIFY_EMAIL: '/auth/verify-email',
  AUTH_RESEND_VERIFICATION: '/auth/resend-verification',
  AUTH_OAUTH: '/auth/oauth', // + /:provider
  AUTH_OAUTH_CALLBACK: '/auth/oauth', // + /:provider/callback

  // User
  USER_PROFILE: '/user/profile',
  USER_USAGE: '/user/usage',
  USER_PREFERENCES: '/user/preferences',
  USER_DELETE: '/user/account',

  // Vehicles
  VEHICLES: '/vehicles',
  VEHICLE_BY_ID: '/vehicles', // + /:id
  VEHICLE_RECALLS: '/vehicles', // + /:id/recalls
  VEHICLE_MAINTENANCE: '/vehicles', // + /:id/maintenance

  // VIN
  VIN_DECODE: '/vin/decode',
  VIN_RECALLS: '/vin/recalls', // + /:vin
  VIN_SAFETY: '/vin/safety', // + /:vin

  // Chat
  CHAT_SESSIONS: '/chat/sessions',
  CHAT_SESSION_BY_ID: '/chat/sessions', // + /:id
  CHAT_MESSAGES: '/chat/sessions', // + /:id/messages
  CHAT_STREAM: '/chat/sessions', // + /:id/stream

  // Diagnostics
  DIAGNOSTICS: '/diagnostics',
  DIAGNOSTIC_BY_ID: '/diagnostics', // + /:id
  DIAGNOSTIC_ANALYZE: '/diagnostics/analyze',
  DIAGNOSTIC_IMAGE: '/diagnostics', // + /:id/images

  // Shops
  SHOPS_NEARBY: '/shops/nearby',
  SHOP_BY_ID: '/shops', // + /:id
  SHOP_CONTACT: '/shops', // + /:id/contact

  // Subscriptions
  SUBSCRIPTION: '/subscription',
  SUBSCRIPTION_CHECKOUT: '/subscription/checkout',
  SUBSCRIPTION_PORTAL: '/subscription/portal',
  SUBSCRIPTION_WEBHOOK: '/subscription/webhook',

  // Health
  HEALTH: '/health',
  HEALTH_READY: '/health/ready',
} as const;

export const OAuthProvider = {
  GOOGLE: 'google',
  APPLE: 'apple',
  FACEBOOK: 'facebook',
} as const;

export type OAuthProviderType = (typeof OAuthProvider)[keyof typeof OAuthProvider];

export const ChatSessionType = {
  GENERAL: 'GENERAL',
  DIAGNOSTIC: 'DIAGNOSTIC',
  REPAIR_GUIDE: 'REPAIR_GUIDE',
  PURCHASE_ADVICE: 'PURCHASE_ADVICE',
  MAINTENANCE: 'MAINTENANCE',
} as const;

export type ChatSessionTypeType = (typeof ChatSessionType)[keyof typeof ChatSessionType];

export const ChatStatus = {
  ACTIVE: 'ACTIVE',
  RESOLVED: 'RESOLVED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ChatStatusType = (typeof ChatStatus)[keyof typeof ChatStatus];

export const MessageRole = {
  USER: 'USER',
  ASSISTANT: 'ASSISTANT',
  SYSTEM: 'SYSTEM',
  FUNCTION: 'FUNCTION',
} as const;

export type MessageRoleType = (typeof MessageRole)[keyof typeof MessageRole];

export const DiagnosticStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type DiagnosticStatusType = (typeof DiagnosticStatus)[keyof typeof DiagnosticStatus];

export const UrgencyLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type UrgencyLevelType = (typeof UrgencyLevel)[keyof typeof UrgencyLevel];

export const MaintenanceServiceType = {
  OIL_CHANGE: 'oil_change',
  TIRE_ROTATION: 'tire_rotation',
  BRAKE_SERVICE: 'brake_service',
  TRANSMISSION_SERVICE: 'transmission_service',
  COOLANT_FLUSH: 'coolant_flush',
  AIR_FILTER: 'air_filter',
  SPARK_PLUGS: 'spark_plugs',
  BATTERY_REPLACEMENT: 'battery_replacement',
  TIMING_BELT: 'timing_belt',
  INSPECTION: 'inspection',
  OTHER: 'other',
} as const;

export type MaintenanceServiceTypeType =
  (typeof MaintenanceServiceType)[keyof typeof MaintenanceServiceType];
