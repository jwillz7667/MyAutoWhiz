import type { Request, Response } from 'express';
import Stripe from 'stripe';

import { createCheckoutSessionSchema, createPortalSessionSchema } from '@myautowhiz/shared';

import { subscriptionService } from '../services';
import { catchAsync } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import { StripeError } from '../utils/errors';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export const getSubscription = catchAsync(async (req: Request, res: Response) => {
  const subscription = await subscriptionService.getSubscription(req.user!.id);
  sendSuccess(res, subscription);
});

export const getSubscriptionDetails = catchAsync(async (req: Request, res: Response) => {
  const details = await subscriptionService.getSubscriptionDetails(req.user!.id);
  sendSuccess(res, details);
});

export const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const input = createCheckoutSessionSchema.parse(req.body);
  const result = await subscriptionService.createCheckoutSession(
    req.user!.id,
    input.tier,
    input.billingCycle,
    input.successUrl,
    input.cancelUrl
  );
  sendSuccess(res, result);
});

export const createPortalSession = catchAsync(async (req: Request, res: Response) => {
  const input = createPortalSessionSchema.parse(req.body);
  const result = await subscriptionService.createPortalSession(req.user!.id, input.returnUrl);
  sendSuccess(res, result);
});

export const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw StripeError('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    throw StripeError('Invalid webhook signature');
  }

  await subscriptionService.handleWebhook(event);

  res.json({ received: true });
});
