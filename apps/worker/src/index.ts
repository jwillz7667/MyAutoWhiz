import 'dotenv/config';
import { Worker } from 'bullmq';

import {
  createQueueEvents,
  QUEUE_NAMES,
  recallCheckQueue,
  usageResetQueue,
  dataRetentionQueue,
  cacheRefreshQueue,
} from './queues';
import {
  createEmailWorker,
  createRecallCheckWorker,
  createUsageResetWorker,
  createDataRetentionWorker,
  createCacheRefreshWorker,
} from './jobs';
import redis from './lib/redis';
import prisma from './lib/prisma';
import logger from './lib/logger';

const workers: Worker[] = [];

async function setupScheduledJobs(): Promise<void> {
  logger.info('Setting up scheduled jobs...');

  // Recall check - daily at 6 AM UTC
  await recallCheckQueue.upsertJobScheduler(
    'daily-recall-check',
    { pattern: '0 6 * * *' }, // Cron: 6 AM daily
    {
      name: 'scheduled-recall-check',
      data: { checkAll: true },
    }
  );
  logger.info('Scheduled daily recall check job');

  // Usage reset - monthly on the 1st at midnight UTC
  await usageResetQueue.upsertJobScheduler(
    'monthly-usage-reset',
    { pattern: '0 0 1 * *' }, // Cron: midnight on 1st of month
    {
      name: 'scheduled-usage-reset',
      data: { resetAll: true },
    }
  );
  logger.info('Scheduled monthly usage reset job');

  // Data retention - weekly on Sundays at 3 AM UTC
  await dataRetentionQueue.upsertJobScheduler(
    'weekly-data-retention',
    { pattern: '0 3 * * 0' }, // Cron: 3 AM on Sundays
    {
      name: 'scheduled-data-retention',
      data: { cleanAll: true },
    }
  );
  logger.info('Scheduled weekly data retention job');

  // Cache refresh - every 4 hours
  await cacheRefreshQueue.upsertJobScheduler(
    'periodic-cache-refresh',
    { pattern: '0 */4 * * *' }, // Cron: every 4 hours
    {
      name: 'scheduled-cache-refresh',
      data: { cacheType: 'all' },
    }
  );
  logger.info('Scheduled periodic cache refresh job');

  // Initial cache warm-up
  await cacheRefreshQueue.add('initial-cache-refresh', {
    cacheType: 'all',
    forceRefresh: true,
  });
  logger.info('Queued initial cache warm-up');
}

async function startWorkers(): Promise<void> {
  logger.info('Starting workers...');

  // Create and store workers
  workers.push(createEmailWorker());
  workers.push(createRecallCheckWorker());
  workers.push(createUsageResetWorker());
  workers.push(createDataRetentionWorker());
  workers.push(createCacheRefreshWorker());

  logger.info(`Started ${workers.length} workers`);

  // Create queue event listeners
  Object.values(QUEUE_NAMES).forEach((name) => {
    createQueueEvents(name);
  });

  logger.info('Queue event listeners created');
}

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Close all workers
  await Promise.all(
    workers.map(async (worker) => {
      await worker.close();
    })
  );
  logger.info('All workers closed');

  // Close Redis connection
  await redis.quit();
  logger.info('Redis connection closed');

  // Close Prisma connection
  await prisma.$disconnect();
  logger.info('Database connection closed');

  logger.info('Graceful shutdown complete');
  process.exit(0);
}

async function main(): Promise<void> {
  try {
    logger.info('Starting MyAutoWhiz Background Worker...');

    // Verify Redis connection
    await redis.ping();
    logger.info('Redis connected');

    // Verify database connection
    await prisma.$connect();
    logger.info('Database connected');

    // Start workers
    await startWorkers();

    // Setup scheduled jobs
    await setupScheduledJobs();

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled promise rejection', { reason });
      gracefulShutdown('unhandledRejection');
    });

    logger.info('MyAutoWhiz Background Worker is running', {
      queues: Object.values(QUEUE_NAMES),
      workerCount: workers.length,
    });
  } catch (error) {
    logger.error('Failed to start worker', { error });
    process.exit(1);
  }
}

// Start the worker
main();
