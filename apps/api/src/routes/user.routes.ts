import { Router, type IRouter } from 'express';

import { userController } from '../controllers';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { updateProfileSchema, deleteAccountSchema } from '@myautowhiz/shared';

const router: IRouter = Router();

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile', userController.getProfile);
router.patch('/profile', validateBody(updateProfileSchema), userController.updateProfile);

// Usage routes
router.get('/usage', userController.getUsage);

// Account management
router.delete('/account', validateBody(deleteAccountSchema), userController.deleteAccount);

export default router;
