import Stripe from 'stripe';

import type {
  Subscription,
  SubscriptionDetails,
  CheckoutSessionResponse,
  CustomerPortalResponse,
} from '@myautowhiz/shared';
import { SubscriptionTier, SubscriptionPricing } from '@myautowhiz/shared';

import { prisma } from '../lib/prisma';
import { StripeError, UserNotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  PRO: {
    monthly: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
  },
  FAMILY: {
    monthly: process.env.STRIPE_FAMILY_PRICE_ID || 'price_family_monthly',
    yearly: process.env.STRIPE_FAMILY_YEARLY_PRICE_ID || 'price_family_yearly',
  },
  DEALER: {
    monthly: process.env.STRIPE_DEALER_PRICE_ID || 'price_dealer_monthly',
    yearly: process.env.STRIPE_DEALER_YEARLY_PRICE_ID || 'price_dealer_yearly',
  },
};

class SubscriptionService {
  async getSubscription(userId: string): Promise<Subscription> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      throw UserNotFoundError();
    }

    let cancelAtPeriodEnd = false;
    let currentPeriodStart: Date | null = null;
    let currentPeriodEnd: Date | null = null;

    // Get details from Stripe if subscription exists
    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        cancelAtPeriodEnd = subscription.cancel_at_period_end;
        currentPeriodStart = new Date(subscription.current_period_start * 1000);
        currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      } catch (error) {
        logger.warn('Failed to retrieve Stripe subscription', { userId, error });
      }
    }

    return {
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      trialEnd: user.trialEndsAt,
    };
  }

  async getSubscriptionDetails(userId: string): Promise<SubscriptionDetails> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      throw UserNotFoundError();
    }

    const subscription = await this.getSubscription(userId);

    let paymentMethod = null;
    const invoiceHistory: SubscriptionDetails['invoiceHistory'] = [];

    if (user.stripeCustomerId) {
      try {
        // Get default payment method
        const customer = (await stripe.customers.retrieve(user.stripeCustomerId)) as Stripe.Customer;
        if (customer.invoice_settings?.default_payment_method) {
          const pm = await stripe.paymentMethods.retrieve(
            customer.invoice_settings.default_payment_method as string
          );
          if (pm.card) {
            paymentMethod = {
              type: 'card' as const,
              brand: pm.card.brand,
              last4: pm.card.last4,
              expiryMonth: pm.card.exp_month,
              expiryYear: pm.card.exp_year,
            };
          }
        }

        // Get recent invoices
        const invoices = await stripe.invoices.list({
          customer: user.stripeCustomerId,
          limit: 10,
        });

        for (const inv of invoices.data) {
          invoiceHistory.push({
            id: inv.id,
            amountDue: inv.amount_due,
            amountPaid: inv.amount_paid,
            currency: inv.currency,
            status: inv.status as SubscriptionDetails['invoiceHistory'][0]['status'],
            invoiceUrl: inv.hosted_invoice_url ?? null,
            pdfUrl: inv.invoice_pdf ?? null,
            createdAt: new Date(inv.created * 1000),
          });
        }
      } catch (error) {
        logger.warn('Failed to retrieve Stripe customer details', { userId, error });
      }
    }

    return {
      ...subscription,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      paymentMethod,
      invoiceHistory,
    };
  }

  async createCheckoutSession(
    userId: string,
    tier: 'PRO' | 'FAMILY' | 'DEALER',
    billingCycle: 'monthly' | 'yearly',
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSessionResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, stripeCustomerId: true, subscriptionTier: true },
    });

    if (!user) {
      throw UserNotFoundError();
    }

    // Prevent downgrade via checkout
    const tierOrder = { FREE: 0, PRO: 1, FAMILY: 2, DEALER: 3 };
    if (tierOrder[tier] <= tierOrder[user.subscriptionTier]) {
      throw ValidationError('Cannot downgrade subscription via checkout. Use customer portal.');
    }

    const priceId = PRICE_IDS[tier][billingCycle];

    try {
      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId },
        });
        customerId = customer.id;

        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customerId },
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        subscription_data: {
          trial_period_days: user.subscriptionTier === 'FREE' ? 7 : undefined,
          metadata: { userId, tier },
        },
        metadata: { userId, tier },
      });

      logger.info('Checkout session created', { userId, tier, sessionId: session.id });

      return {
        sessionId: session.id,
        url: session.url!,
      };
    } catch (error) {
      logger.error('Stripe checkout error', { userId, tier, error });
      throw StripeError('Failed to create checkout session');
    }
  }

  async createPortalSession(userId: string, returnUrl: string): Promise<CustomerPortalResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      throw ValidationError('No subscription to manage');
    }

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: returnUrl,
      });

      return { url: session.url };
    } catch (error) {
      logger.error('Stripe portal error', { userId, error });
      throw StripeError('Failed to create customer portal session');
    }
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    logger.info('Stripe webhook received', { type: event.type });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentFailed(invoice);
        break;
      }
    }

    // Store event for audit
    const userId = this.extractUserId(event);
    if (userId) {
      await prisma.subscriptionEvent.create({
        data: {
          userId,
          stripeEventId: event.id,
          eventType: event.type,
          eventData: event.data.object as object,
        },
      });
    }
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier as keyof typeof SubscriptionTier;

    if (!userId || !tier) {
      logger.warn('Checkout session missing metadata', { sessionId: session.id });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: tier,
        subscriptionStatus: 'ACTIVE',
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
      },
    });

    logger.info('Subscription activated via checkout', { userId, tier });
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      // Try to find by customer ID
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: subscription.customer as string },
      });
      if (!user) return;
    }

    const tier = subscription.metadata?.tier as keyof typeof SubscriptionTier;
    const status = this.mapStripeStatus(subscription.status);

    await prisma.user.updateMany({
      where: {
        OR: [
          { id: userId! },
          { stripeCustomerId: subscription.customer as string },
        ],
      },
      data: {
        subscriptionTier: tier || undefined,
        subscriptionStatus: status,
        stripeSubscriptionId: subscription.id,
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
        trialEndsAt: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
      },
    });

    logger.info('Subscription updated', { subscriptionId: subscription.id, status });
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription): Promise<void> {
    await prisma.user.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        subscriptionTier: 'FREE',
        subscriptionStatus: 'CANCELED',
        stripeSubscriptionId: null,
      },
    });

    logger.info('Subscription canceled', { subscriptionId: subscription.id });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    logger.info('Invoice paid', { invoiceId: invoice.id });
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    await prisma.user.updateMany({
      where: { stripeCustomerId: invoice.customer as string },
      data: { subscriptionStatus: 'PAST_DUE' },
    });

    logger.warn('Payment failed', { invoiceId: invoice.id });
  }

  private mapStripeStatus(
    status: Stripe.Subscription.Status
  ): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' {
    switch (status) {
      case 'active':
        return 'ACTIVE';
      case 'past_due':
        return 'PAST_DUE';
      case 'canceled':
      case 'unpaid':
        return 'CANCELED';
      case 'trialing':
        return 'TRIALING';
      default:
        return 'ACTIVE';
    }
  }

  private extractUserId(event: Stripe.Event): string | null {
    const obj = event.data.object as Record<string, unknown>;
    if (obj.metadata && typeof obj.metadata === 'object') {
      return (obj.metadata as Record<string, string>).userId || null;
    }
    return null;
  }
}

export const subscriptionService = new SubscriptionService();
