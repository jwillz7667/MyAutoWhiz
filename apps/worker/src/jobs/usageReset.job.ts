import { Job, Worker } from 'bullmq';

import { QUEUE_NAMES } from '../queues';
import { createRedisConnection } from '../lib/redis';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

interface UsageResetJobData {
  userId?: string; // If provided, reset only this user
  resetAll?: boolean; // If true, reset all users
  dryRun?: boolean; // If true, don't actually reset
}

async function processUsageResetJob(job: Job<UsageResetJobData>): Promise<{ reset: number }> {
  const { data } = job;

  logger.info('Processing usage reset job', { jobId: job.id, data });

  let resetCount = 0;

  if (data.userId) {
    // Reset specific user
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (user) {
      if (!data.dryRun) {
        await prisma.user.update({
          where: { id: data.userId },
          data: {
            monthlyVinLookups: 0,
            dailyChatMessages: 0,
            monthlyImageAnalyses: 0,
            lastUsageReset: new Date(),
          },
        });
      }

      resetCount = 1;
    }
  } else if (data.resetAll) {
    // Reset all users - batch process
    const batchSize = 100;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const users = await prisma.user.findMany({
        skip: offset,
        take: batchSize,
        select: {
          id: true,
        },
      });

      if (users.length < batchSize) {
        hasMore = false;
      }

      if (!data.dryRun) {
        // Batch update users
        await Promise.all(
          users.map(async (user: { id: string }) => {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                monthlyVinLookups: 0,
                dailyChatMessages: 0,
                monthlyImageAnalyses: 0,
                lastUsageReset: new Date(),
              },
            });
          })
        );
      }

      resetCount += users.length;
      offset += batchSize;

      // Progress update
      await job.updateProgress(Math.min(100, Math.round((offset / (offset + batchSize)) * 100)));
    }
  }

  logger.info('Usage reset job completed', {
    jobId: job.id,
    reset: resetCount,
    dryRun: data.dryRun,
  });

  return { reset: resetCount };
}

export function createUsageResetWorker(): Worker<UsageResetJobData> {
  const worker = new Worker(QUEUE_NAMES.USAGE_RESET, processUsageResetJob, {
    connection: createRedisConnection(),
    concurrency: 1, // Run one at a time
  });

  worker.on('completed', (job, result) => {
    logger.info('Usage reset job completed', { jobId: job.id, result });
  });

  worker.on('failed', (job, err) => {
    logger.error('Usage reset job failed', { jobId: job?.id, error: err.message });
  });

  return worker;
}
