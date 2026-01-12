import { Job, Worker } from 'bullmq';

import { QUEUE_NAMES } from '../queues';
import { createRedisConnection } from '../lib/redis';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

// Define subscription tier type locally to avoid Prisma client generation issues
type SubscriptionTier = 'FREE' | 'PRO' | 'FAMILY' | 'DEALER';

// Data retention periods (in days) per subscription tier
const RETENTION_PERIODS: Record<SubscriptionTier, number> = {
  FREE: 30,      // 30 days
  PRO: 180,      // 6 months
  FAMILY: 180,   // 6 months
  DEALER: 365,   // 1 year
};

interface DataRetentionJobData {
  userId?: string; // If provided, clean only this user
  cleanAll?: boolean; // If true, clean all users
  dryRun?: boolean; // If true, don't actually delete
}

interface RetentionResult {
  chatSessions: number;
  chatMessages: number;
  diagnosticSessions: number;
  vinLookups: number;
  apiLogs: number;
}

async function processDataRetentionJob(job: Job<DataRetentionJobData>): Promise<RetentionResult> {
  const { data } = job;

  logger.info('Processing data retention job', { jobId: job.id, data });

  const result: RetentionResult = {
    chatSessions: 0,
    chatMessages: 0,
    diagnosticSessions: 0,
    vinLookups: 0,
    apiLogs: 0,
  };

  if (data.userId) {
    // Clean data for specific user
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true, subscriptionTier: true },
    });

    if (user) {
      const retentionDays = RETENTION_PERIODS[user.subscriptionTier];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const userResult = await cleanUserData(user.id, cutoffDate, data.dryRun);
      result.chatSessions += userResult.chatSessions;
      result.chatMessages += userResult.chatMessages;
      result.diagnosticSessions += userResult.diagnosticSessions;
      result.vinLookups += userResult.vinLookups;
    }
  } else if (data.cleanAll) {
    // Clean data for all users based on their tier
    for (const tier of Object.keys(RETENTION_PERIODS) as SubscriptionTier[]) {
      const retentionDays = RETENTION_PERIODS[tier];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Get users for this tier
      const users = await prisma.user.findMany({
        where: { subscriptionTier: tier },
        select: { id: true },
      });

      for (const user of users) {
        const userResult = await cleanUserData(user.id, cutoffDate, data.dryRun);
        result.chatSessions += userResult.chatSessions;
        result.chatMessages += userResult.chatMessages;
        result.diagnosticSessions += userResult.diagnosticSessions;
        result.vinLookups += userResult.vinLookups;
      }

      await job.updateProgress(
        Math.round((Object.keys(RETENTION_PERIODS).indexOf(tier) + 1) / 4 * 80)
      );
    }

    // Clean old API logs (always 90 days regardless of tier)
    const apiLogCutoff = new Date();
    apiLogCutoff.setDate(apiLogCutoff.getDate() - 90);

    if (!data.dryRun) {
      const deletedLogs = await prisma.apiLog.deleteMany({
        where: {
          createdAt: { lt: apiLogCutoff },
        },
      });
      result.apiLogs = deletedLogs.count;
    } else {
      const countLogs = await prisma.apiLog.count({
        where: {
          createdAt: { lt: apiLogCutoff },
        },
      });
      result.apiLogs = countLogs;
    }
  }

  logger.info('Data retention job completed', {
    jobId: job.id,
    result,
    dryRun: data.dryRun,
  });

  return result;
}

async function cleanUserData(
  userId: string,
  cutoffDate: Date,
  dryRun?: boolean
): Promise<Omit<RetentionResult, 'apiLogs'>> {
  const result = {
    chatSessions: 0,
    chatMessages: 0,
    diagnosticSessions: 0,
    vinLookups: 0,
  };

  if (dryRun) {
    // Count what would be deleted
    result.chatMessages = await prisma.chatMessage.count({
      where: {
        session: { userId },
        createdAt: { lt: cutoffDate },
      },
    });

    result.chatSessions = await prisma.chatSession.count({
      where: {
        userId,
        createdAt: { lt: cutoffDate },
      },
    });

    result.diagnosticSessions = await prisma.diagnosticSession.count({
      where: {
        userId,
        createdAt: { lt: cutoffDate },
      },
    });

    result.vinLookups = await prisma.vinLookup.count({
      where: {
        userId,
        createdAt: { lt: cutoffDate },
      },
    });
  } else {
    // Delete old chat messages first (due to FK constraints)
    const deletedMessages = await prisma.chatMessage.deleteMany({
      where: {
        session: { userId },
        createdAt: { lt: cutoffDate },
      },
    });
    result.chatMessages = deletedMessages.count;

    // Delete old chat sessions (only those without remaining messages)
    const deletedSessions = await prisma.chatSession.deleteMany({
      where: {
        userId,
        createdAt: { lt: cutoffDate },
        messages: { none: {} },
      },
    });
    result.chatSessions = deletedSessions.count;

    // Delete old diagnostic sessions
    const deletedDiagnostics = await prisma.diagnosticSession.deleteMany({
      where: {
        userId,
        createdAt: { lt: cutoffDate },
      },
    });
    result.diagnosticSessions = deletedDiagnostics.count;

    // Delete old VIN lookups
    const deletedVinLookups = await prisma.vinLookup.deleteMany({
      where: {
        userId,
        createdAt: { lt: cutoffDate },
      },
    });
    result.vinLookups = deletedVinLookups.count;
  }

  return result;
}

export function createDataRetentionWorker(): Worker<DataRetentionJobData> {
  const worker = new Worker(QUEUE_NAMES.DATA_RETENTION, processDataRetentionJob, {
    connection: createRedisConnection(),
    concurrency: 1, // Run one at a time to avoid DB contention
  });

  worker.on('completed', (job, result) => {
    logger.info('Data retention job completed', { jobId: job.id, result });
  });

  worker.on('failed', (job, err) => {
    logger.error('Data retention job failed', { jobId: job?.id, error: err.message });
  });

  return worker;
}
