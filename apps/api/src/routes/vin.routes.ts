import { Router, type IRouter } from 'express';

import { vinController } from '../controllers';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { decodeVinSchema, vinParamSchema, vinLookupQuerySchema } from '@myautowhiz/shared';

const router: IRouter = Router();

// Public VIN decode (with optional auth for tracking)
router.post('/decode', optionalAuth, validateBody(decodeVinSchema), vinController.decodeVin);

// VIN-specific data (public with optional auth)
router.get(
  '/:vin/recalls',
  optionalAuth,
  validateParams(vinParamSchema),
  vinController.getRecalls
);
router.get(
  '/:vin/safety',
  optionalAuth,
  validateParams(vinParamSchema),
  vinController.getSafetyRatings
);

// User's recent VIN lookups (protected)
router.get('/recent', authenticate, vinController.getRecentLookups);

export default router;
