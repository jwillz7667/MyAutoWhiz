import { Router, type IRouter } from 'express';

import { shopController } from '../controllers';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { searchShopsSchema, shopIdParamSchema, contactShopSchema } from '@myautowhiz/shared';

const router: IRouter = Router();

// Public routes (with optional auth for personalization)
router.get('/search', optionalAuth, validateQuery(searchShopsSchema), shopController.searchShops);
router.get('/:id', optionalAuth, validateParams(shopIdParamSchema), shopController.getShop);

// Protected routes
router.post(
  '/:id/contact',
  authenticate,
  validateParams(shopIdParamSchema),
  validateBody(contactShopSchema),
  shopController.contactShop
);

export default router;
