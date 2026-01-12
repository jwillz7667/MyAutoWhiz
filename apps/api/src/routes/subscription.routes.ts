import { Router, type IRouter } from 'express';
import express from 'express';

import { subscriptionController } from '../controllers';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { createCheckoutSessionSchema, createPortalSessionSchema } from '@myautowhiz/shared';

const router: IRouter = Router();

// Stripe webhook (must use raw body, handled separately in app.ts)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  subscriptionController.handleWebhook
);

// Protected routes
router.get('/', authenticate, subscriptionController.getSubscription);
router.get('/details', authenticate, subscriptionController.getSubscriptionDetails);
router.post(
  '/checkout',
  authenticate,
  validateBody(createCheckoutSessionSchema),
  subscriptionController.createCheckoutSession
);
router.post(
  '/portal',
  authenticate,
  validateBody(createPortalSessionSchema),
  subscriptionController.createPortalSession
);

export default router;
