import { Router, type IRouter } from 'express';

import { healthController } from '../controllers';

const router: IRouter = Router();

// Liveness probe - basic health check
router.get('/live', healthController.healthCheck);

// Readiness probe - checks database and redis connectivity
router.get('/ready', healthController.readinessCheck);

// Alias for backwards compatibility
router.get('/', healthController.healthCheck);

export default router;
