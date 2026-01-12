import { z } from 'zod';

import { SubscriptionTier } from '../constants/subscription';

export const createCheckoutSessionSchema = z.object({
  tier: z.enum([SubscriptionTier.PRO, SubscriptionTier.FAMILY, SubscriptionTier.DEALER]),
  billingCycle: z.enum(['monthly', 'yearly']),
  successUrl: z.string().url('Invalid success URL'),
  cancelUrl: z.string().url('Invalid cancel URL'),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;

export const createPortalSessionSchema = z.object({
  returnUrl: z.string().url('Invalid return URL'),
});

export type CreatePortalSessionInput = z.infer<typeof createPortalSessionSchema>;

export const cancelSubscriptionSchema = z.object({
  reason: z.string().max(500).optional(),
  feedback: z.string().max(2000).optional(),
  cancelImmediately: z.boolean().default(false),
});

export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;

export const reactivateSubscriptionSchema = z.object({
  tier: z.enum([SubscriptionTier.PRO, SubscriptionTier.FAMILY, SubscriptionTier.DEALER]).optional(),
});

export type ReactivateSubscriptionInput = z.infer<typeof reactivateSubscriptionSchema>;

export const updatePaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
});

export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>;

export const applyPromoCodeSchema = z.object({
  promoCode: z.string().min(1, 'Promo code is required').max(50),
});

export type ApplyPromoCodeInput = z.infer<typeof applyPromoCodeSchema>;

// Stripe webhook validation - raw body is validated by Stripe SDK
export const stripeWebhookHeaderSchema = z.object({
  'stripe-signature': z.string().min(1),
});

export type StripeWebhookHeader = z.infer<typeof stripeWebhookHeaderSchema>;
