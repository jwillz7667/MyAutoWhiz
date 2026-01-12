import { Router, type IRouter } from 'express';

import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import vehicleRoutes from './vehicle.routes';
import chatRoutes from './chat.routes';
import diagnosticRoutes from './diagnostic.routes';
import shopRoutes from './shop.routes';
import subscriptionRoutes from './subscription.routes';
import vinRoutes from './vin.routes';
import healthRoutes from './health.routes';

const router: IRouter = Router();

// Health check routes (no prefix for standard probes)
router.use('/health', healthRoutes);

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/chat', chatRoutes);
router.use('/diagnostics', diagnosticRoutes);
router.use('/shops', shopRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/vin', vinRoutes);

export default router;
