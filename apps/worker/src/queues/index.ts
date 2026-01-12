import { Queue, QueueEvents } from 'bullmq';

import { createRedisConnection } from '../lib/redis';
import logger from '../lib/logger';

// Queue names
export const QUEUE_NAMES = {
  EMAIL: 'email',
  RECALL_CHECK: 'recall-check',
  USAGE_RESET: 'usage-reset',
  DATA_RETENTION: 'data-retention',
  CACHE_REFRESH: 'cache-refresh',
} as const;

// Create queues
export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const recallCheckQueue = new Queue(QUEUE_NAMES.RECALL_CHECK, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 200,
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 60000,
    },
  },
});

export const usageResetQueue = new Queue(QUEUE_NAMES.USAGE_RESET, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 30000,
    },
  },
});

export const dataRetentionQueue = new Queue(QUEUE_NAMES.DATA_RETENTION, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 300000, // 5 minutes
    },
  },
});

export const cacheRefreshQueue = new Queue(QUEUE_NAMES.CACHE_REFRESH, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 30000,
    },
  },
});

// Queue events for monitoring
export const createQueueEvents = (queueName: string): QueueEvents => {
  const events = new QueueEvents(queueName, {
    connection: createRedisConnection(),
  });

  events.on('completed', ({ jobId, returnvalue }) => {
    logger.debug(`Job ${jobId} completed`, { queue: queueName, returnvalue });
  });

  events.on('failed', ({ jobId, failedReason }) => {
    logger.error(`Job ${jobId} failed`, { queue: queueName, failedReason });
  });

  events.on('stalled', ({ jobId }) => {
    logger.warn(`Job ${jobId} stalled`, { queue: queueName });
  });

  return events;
};

// Export all queues
export const queues = {
  email: emailQueue,
  recallCheck: recallCheckQueue,
  usageReset: usageResetQueue,
  dataRetention: dataRetentionQueue,
  cacheRefresh: cacheRefreshQueue,
};
