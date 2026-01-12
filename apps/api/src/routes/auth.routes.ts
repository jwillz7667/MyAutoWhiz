import { Router, type IRouter } from 'express';

import { authController } from '../controllers';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@myautowhiz/shared';

const router: IRouter = Router();

// Public routes
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/refresh', validateBody(refreshTokenSchema), authController.refresh);
router.post('/forgot-password', validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);
router.post('/verify-email', validateBody(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification', validateBody(forgotPasswordSchema), authController.resendVerification);

// OAuth routes
router.get('/oauth/google', authController.initiateOAuth);
router.get('/oauth/google/callback', authController.oauthCallback);
router.get('/oauth/apple', authController.initiateOAuth);
router.get('/oauth/apple/callback', authController.oauthCallback);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/change-password', authenticate, authController.changePassword);

export default router;
