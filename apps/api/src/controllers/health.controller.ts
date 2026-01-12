import type { Request, Response } from 'express';

import type { HealthCheckResponse } from '@myautowhiz/shared';

import { checkDatabaseConnection } from '../lib/prisma';
import { checkRedisConnection } from '../lib/redis';
import { catchAsync } from '../middleware/errorHandler';

export const healthCheck = catchAsync(async (req: Request, res: Response) => {
  const response: HealthCheckResponse = {
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'up' },
      redis: { status: 'up' },
    },
  };

  res.json(response);
});

export const readinessCheck = catchAsync(async (req: Request, res: Response) => {
  const [dbHealthy, redisHealthy] = await Promise.all([
    checkDatabaseConnection(),
    checkRedisConnection(),
  ]);

  const response: HealthCheckResponse = {
    status: dbHealthy && redisHealthy ? 'healthy' : 'unhealthy',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: dbHealthy ? 'up' : 'down' },
      redis: { status: redisHealthy ? 'up' : 'down' },
    },
  };

  const statusCode = response.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(response);
});
