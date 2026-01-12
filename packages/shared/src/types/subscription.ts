import type { SubscriptionTierType, SubscriptionStatusType } from '../constants/subscription';

export interface Subscription {
  tier: SubscriptionTierType;
  status: SubscriptionStatusType;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: Date | null;
}

export interface SubscriptionDetails extends Subscription {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  paymentMethod: PaymentMethodSummary | null;
  invoiceHistory: InvoiceSummary[];
}

export interface PaymentMethodSummary {
  type: 'card' | 'bank_account';
  brand: string | null; // "visa", "mastercard", etc.
  last4: string;
  expiryMonth: number | null;
  expiryYear: number | null;
}

export interface InvoiceSummary {
  id: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  invoiceUrl: string | null;
  pdfUrl: string | null;
  createdAt: Date;
}

export interface CreateCheckoutSessionRequest {
  tier: Exclude<SubscriptionTierType, 'FREE'>;
  billingCycle: 'monthly' | 'yearly';
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface CustomerPortalResponse {
  url: string;
}

export interface SubscriptionEvent {
  id: string;
  userId: string;
  stripeEventId: string;
  eventType: string;
  eventData: Record<string, unknown>;
  processedAt: Date;
}

export type StripeWebhookEventType =
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'customer.subscription.trial_will_end'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'invoice.payment_action_required'
  | 'checkout.session.completed';
